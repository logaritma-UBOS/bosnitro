import { BusinessDiagnosis, DiagnosisId } from "./businessDiagnosisEngine"
import { Confidence } from "./patternDetectionEngine"
import { RecommendationAction, ActionRiskLevel } from "./recommendationEngineV2"
import { ProductMixQuadrant } from "./aovMarginEngine"
import { ProductInventoryFact } from "./inventoryContextEngine"

export type EvidenceStrength = "WEAK" | "MEDIUM" | "STRONG"

function calculateEvidenceStrength(diagnosis: BusinessDiagnosis, confidence: Confidence): EvidenceStrength {
  if (confidence === "LOW") return "WEAK"
  
  if (!diagnosis.evidence || diagnosis.evidence.length === 0) {
    return "WEAK"
  }

  // Find max absolute delta among evidence to gauge strength
  let maxDelta = 0
  for (const ev of diagnosis.evidence) {
    const absDelta = Math.abs(ev.changePercentage)
    if (absDelta > maxDelta) {
      maxDelta = absDelta
    }
  }

  if (maxDelta < 5) {
    return "WEAK" // Flat/noise
  }

  if (confidence === "HIGH" && maxDelta > 15) {
    return "STRONG"
  }

  return "MEDIUM"
}

const CONFLICT_GROUPS: Record<string, string[]> = {
  "MARGIN_VS_VOLUME": ["REC_PREMIUM_FOCUS", "REC_VOLUME_WEAKENING"]
}

const SEVERITY_WEIGHT = { HIGH: 4, MEDIUM: 3, WATCH: 2, INFO: 1 }
const EVIDENCE_WEIGHT = { STRONG: 3, MEDIUM: 2, WEAK: 1 }

