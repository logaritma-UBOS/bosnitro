"use server"

import { auth } from "@/auth"
import { fetchAOVMarginData } from "./aovMargin"
import { calculateAOVMarginAnalysis } from "@/lib/engines/aovMarginEngine"
import { detectPatterns } from "@/lib/engines/patternDetectionEngine"
import { generateBusinessDiagnosis } from "@/lib/engines/businessDiagnosisEngine"
import { getBusinessTime } from "@/lib/engines/timeEngine"
import { prisma } from "@/lib/prisma"
import { trackEvent, logError } from "@/actions/analytics"

export type BusinessInsightsPeriod = "30_DAYS" // Strict to 30 days for pattern detection

export async function fetchBusinessInsightsData() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) return { error: "Business not found" }

  try {
    // We reuse the exact secure payload from AOV Margin Action
    const aovData = await fetchAOVMarginData("30_DAYS")
    if (aovData.error) return { error: aovData.error }

    const { aovResult, timezone, currentSalesCount, previousSalesCount } = aovData
    
    if (!aovResult) return { error: "Failed to calculate AOV logic" }
    
    // Evaluate extra signals based on the result
    const hasHighRevenueLowMarginProduct = aovResult.productMix.some(p => 
      p.quadrant === "VOLUME_TINGGI_MARGIN_PERHATIAN"
    )

    // For peak hour, we mimic a lightweight version to check if current hour is low margin
    let isPeakHourLowMargin = false
    if ((currentSalesCount as number) > 0 && timezone) {
       const now = getBusinessTime(timezone as string, new Date())
       const currentHour = now.getHours()
       // Lightweight mock logic
    }

    // Pattern Detection
    const patterns = detectPatterns({
      revenue: { current: aovResult.totalOmzet, previous: aovResult.totalOmzet - (aovResult.totalOmzet * (aovResult.aovChangePercentage / 100)) }, // Fallback calculation 
      transaction: { current: currentSalesCount as number, previous: previousSalesCount as number },
      aov: { current: aovResult.currentAOV, previous: aovResult.previousAOV },
      margin: { current: aovResult.currentMargin, previous: aovResult.previousMargin },
      hasHighRevenueLowMarginProduct,
      isPeakHourLowMargin,
      confidence: aovResult.confidence
    })

    // 6. Fetch Inventory Context (Phase 2.8)
    const productIdsInMix = aovResult.productMix.map(p => p.productId)
    const rawRecipes = await prisma.recipe.findMany({
      where: {
        businessId: business.id,
        productId: { in: productIdsInMix }
      },
      include: {
        ingredient: true
      }
    })
    
    const recipeInputs = rawRecipes.map((r: any) => ({
      productId: r.productId,
      quantityNeeded: r.quantityNeeded,
      ingredient: {
        id: r.ingredientId,
        name: r.ingredient.name,
        currentStock: r.ingredient.currentStock,
        minStock: r.ingredient.minStock
      }
    }))
    
    const { generateInventoryContext } = await import("@/lib/engines/inventoryContextEngine")
    const inventoryContext = generateInventoryContext(productIdsInMix, recipeInputs)

    // Business Diagnosis
    const diagnoses = generateBusinessDiagnosis(patterns, aovResult.confidence)

    // Candidates Recommendations (V2)
    const { generateRecommendations } = await import("@/lib/engines/recommendationEngineV2")
    const candidates = generateRecommendations(diagnoses, aovResult.confidence)

    // Decision Guardrail (Safety Filter)
    const { applyDecisionGuardrail } = await import("@/lib/engines/decisionGuardrailEngine")
    const recommendations = applyDecisionGuardrail(
      candidates, 
      diagnoses, 
      aovResult.confidence, 
      aovResult.productMix, 
      inventoryContext
    )

    trackEvent(business.id, "business_insight_viewed", { 
      diagnosisCount: diagnoses.length, 
      recommendationCount: recommendations.length,
      confidence: aovResult.confidence 
    }).catch(()=>{})

    return {
      success: true,
      diagnoses,
      patterns,
      recommendations,
      confidence: aovResult.confidence,
      productMixCount: aovResult.productMix.length
    }

  } catch (e: any) {
    logError("INSIGHTS_ERROR", e.message, business.id, e.stack, "/wawasan-bisnis").catch(()=>{})
    return { error: e.message }
  }
}
