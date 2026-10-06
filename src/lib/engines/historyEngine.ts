import { calculateAOV } from "./mathEngine"

type BaseSale = {
  totalAmount: number
}

export function calculateHistoryMetrics(sales: BaseSale[]) {
  let totalOmzet = 0
  
  for (const sale of sales) {
    totalOmzet += sale.totalAmount
  }
  
  const totalTransaksi = sales.length
  const aov = calculateAOV(totalOmzet, totalTransaksi)
  
  return {
    totalOmzet,
    totalTransaksi,
    aov
  }
}