export function applyDecisionGuardrail(
  candidates: RecommendationAction[],
  diagnoses: BusinessDiagnosis[],
  confidence: Confidence,
  productMix: { productId: string, quadrant: ProductMixQuadrant }[] = [],
  inventoryContext: Record<string, ProductInventoryFact> = {}
): RecommendationAction[] {
  // RULE 1: CONFIDENCE GUARD
  if (confidence === "LOW") {
    return []
  }

  const validActions: RecommendationAction[] = []
  
  // Create diagnosis lookup
  const diagMap = new Map<DiagnosisId, BusinessDiagnosis>()
  for (const d of diagnoses) {
    diagMap.set(d.diagnosisId, d)
  }

  for (const action of candidates) {
    // RULE 7: CRITICAL GUARD
    if (action.priority === "CRITICAL") {
      continue // Suppress all CRITICAL for MVP
    }

    const diag = diagMap.get(action.relatedDiagnosisId)

    // RULE 2: EVIDENCE GUARD (Missing Diagnosis or Empty Evidence)
    if (!diag) continue
    if (!diag.evidence || diag.evidence.length === 0) continue

    // RULE 3: EVIDENCE STRENGTH GUARD
    const evidenceStrength = calculateEvidenceStrength(diag, confidence)
    if (evidenceStrength === "WEAK") {
      continue // Suppress noise or flat deltas
    }

    // RULE 4: RISK GUARD
    if (action.riskLevel === "HIGH_RISK") {
      if (confidence !== "HIGH" || evidenceStrength !== "STRONG") {
        continue // High risk needs High confidence & Strong evidence
      }
    } else if (action.riskLevel === "MEDIUM_RISK") {
      // MEDIUM_RISK needs at least MEDIUM confidence, which is guaranteed here since LOW is returned at the top
    }

    // RULE 8: INVENTORY CONTEXT GUARD
    let shouldSuppressByInventory = false

    // Identify target products based on the recommendation's specific intent
    let targetProducts: string[] = []
    let isVolumePush = false

    if (action.actionId === "REC_REPRICE_HIGH_REV") {
      // Reprice high revenue = VOLUME_TINGGI_MARGIN_PERHATIAN (CASH COW)
      targetProducts = productMix.filter(p => p.quadrant === "VOLUME_TINGGI_MARGIN_PERHATIAN").map(p => p.productId)
    } else if (action.actionId === "REC_PREMIUM_FOCUS") {
      // Premium focus = PAHLAWAN_BISNIS (STAR)
      targetProducts = productMix.filter(p => p.quadrant === "PAHLAWAN_BISNIS").map(p => p.productId)
    } else if (action.actionId === "REC_CROSS_SELL" || action.actionId === "REC_VOLUME_WEAKENING") {
      // Generic volume push / cross-sell. We don't have a single specific target, 
      // but if the entire inventory is heavily depleted, we shouldn't push volume.
      // For now, let's only suppress if explicitly mapped targets are OOS, or apply a general check.
      isVolumePush = true
      targetProducts = productMix.map(p => p.productId) // All products in mix
    }

    if (targetProducts.length > 0) {
      let allTargetsUntracked = true
      let allTrackedAreOutOfStock = true
      let anyTrackedIsLowStock = false
      let hasTrackedTarget = false

      for (const pid of targetProducts) {
        const inv = inventoryContext[pid]
        if (inv && inv.hasRecipe) {
          allTargetsUntracked = false
          hasTrackedTarget = true
          if (!inv.isOutOfStock) {
            allTrackedAreOutOfStock = false
          }
          if (inv.isLowStock) {
            anyTrackedIsLowStock = true
          }
        }
      }

      if (hasTrackedTarget) {
        // Hard suppression: If we are specifically targeting products, and ALL tracked targets are OUT_OF_STOCK
        if (allTrackedAreOutOfStock && (action.actionId === "REC_REPRICE_HIGH_REV" || action.actionId === "REC_PREMIUM_FOCUS")) {
          shouldSuppressByInventory = true
        }

        // Additional guard: If it's a volume push, and ALL tracked products are OUT_OF_STOCK
        if (allTrackedAreOutOfStock && isVolumePush) {
           shouldSuppressByInventory = true
        }
        
        // Low Stock guard: If it's a volume push, and ANY targeted product is LOW_STOCK, suppress
        // (As requested: "LOW_STOCK sebaiknya menjadi guard tambahan untuk rekomendasi yang bersifat promosi")
        if (isVolumePush && anyTrackedIsLowStock) {
          shouldSuppressByInventory = true
        }
      }
    }

    if (shouldSuppressByInventory) {
      continue
    }

    validActions.push(action)
  }

  // RULE 5: CONFLICT RESOLUTION
  // If MARGIN_VS_VOLUME conflict exists, keep the one with higher severity/evidence.
  let resolvedActions = [...validActions]
  for (const [groupName, actionIds] of Object.entries(CONFLICT_GROUPS)) {
    const conflicting = resolvedActions.filter(a => actionIds.includes(a.actionId))
    if (conflicting.length > 1) {
      // Pick the winner
      conflicting.sort((a, b) => {
        const diagA = diagMap.get(a.relatedDiagnosisId)!
        const diagB = diagMap.get(b.relatedDiagnosisId)!
        
        // 1. Severity
        if (SEVERITY_WEIGHT[diagA.severity] !== SEVERITY_WEIGHT[diagB.severity]) {
          return SEVERITY_WEIGHT[diagB.severity] - SEVERITY_WEIGHT[diagA.severity]
        }
        
        // 2. Evidence Strength
        const strA = calculateEvidenceStrength(diagA, confidence)
        const strB = calculateEvidenceStrength(diagB, confidence)
        if (EVIDENCE_WEIGHT[strA] !== EVIDENCE_WEIGHT[strB]) {
          return EVIDENCE_WEIGHT[strB] - EVIDENCE_WEIGHT[strA]
        }
        
        // 3. Fallback priority (Profitability wins)
        if (a.impactArea === "PROFITABILITY") return -1
        if (b.impactArea === "PROFITABILITY") return 1
        
        return 0
      })
      
      const winner = conflicting[0]
      // Remove losers from resolvedActions
      const losers = conflicting.slice(1).map(x => x.actionId)
      resolvedActions = resolvedActions.filter(a => !losers.includes(a.actionId))
    }
  }

  // RULE 6: DEDUPLICATION
  // Duplicate based on impactArea
  const deduplicated: RecommendationAction[] = []
  const seenImpactAreas = new Set<string>()

  // Sort before deduplicating so we keep the most important one
  resolvedActions.sort((a, b) => {
    const diagA = diagMap.get(a.relatedDiagnosisId)!
    const diagB = diagMap.get(b.relatedDiagnosisId)!
    
    // 1. Severity
    if (SEVERITY_WEIGHT[diagA.severity] !== SEVERITY_WEIGHT[diagB.severity]) {
      return SEVERITY_WEIGHT[diagB.severity] - SEVERITY_WEIGHT[diagA.severity]
    }
    
    // 2. Evidence Strength
    const strA = calculateEvidenceStrength(diagA, confidence)
    const strB = calculateEvidenceStrength(diagB, confidence)
    if (EVIDENCE_WEIGHT[strA] !== EVIDENCE_WEIGHT[strB]) {
      return EVIDENCE_WEIGHT[strB] - EVIDENCE_WEIGHT[strA]
    }

    // 3. Risk Level (Lower risk wins if all equal)
    const RISK_WEIGHT = { LOW_RISK: 1, MEDIUM_RISK: 2, HIGH_RISK: 3 }
    return RISK_WEIGHT[a.riskLevel] - RISK_WEIGHT[b.riskLevel]
  })

  for (const action of resolvedActions) {
    if (!seenImpactAreas.has(action.impactArea)) {
      deduplicated.push(action)
      seenImpactAreas.add(action.impactArea)
    }
  }

  // RULE 7: SATURATION
  // Max 3 recommendations
  return deduplicated.slice(0, 3)
}
