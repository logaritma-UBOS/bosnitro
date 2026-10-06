export type DataConfidence = "LOW" | "MEDIUM" | "HIGH"

export function assessDataConfidence(
  daysWithData: number, 
  totalTransactions: number,
  isSetupComplete: boolean
): DataConfidence {
  if (!isSetupComplete || daysWithData < 2 || totalTransactions < 5) {
    return "LOW"
  }
  if (daysWithData >= 2 && daysWithData <= 14 && totalTransactions >= 5) {
    return "MEDIUM"
  }
  return "HIGH"
}
