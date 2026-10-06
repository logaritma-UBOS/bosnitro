import { calculateGrossProfit, calculateMargin } from "./mathEngine"

export type ProductPerformanceMetric = {
  productId: string
  productName: string
  salesVolume: number
  transactionCount: number
  revenue: number
  revenueContribution: number
  hpp: number
  grossProfit: number
  grossProfitContribution: number
  margin: number
  salesVelocity: number
  trend: "UP" | "DOWN" | "FLAT" | "NEW"
  trendPercentage: number
}

// Minimal data contract required for engine
type SaleItemInput = {
  productId: string
  product: { name: string }
  quantity: number
  priceAtSale: number
  hppAtSale: number
}
type SaleInput = {
  id: string
  saleItems: SaleItemInput[]
}

export function calculateProductPerformance(
  currentSales: SaleInput[], 
  previousSales: SaleInput[], 
  activeDays: number
): ProductPerformanceMetric[] {
  
  // Aggregate current period
  const productMap = new Map<string, any>()
  let totalRevenue = 0
  let totalGrossProfit = 0

  for (const sale of currentSales) {
    const saleTxProducts = new Set<string>()
    for (const item of sale.saleItems) {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.product.name,
          salesVolume: 0,
          transactionCount: 0,
          revenue: 0,
          hpp: 0,
          grossProfit: 0
        })
      }
      
      const p = productMap.get(item.productId)
      p.salesVolume += item.quantity
      const itemRev = item.priceAtSale * item.quantity
      const itemHpp = item.hppAtSale * item.quantity
      const itemGp = calculateGrossProfit(itemRev, itemHpp)
      
      p.revenue += itemRev
      p.hpp += itemHpp
      p.grossProfit += itemGp
      
      if (!saleTxProducts.has(item.productId)) {
        p.transactionCount += 1
        saleTxProducts.add(item.productId)
      }

      totalRevenue += itemRev
      totalGrossProfit += itemGp
    }
  }

  // Aggregate previous period for trend comparison
  const prevMap = new Map<string, number>()
  for (const sale of previousSales) {
    for (const item of sale.saleItems) {
      const rev = item.priceAtSale * item.quantity
      prevMap.set(item.productId, (prevMap.get(item.productId) || 0) + rev)
    }
  }

  // Calculate derivatives
  const result: ProductPerformanceMetric[] = []
  
  for (const [id, p] of Array.from(productMap.entries())) {
    const revenueContribution = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0
    const grossProfitContribution = totalGrossProfit > 0 ? (p.grossProfit / totalGrossProfit) * 100 : 0
    const margin = calculateMargin(p.grossProfit, p.revenue)
    const salesVelocity = activeDays > 0 ? p.salesVolume / activeDays : p.salesVolume

    let trend: "UP" | "DOWN" | "FLAT" | "NEW" = "NEW"
    let trendPercentage = 0
    
    if (prevMap.has(id)) {
      const prevRev = prevMap.get(id)!
      if (prevRev === 0) {
        if (p.revenue > 0) trend = "UP"
        else trend = "FLAT"
      } else {
        const diff = p.revenue - prevRev
        trendPercentage = (diff / prevRev) * 100
        if (trendPercentage > 0) trend = "UP"
        else if (trendPercentage < 0) trend = "DOWN"
        else trend = "FLAT"
      }
    }

    result.push({
      productId: id,
      productName: p.productName,
      salesVolume: p.salesVolume,
      transactionCount: p.transactionCount,
      revenue: p.revenue,
      revenueContribution,
      hpp: p.hpp,
      grossProfit: p.grossProfit,
      grossProfitContribution,
      margin,
      salesVelocity,
      trend,
      trendPercentage
    })
  }

  return result
}

export function generateRecommendationContext(metrics: ProductPerformanceMetric[]) {
  if (metrics.length === 0) return null

  // Sortings for context
  const byVol = [...metrics].sort((a, b) => b.salesVolume - a.salesVolume)
  const byRev = [...metrics].sort((a, b) => b.revenue - a.revenue)
  const byProfit = [...metrics].sort((a, b) => b.grossProfit - a.grossProfit)
  const byMargin = [...metrics].sort((a, b) => b.margin - a.margin)
  
  const declining = metrics.filter(m => m.trend === "DOWN")
  const rising = metrics.filter(m => m.trend === "UP")
  const lowVelocity = metrics.filter(m => m.salesVelocity < 1) // e.g. < 1 per day

  return {
    topSellingProduct: byVol[0],
    highestRevenueProduct: byRev[0],
    highestProfitProduct: byProfit[0],
    highestMarginProduct: byMargin[0],
    lowVelocityProducts: lowVelocity,
    decliningProducts: declining,
    risingProducts: rising,
  }
}
