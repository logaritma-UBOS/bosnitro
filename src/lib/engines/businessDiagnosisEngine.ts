import { BusinessPattern, PatternEvidence, Severity, Confidence, PatternCategory } from "./patternDetectionEngine"

export type DiagnosisId = 
  | "POSITIVE_REVENUE_PATTERN"
  | "REVENUE_MARGIN_DIVERGENCE"
  | "DEMAND_VOLUME_WEAKENING"
  | "AOV_VALUE_CHANGE"
  | "VOLUME_UP_VALUE_DOWN"
  | "VOLUME_DOWN_VALUE_UP"
  | "HIGH_REVENUE_LOW_MARGIN_MIX"
  | "PEAK_HOUR_LOW_MARGIN_MIX"
  | "PROFITABILITY_CRISIS"

export type BusinessDiagnosis = {
  diagnosisId: DiagnosisId
  title: string
  description: string
  severity: Severity
  confidence: Confidence
  evidence: PatternEvidence[]
}

const CATEGORY_PRIORITY: Record<PatternCategory, number> = {
  PROFITABILITY: 1,
  REVENUE: 2,
  TRANSACTION: 3,
  AOV: 4,
  PRODUCT_MIX: 5,
  TIME: 6,
  GROWTH: 7
}

export function generateBusinessDiagnosis(patterns: BusinessPattern[], baseConfidence: Confidence): BusinessDiagnosis[] {
  if (patterns.length === 0) return []

  const diagnoses: BusinessDiagnosis[] = []
  
  // Create a map to quickly check pattern existence
  const pMap = new Set(patterns.map(p => p.patternId))

  // Helper to gather evidence safely
  const gatherEvidence = (...patternIds: string[]): PatternEvidence[] => {
    const evidenceMap = new Map<string, PatternEvidence>()
    for (const pid of patternIds) {
      const p = patterns.find(x => x.patternId === pid)
      if (p) {
        for (const e of p.evidence) {
          evidenceMap.set(e.metric, e) // deduplicate evidence by metric
        }
      }
    }
    return Array.from(evidenceMap.values())
  }

  // Deduplication & Aggregation Rules
  
  // 1. REVENUE_MARGIN_DIVERGENCE
  if (pMap.has("REVENUE_UP_MARGIN_DOWN") || pMap.has("REVENUE_DOWN_MARGIN_UP")) {
    const isUpMarginDown = pMap.has("REVENUE_UP_MARGIN_DOWN")
    const title = isUpMarginDown ? "Omzet Naik, Margin Turun" : "Omzet Turun, Margin Naik"
    const desc = isUpMarginDown 
      ? "Omzet meningkat, namun margin keuntungan menurun. Perhatikan biaya atau proporsi produk yang terjual."
      : "Omzet menurun, namun margin keuntungan meningkat."
    
    diagnoses.push({
      diagnosisId: "REVENUE_MARGIN_DIVERGENCE",
      title,
      description: desc,
      severity: isUpMarginDown ? "HIGH" : "MEDIUM",
      confidence: baseConfidence,
      evidence: gatherEvidence("REVENUE_UP_MARGIN_DOWN", "REVENUE_DOWN_MARGIN_UP")
    })
  }

  // 2. PROFITABILITY_CRISIS
  if (pMap.has("AOV_DOWN_MARGIN_DOWN") || (pMap.has("REVENUE_DOWN_TRANSACTION_DOWN") && pMap.has("AOV_DOWN_MARGIN_DOWN"))) {
    diagnoses.push({
      diagnosisId: "PROFITABILITY_CRISIS",
      title: "Penurunan Kualitas Transaksi",
      description: "Rata-rata belanja (AOV) dan Margin menurun secara bersamaan.",
      severity: "HIGH",
      confidence: baseConfidence,
      evidence: gatherEvidence("AOV_DOWN_MARGIN_DOWN", "REVENUE_DOWN_TRANSACTION_DOWN")
    })
  } else if (pMap.has("DEMAND_VOLUME_WEAKENING") || (pMap.has("REVENUE_DOWN_TRANSACTION_DOWN") && pMap.has("REVENUE_DOWN_AOV_DOWN"))) {
    // 3. DEMAND_VOLUME_WEAKENING
    if (!diagnoses.some(d => d.diagnosisId === "REVENUE_MARGIN_DIVERGENCE")) {
      diagnoses.push({
        diagnosisId: "DEMAND_VOLUME_WEAKENING",
        title: "Penurunan Volume & Omzet",
        description: "Terjadi pelemahan transaksi dan omzet secara beriringan.",
        severity: "HIGH",
        confidence: baseConfidence,
        evidence: gatherEvidence("REVENUE_DOWN_TRANSACTION_DOWN", "REVENUE_DOWN_AOV_DOWN")
      })
    }
  }

  // 4. POSITIVE_REVENUE_PATTERN
  if (pMap.has("REVENUE_UP_TRANSACTION_UP") || pMap.has("REVENUE_UP_AOV_UP")) {
    if (!pMap.has("REVENUE_UP_MARGIN_DOWN")) { // Deduplicate against divergence
      diagnoses.push({
        diagnosisId: "POSITIVE_REVENUE_PATTERN",
        title: "Pertumbuhan Omzet Positif",
        description: "Omzet meningkat seiring dengan peningkatan metrik utama.",
        severity: "INFO",
        confidence: baseConfidence,
        evidence: gatherEvidence("REVENUE_UP_TRANSACTION_UP", "REVENUE_UP_AOV_UP")
      })
    }
  }

  // 5. VOLUME_UP_VALUE_DOWN
  if (pMap.has("TRANSACTION_UP_AOV_DOWN")) {
    if (!diagnoses.some(d => d.diagnosisId === "REVENUE_MARGIN_DIVERGENCE")) {
      diagnoses.push({
        diagnosisId: "VOLUME_UP_VALUE_DOWN",
        title: "Transaksi Naik, Nilai Turun",
        description: "Jumlah transaksi meningkat, namun rata-rata belanja menurun.",
        severity: "MEDIUM",
        confidence: baseConfidence,
        evidence: gatherEvidence("TRANSACTION_UP_AOV_DOWN")
      })
    }
  }

  // 6. VOLUME_DOWN_VALUE_UP
  if (pMap.has("TRANSACTION_DOWN_AOV_UP")) {
     if (!diagnoses.some(d => d.diagnosisId === "REVENUE_MARGIN_DIVERGENCE")) {
       diagnoses.push({
        diagnosisId: "VOLUME_DOWN_VALUE_UP",
        title: "Transaksi Turun, Nilai Naik",
        description: "Jumlah transaksi menurun, namun rata-rata belanja per nota naik.",
        severity: "MEDIUM",
        confidence: baseConfidence,
        evidence: gatherEvidence("TRANSACTION_DOWN_AOV_UP")
      })
     }
  }

  // 7. HIGH_REVENUE_LOW_MARGIN_MIX
  if (pMap.has("HIGH_REVENUE_LOW_MARGIN_MIX")) {
    diagnoses.push({
      diagnosisId: "HIGH_REVENUE_LOW_MARGIN_MIX",
      title: "Produk Omzet Tinggi Bermargin Rendah",
      description: "Ditemukan produk yang menyumbang omzet besar tetapi marginnya di bawah rata-rata bisnis.",
      severity: "WATCH",
      confidence: baseConfidence,
      evidence: []
    })
  }

  // 8. PEAK_HOUR_LOW_MARGIN_MIX
  if (pMap.has("PEAK_HOUR_LOW_MARGIN_MIX")) {
    diagnoses.push({
      diagnosisId: "PEAK_HOUR_LOW_MARGIN_MIX",
      title: "Jam Ramai Margin Rendah",
      description: "Periode transaksi tertinggi dipenuhi oleh pesanan bermargin rendah.",
      severity: "WATCH",
      confidence: baseConfidence,
      evidence: []
    })
  }

  // Filter and deduplicate to make sure we don't send too many overlapping diagnoses
  // Sort by severity (HIGH > MEDIUM > WATCH > INFO)
  const severityWeight: Record<Severity, number> = { HIGH: 4, MEDIUM: 3, WATCH: 2, INFO: 1 }
  
  diagnoses.sort((a, b) => {
    // 1. Sort by severity weight
    if (severityWeight[a.severity] !== severityWeight[b.severity]) {
      return severityWeight[b.severity] - severityWeight[a.severity]
    }
    return 0
  })

  // Keep max 3 diagnoses
  return diagnoses.slice(0, 3)
}
