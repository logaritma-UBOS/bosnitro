import { prisma } from "@/lib/prisma"

// --- PENJUALAN (OMZET) ---
export async function calculateOmzet(businessId: string, startDate: Date, endDate: Date): Promise<number> {
  const sales = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    where: { businessId, createdAt: { gte: startDate, lte: endDate } }
  })
  return sales._sum.totalAmount || 0
}

export async function calculateTransactionCount(businessId: string, startDate: Date, endDate: Date): Promise<number> {
  return await prisma.sale.count({
    where: { businessId, createdAt: { gte: startDate, lte: endDate } }
  })
}

export function calculateAOV(omzet: number, transactionCount: number): number {
  if (transactionCount === 0) return 0
  return Math.round(omzet / transactionCount)
}

// --- HPP (MODAL TERJUAL) ---
export async function calculateTotalHPP(businessId: string, startDate: Date, endDate: Date): Promise<number> {
  const sales = await prisma.sale.findMany({
    where: { businessId, createdAt: { gte: startDate, lte: endDate } },
    include: { saleItems: true }
  })
  
  let totalHpp = 0
  for (const sale of sales) {
    for (const item of sale.saleItems) {
      totalHpp += (item.hppAtSale * item.quantity)
    }
  }
  return totalHpp
}

// --- PENGELUARAN (EXPENSES) ---
export async function calculateExpenses(businessId: string, startDate: Date, endDate: Date): Promise<number> {
  const expenses = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { businessId, date: { gte: startDate, lte: endDate } }
  })
  return expenses._sum.amount || 0
}

// --- KEUNTUNGAN ---
export function calculateGrossProfit(omzet: number, totalHpp: number): number {
  return Math.max(0, omzet - totalHpp)
}

export function calculateNetProfit(grossProfit: number, expenses: number): number {
  return grossProfit - expenses
}

export function calculateMargin(profit: number, omzet: number): number {
  if (omzet === 0) return 0
  return Math.round((profit / omzet) * 100)
}

// --- TARGET & GAP ---
export function calculateDailyTarget(targetOmzetBulanan: number, operatingDaysBulanan: number = 30): number {
  return Math.round(targetOmzetBulanan / operatingDaysBulanan)
}

export function calculateGap(target: number, actual: number): number {
  return Math.max(0, target - actual)
}

export function calculateTargetTransactions(gap: number, aov: number, fallbackTargetHarian: number): number {
  const activeAov = aov > 0 ? aov : fallbackTargetHarian
  return Math.ceil(gap / (activeAov || 1))
}

// --- STOK (STOCK COVERAGE) ---
export function calculateStockCoverage(currentStock: number, averageDailyUsage: number): number {
  if (averageDailyUsage <= 0) return 0
  return Math.floor(currentStock / averageDailyUsage)
}
