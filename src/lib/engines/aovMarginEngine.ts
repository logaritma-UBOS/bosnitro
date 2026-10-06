import { calculateAOV, calculateGrossProfit, calculateMargin } from "./mathEngine"
import { calculateProductPerformance } from "./productPerformanceEngine"

export type ProductMixQuadrant = "PAHLAWAN_BISNIS" | "VOLUME_TINGGI_MARGIN_PERHATIAN" | "MARGIN_BAGUS_VOLUME_PERHATIAN" | "PERLU_EVALUASI"

export type ProductMixDetail = {
  productId: string
  productName: string
  revenue: number
  margin: number
  quadrant: ProductMixQuadrant
}

export type AOVMarginAnalysisResult = {
  currentAOV: number
  previousAOV: number
  aovChangePercentage: number
  currentGrossProfit: number
  currentMargin: number
  previousGrossProfit: number
  previousMargin: number
  marginChangePercentage: number
  transactionCount: number
  totalOmzet: number
  totalHPP: number
  confidence: "LOW" | "MEDIUM" | "HIGH"
  productMix: ProductMixDetail[]
  insights: string[]
}

type SaleItemInput = {
  productId: string
  product: { name: string }
  quantity: number
  priceAtSale: number
  hppAtSale: number
}
type SaleInput = {
  id: string
  createdAt: Date
  totalAmount: number
  saleItems: SaleItemInput[]
}

export function calculateAOVMarginAnalysis(
  currentSales: SaleInput[],
  previousSales: SaleInput[],
  activeDays: number
): AOVMarginAnalysisResult {
  
  // CURRENT METRICS
  let currentOmzet = 0
  let currentHPP = 0
  
  for (const sale of currentSales) {
    currentOmzet += sale.totalAmount
    for (const item of sale.saleItems) {
      currentHPP += (item.hppAtSale * item.quantity)
    }
  }

  const transactionCount = currentSales.length
  const currentAOV = calculateAOV(currentOmzet, transactionCount)
  const currentGrossProfit = calculateGrossProfit(currentOmzet, currentHPP)
  const currentMargin = calculateMargin(currentGrossProfit, currentOmzet)

  // PREVIOUS METRICS
  let previousOmzet = 0
  let previousHPP = 0
  
  for (const sale of previousSales) {
    previousOmzet += sale.totalAmount
    for (const item of sale.saleItems) {
      previousHPP += (item.hppAtSale * item.quantity)
    }
  }

  const prevTxCount = previousSales.length
  const previousAOV = calculateAOV(previousOmzet, prevTxCount)
  const previousGrossProfit = calculateGrossProfit(previousOmzet, previousHPP)
  const previousMargin = calculateMargin(previousGrossProfit, previousOmzet)

  // PERCENTAGE CHANGES
  let aovChangePercentage = 0
  if (previousAOV === 0) {
    if (currentAOV > 0) aovChangePercentage = 100
  } else {
    aovChangePercentage = ((currentAOV - previousAOV) / previousAOV) * 100
  }

  let marginChangePercentage = 0
  if (previousMargin === 0) {
    if (currentMargin > 0) marginChangePercentage = 100
  } else {
    marginChangePercentage = ((currentMargin - previousMargin) / Math.abs(previousMargin)) * 100
  }

  // CONFIDENCE
  let minDate = new Date()
  let maxDate = new Date(0)
  for (const sale of currentSales) {
    if (sale.createdAt < minDate) minDate = sale.createdAt
    if (sale.createdAt > maxDate) maxDate = sale.createdAt
  }

  const daysDiff = currentSales.length > 0 ? (maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24) : 0
  let confidence: "LOW" | "MEDIUM" | "HIGH" = "LOW"
  if (daysDiff >= 7 && transactionCount >= 50) {
    confidence = "HIGH"
  } else if (daysDiff >= 3 && transactionCount >= 15) {
    confidence = "MEDIUM"
  } else {
    confidence = "LOW"
  }

  // PRODUCT MIX (Only evaluate if confidence is not extremely low or if there are sales)
  const productMix: ProductMixDetail[] = []
  if (currentSales.length > 0) {
    const productPerf = calculateProductPerformance(currentSales, [], activeDays)
    
    // Average Product Revenue (only for salesVolume > 0)
    const activeProducts = productPerf.filter(p => p.salesVolume > 0)
    const activeCount = activeProducts.length
    
    // Note: The formula is (Total Current Revenue) / (Jumlah Produk Unik terjual)
    const averageProductRevenue = activeCount > 0 ? currentOmzet / activeCount : 0
    const businessAverageMargin = currentMargin

    for (const p of activeProducts) {
      let quadrant: ProductMixQuadrant = "PERLU_EVALUASI"
      
      const isHighRevenue = p.revenue > averageProductRevenue
      const isHighMargin = p.margin >= businessAverageMargin

      if (isHighRevenue && isHighMargin) {
        quadrant = "PAHLAWAN_BISNIS"
      } else if (isHighRevenue && !isHighMargin) {
        quadrant = "VOLUME_TINGGI_MARGIN_PERHATIAN"
      } else if (!isHighRevenue && isHighMargin) {
        quadrant = "MARGIN_BAGUS_VOLUME_PERHATIAN"
      }

      productMix.push({
        productId: p.productId,
        productName: p.productName,
        revenue: p.revenue,
        margin: p.margin,
        quadrant
      })
    }
  }

  // INSIGHTS (Mathematical observation only, no causality)
  const insights: string[] = []
  
  if (confidence === "LOW") {
    insights.push("Data belum cukup merepresentasikan rata-rata AOV dan Margin stabil.")
  } else {
    // AOV Insight
    if (aovChangePercentage > 0) {
      insights.push(`Rata-rata belanja (AOV) naik ${Math.round(aovChangePercentage)}% dari periode sebelumnya.`)
    } else if (aovChangePercentage < 0) {
      insights.push(`Rata-rata belanja (AOV) turun ${Math.abs(Math.round(aovChangePercentage))}% dari periode sebelumnya.`)
    }

    // Margin Insight
    if (marginChangePercentage > 0) {
      insights.push(`Margin bisnis naik dari ${previousMargin}% menjadi ${currentMargin}%.`)
    } else if (marginChangePercentage < 0) {
      insights.push(`Margin bisnis turun dari ${previousMargin}% menjadi ${currentMargin}%.`)
    }
  }

  return {
    currentAOV,
    previousAOV,
    aovChangePercentage,
    currentGrossProfit,
    currentMargin,
    previousGrossProfit,
    previousMargin,
    marginChangePercentage,
    transactionCount,
    totalOmzet: currentOmzet,
    totalHPP: currentHPP,
    confidence,
    productMix,
    insights
  }
}
