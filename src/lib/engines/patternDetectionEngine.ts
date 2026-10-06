export type PatternCategory = "GROWTH" | "REVENUE" | "TRANSACTION" | "AOV" | "PROFITABILITY" | "PRODUCT_MIX" | "TIME"
export type Direction = "UP" | "DOWN" | "FLAT"
export type Severity = "INFO" | "WATCH" | "MEDIUM" | "HIGH"
export type Confidence = "LOW" | "MEDIUM" | "HIGH"

export type PatternEvidence = {
  metric: string
  currentValue: number
  previousValue: number
  changePercentage: number
}

export type BusinessPattern = {
  patternId: string
  category: PatternCategory
  severity: Severity
  confidence: Confidence
  evidence: PatternEvidence[]
}

export type PatternDetectionInput = {
  revenue: { current: number, previous: number }
  transaction: { current: number, previous: number }
  aov: { current: number, previous: number }
  margin: { current: number, previous: number }
  hasHighRevenueLowMarginProduct: boolean
  isPeakHourLowMargin: boolean
  confidence: Confidence
}

const FLAT_THRESHOLD = 5

function getDirection(changePercentage: number): Direction {
  if (Math.abs(changePercentage) < FLAT_THRESHOLD) return "FLAT"
  return changePercentage > 0 ? "UP" : "DOWN"
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

export function detectPatterns(input: PatternDetectionInput): BusinessPattern[] {
  const patterns: BusinessPattern[] = []
  
  if (input.confidence === "LOW") {
    // If confidence is low, we don't confidently output major patterns, but we still detect math signals
    // as INFO severity. The prompt says deterministic, so we process anyway.
  }

  const revChange = calculateChange(input.revenue.current, input.revenue.previous)
  const txChange = calculateChange(input.transaction.current, input.transaction.previous)
  const aovChange = calculateChange(input.aov.current, input.aov.previous)
  const marginChange = input.margin.current - input.margin.current === 0 ? 0 : calculateChange(input.margin.current, input.margin.previous) // Margin is already percentage, but we use relative change here for direction if we want, OR absolute point change? The prompt says "changePercentage". Let's use relative change.
  const marginRelativeChange = calculateChange(input.margin.current, input.margin.previous)

  const revDir = getDirection(revChange)
  const txDir = getDirection(txChange)
  const aovDir = getDirection(aovChange)
  const marginDir = getDirection(marginRelativeChange)

  const revEvidence: PatternEvidence = { metric: "Revenue", currentValue: input.revenue.current, previousValue: input.revenue.previous, changePercentage: revChange }
  const txEvidence: PatternEvidence = { metric: "Transaction", currentValue: input.transaction.current, previousValue: input.transaction.previous, changePercentage: txChange }
  const aovEvidence: PatternEvidence = { metric: "AOV", currentValue: input.aov.current, previousValue: input.aov.previous, changePercentage: aovChange }
  const marginEvidence: PatternEvidence = { metric: "Margin", currentValue: input.margin.current, previousValue: input.margin.previous, changePercentage: marginRelativeChange }

  // REVENUE_UP_AOV_UP
  if (revDir === "UP" && aovDir === "UP") {
    patterns.push({
      patternId: "REVENUE_UP_AOV_UP",
      category: "GROWTH",
      severity: "INFO",
      confidence: input.confidence,
      evidence: [revEvidence, aovEvidence]
    })
  }

  // REVENUE_UP_TRANSACTION_UP
  if (revDir === "UP" && txDir === "UP") {
    patterns.push({
      patternId: "REVENUE_UP_TRANSACTION_UP",
      category: "GROWTH",
      severity: "INFO",
      confidence: input.confidence,
      evidence: [revEvidence, txEvidence]
    })
  }

  // REVENUE_DOWN_TRANSACTION_DOWN
  if (revDir === "DOWN" && txDir === "DOWN") {
    patterns.push({
      patternId: "REVENUE_DOWN_TRANSACTION_DOWN",
      category: "REVENUE",
      severity: "HIGH",
      confidence: input.confidence,
      evidence: [revEvidence, txEvidence]
    })
  }

  // REVENUE_DOWN_AOV_DOWN
  if (revDir === "DOWN" && aovDir === "DOWN") {
    patterns.push({
      patternId: "REVENUE_DOWN_AOV_DOWN",
      category: "REVENUE",
      severity: "HIGH",
      confidence: input.confidence,
      evidence: [revEvidence, aovEvidence]
    })
  }

  // REVENUE_UP_MARGIN_DOWN
  if (revDir === "UP" && marginDir === "DOWN") {
    patterns.push({
      patternId: "REVENUE_UP_MARGIN_DOWN",
      category: "PROFITABILITY",
      severity: "HIGH",
      confidence: input.confidence,
      evidence: [revEvidence, marginEvidence]
    })
  }

  // REVENUE_DOWN_MARGIN_UP
  if (revDir === "DOWN" && marginDir === "UP") {
    patterns.push({
      patternId: "REVENUE_DOWN_MARGIN_UP",
      category: "PROFITABILITY",
      severity: "MEDIUM",
      confidence: input.confidence,
      evidence: [revEvidence, marginEvidence]
    })
  }

  // TRANSACTION_UP_AOV_DOWN
  if (txDir === "UP" && aovDir === "DOWN") {
    patterns.push({
      patternId: "TRANSACTION_UP_AOV_DOWN",
      category: "AOV",
      severity: "MEDIUM",
      confidence: input.confidence,
      evidence: [txEvidence, aovEvidence]
    })
  }

  // TRANSACTION_DOWN_AOV_UP
  if (txDir === "DOWN" && aovDir === "UP") {
    patterns.push({
      patternId: "TRANSACTION_DOWN_AOV_UP",
      category: "AOV",
      severity: "MEDIUM",
      confidence: input.confidence,
      evidence: [txEvidence, aovEvidence]
    })
  }

  // AOV_UP_MARGIN_DOWN
  if (aovDir === "UP" && marginDir === "DOWN") {
    patterns.push({
      patternId: "AOV_UP_MARGIN_DOWN",
      category: "PROFITABILITY",
      severity: "HIGH",
      confidence: input.confidence,
      evidence: [aovEvidence, marginEvidence]
    })
  }

  // AOV_DOWN_MARGIN_DOWN
  if (aovDir === "DOWN" && marginDir === "DOWN") {
    patterns.push({
      patternId: "AOV_DOWN_MARGIN_DOWN",
      category: "PROFITABILITY",
      severity: "HIGH",
      confidence: input.confidence,
      evidence: [aovEvidence, marginEvidence]
    })
  }

  // HIGH_REVENUE_LOW_MARGIN_MIX
  if (input.hasHighRevenueLowMarginProduct) {
    patterns.push({
      patternId: "HIGH_REVENUE_LOW_MARGIN_MIX",
      category: "PRODUCT_MIX",
      severity: "WATCH",
      confidence: input.confidence,
      evidence: [] // Evidence will be supplied by UI context or extra details
    })
  }

  // PEAK_HOUR_LOW_MARGIN_MIX
  if (input.isPeakHourLowMargin) {
    patterns.push({
      patternId: "PEAK_HOUR_LOW_MARGIN_MIX",
      category: "TIME",
      severity: "WATCH",
      confidence: input.confidence,
      evidence: []
    })
  }

  return patterns
}
