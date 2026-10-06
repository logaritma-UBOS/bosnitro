export function calculateAOV(omzet: number, transactionCount: number): number {
  if (transactionCount === 0) return 0
  return Math.round(omzet / transactionCount)
}

export function calculateGrossProfit(omzet: number, totalHpp: number): number {
  return Math.max(0, omzet - totalHpp)
}

export function calculateMargin(profit: number, omzet: number): number {
  if (omzet === 0) return 0
  return Math.round((profit / omzet) * 100)
}
