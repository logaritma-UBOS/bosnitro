import { calculateAOV } from "./mathEngine"
import { getBusinessTime } from "./timeEngine"

type SaleData = {
  createdAt: Date
  totalAmount: number
}

export type HourlyMetric = {
  hour: number
  transactionCount: number
  omzet: number
  aov: number
}

export type SalesTimeAnalysisResult = {
  hourlyMetrics: HourlyMetric[]
  peakTransactionHour: number | null
  peakRevenueHour: number | null
  peakAOVHour: number | null
  currentBusinessHour: number
  isPeakHourActive: boolean
  peakHourStatus: "UPCOMING" | "ACTIVE" | "PASSED"
  hourlyTrend: { currentOmzet: number, previousOmzet: number, trendPercentage: number }
  confidence: "LOW" | "MEDIUM" | "HIGH"
  insights: string[]
}

export function calculateSalesTimeAnalysis(
  timezone: string,
  currentSales: SaleData[],
  previousSales: SaleData[],
  nowUTC: Date = new Date()
): SalesTimeAnalysisResult {

  const businessNow = getBusinessTime(timezone, nowUTC)
  const currentBusinessHour = businessNow.getHours()
  
  // Aggregate current sales by hour
  const hoursMap = new Map<number, { count: number, omzet: number }>()
  for (let i = 0; i < 24; i++) {
    hoursMap.set(i, { count: 0, omzet: 0 })
  }

  let minDate = new Date(nowUTC)
  let maxDate = new Date(0)

  for (const sale of currentSales) {
    if (sale.createdAt < minDate) minDate = sale.createdAt
    if (sale.createdAt > maxDate) maxDate = sale.createdAt

    const localTime = getBusinessTime(timezone, sale.createdAt)
    const h = localTime.getHours()
    const current = hoursMap.get(h)!
    current.count += 1
    current.omzet += sale.totalAmount
  }

  const hourlyMetrics: HourlyMetric[] = []
  for (let i = 0; i < 24; i++) {
    const data = hoursMap.get(i)!
    hourlyMetrics.push({
      hour: i,
      transactionCount: data.count,
      omzet: data.omzet,
      aov: calculateAOV(data.omzet, data.count)
    })
  }

  // Peak Transaction Hour: count > omzet > earliest
  let peakTx = -1
  let peakTxData = { count: -1, omzet: -1 }
  
  // Peak Revenue Hour: omzet > count > earliest
  let peakRev = -1
  let peakRevData = { omzet: -1, count: -1 }
  
  // Peak AOV Hour: aov > omzet > earliest
  let peakAOV = -1
  let peakAOVData = { aov: -1, omzet: -1 }

  for (const m of hourlyMetrics) {
    if (m.transactionCount === 0) continue

    // TX logic
    if (m.transactionCount > peakTxData.count) {
      peakTx = m.hour; peakTxData = { count: m.transactionCount, omzet: m.omzet }
    } else if (m.transactionCount === peakTxData.count) {
      if (m.omzet > peakTxData.omzet) {
        peakTx = m.hour; peakTxData = { count: m.transactionCount, omzet: m.omzet }
      }
    }

    // REV logic
    if (m.omzet > peakRevData.omzet) {
      peakRev = m.hour; peakRevData = { omzet: m.omzet, count: m.transactionCount }
    } else if (m.omzet === peakRevData.omzet) {
      if (m.transactionCount > peakRevData.count) {
        peakRev = m.hour; peakRevData = { omzet: m.omzet, count: m.transactionCount }
      }
    }

    // AOV logic
    if (m.aov > peakAOVData.aov) {
      peakAOV = m.hour; peakAOVData = { aov: m.aov, omzet: m.omzet }
    } else if (m.aov === peakAOVData.aov) {
      if (m.omzet > peakAOVData.omzet) {
        peakAOV = m.hour; peakAOVData = { aov: m.aov, omzet: m.omzet }
      }
    }
  }

  const pTx = peakTx === -1 ? null : peakTx
  const pRev = peakRev === -1 ? null : peakRev
  const pAOV = peakAOV === -1 ? null : peakAOV

  // Peak Status (based on Transaction Peak as primary business crowdedness indicator)
  const isPeakHourActive = pTx !== null && currentBusinessHour === pTx
  let peakHourStatus: "UPCOMING" | "ACTIVE" | "PASSED" = "UPCOMING"
  
  if (pTx !== null) {
    if (currentBusinessHour === pTx) peakHourStatus = "ACTIVE"
    else if (currentBusinessHour > pTx) peakHourStatus = "PASSED"
  }

  // Trend Equivalent Period
  let currentTotal = 0
  for (const s of currentSales) currentTotal += s.totalAmount
  let previousTotal = 0
  for (const s of previousSales) previousTotal += s.totalAmount

  let trendPercentage = 0
  if (previousTotal === 0) {
    if (currentTotal > 0) trendPercentage = 100 // Just up
  } else {
    trendPercentage = ((currentTotal - previousTotal) / previousTotal) * 100
  }

  const hourlyTrend = {
    currentOmzet: currentTotal,
    previousOmzet: previousTotal,
    trendPercentage
  }

  // Confidence Rules
  const daysDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24)
  const totalTx = currentSales.length
  
  let confidence: "LOW" | "MEDIUM" | "HIGH" = "LOW"
  if (daysDiff >= 7 && totalTx >= 50) {
    confidence = "HIGH"
  } else if (daysDiff >= 3 && totalTx >= 15) {
    confidence = "MEDIUM"
  }

  // Insights
  const insights: string[] = []
  
  if (confidence === "LOW") {
    insights.push("Data transaksi masih terlalu sedikit untuk menentukan pola jam paling ramai.")
  } else {
    if (pTx !== null) {
      const start = String(pTx).padStart(2, '0') + ".00"
      const end = String((pTx + 1) % 24).padStart(2, '0') + ".00"
      const maxTx = hourlyMetrics.find(h => h.hour === pTx)?.transactionCount || 0
      insights.push(`Jam ${start}-${end} paling ramai (${maxTx} transaksi).`)
    }
    
    if (pAOV !== null) {
      const startAov = String(pAOV).padStart(2, '0') + ".00"
      const endAov = String((pAOV + 1) % 24).padStart(2, '0') + ".00"
      insights.push(`Rata-rata belanja (AOV) tertinggi terjadi pada jam ${startAov}-${endAov}.`)
    }

    if (peakHourStatus === "ACTIVE") {
      insights.push("Jam ramai sedang berlangsung.")
    } else if (peakHourStatus === "PASSED") {
      insights.push("Jam ramai sudah lewat.")
    }
  }

  return {
    hourlyMetrics,
    peakTransactionHour: pTx,
    peakRevenueHour: pRev,
    peakAOVHour: pAOV,
    currentBusinessHour,
    isPeakHourActive,
    peakHourStatus,
    hourlyTrend,
    confidence,
    insights
  }
}
