import { prisma } from "@/lib/prisma"
import { getTransactions, getExpenses } from "@/lib/interlockingDb"

// --- PENJUALAN (OMZET) ---
export async function calculateOmzet(businessId: string, startDate: Date, endDate: Date): Promise<number> {
  let dbOmzet = 0
  try {
    const sales = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: { businessId, createdAt: { gte: startDate, lte: endDate } }
    })
    dbOmzet = sales._sum.totalAmount || 0
  } catch (e) {}

  // Tarik transaksi masuk dari semua cabang di sistem interlocking
  const liveTxs = await getTransactions("ALL")
  const liveOmzet = liveTxs
    .filter(t => {
      const d = new Date(t.createdAt)
      return d >= startDate && d <= endDate && t.status === "COMPLETED"
    })
    .reduce((sum, t) => sum + t.totalAmount, 0)

  return dbOmzet + liveOmzet
}

export async function calculateTransactionCount(businessId: string, startDate: Date, endDate: Date): Promise<number> {
  let dbCount = 0
  try {
    dbCount = await prisma.sale.count({
      where: { businessId, createdAt: { gte: startDate, lte: endDate } }
    })
  } catch (e) {}

  const liveTxs = await getTransactions("ALL")
  const liveCount = liveTxs.filter(t => {
    const d = new Date(t.createdAt)
    return d >= startDate && d <= endDate && t.status === "COMPLETED"
  }).length

  return dbCount + liveCount
}

export function calculateAOV(omzet: number, transactionCount: number): number {
  if (transactionCount === 0) return 0
  return Math.round(omzet / transactionCount)
}

// --- HPP (MODAL TERJUAL) ---
export async function calculateTotalHPP(businessId: string, startDate: Date, endDate: Date): Promise<number> {
  let dbHpp = 0
  try {
    const sales = await prisma.sale.findMany({
      where: { businessId, createdAt: { gte: startDate, lte: endDate } },
      include: { saleItems: true }
    })
    for (const sale of sales) {
      for (const item of sale.saleItems) {
        dbHpp += (item.hppAtSale * item.quantity)
      }
    }
  } catch (e) {}

  const liveTxs = await getTransactions("ALL")
  const liveHpp = liveTxs
    .filter(t => {
      const d = new Date(t.createdAt)
      return d >= startDate && d <= endDate && t.status === "COMPLETED"
    })
    .reduce((sum, t) => sum + (t.totalCostPrice || 0), 0)

  return dbHpp + liveHpp
}

// --- PENGELUARAN (EXPENSES - OPERASIONAL SELURUH CABANG) ---
export async function calculateExpenses(businessId: string, startDate: Date, endDate: Date): Promise<number> {
  let dbExpenses = 0
  try {
    const expenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { businessId, date: { gte: startDate, lte: endDate } }
    })
    dbExpenses = expenses._sum.amount || 0
  } catch (e) {}

  // Tarik data transaksi keluar (pengeluaran) dari masing-masing cabang terakumulasi
  const liveExpenses = await getExpenses("ALL")
  const liveExp = liveExpenses
    .filter(e => {
      const d = new Date(e.date)
      return d >= startDate && d <= endDate
    })
    .reduce((sum, e) => sum + e.amount, 0)

  return dbExpenses + liveExp
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
