import { calculateOmzet, calculateTransactionCount, calculateAOV, calculateDailyTarget, calculateGap, calculateTargetTransactions, calculateTotalHPP, calculateExpenses, calculateGrossProfit, calculateNetProfit } from "./calculationEngine"
import { assessDataConfidence } from "./dataConfidence"
import { generateRecommendations } from "./recommendationEngine"
import { prisma } from "@/lib/prisma"
import { getStartOfDayUTC } from "./timeEngine"

export async function runLogaritmaEngine(businessId: string) {
  // 1. Dapatkan business dan timezone-nya terlebih dahulu
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { goals: true, settings: true }
  })
  if (!business) throw new Error("Business not found")

  const tz = business.settings?.timezone || "Asia/Jakarta"

  // 2. Dapatkan periode (Hari ini) berdasarkan Timezone yang benar
  const today = getStartOfDayUTC(tz)
  const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)

  // 3. Eksekusi Query metrik secara Paralel (termasuk Expenses)
  const [
    actualOmzet,
    actualTransactions,
    firstSale,
    totalSalesCount,
    ingredients,
    actualHpp,
    actualExpenses,
    recentSales           // Untuk hitung targetAOV dari data historis
  ] = await Promise.all([
    calculateOmzet(businessId, today, endOfDay),
    calculateTransactionCount(businessId, today, endOfDay),
    prisma.sale.findFirst({ where: { businessId }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    prisma.sale.count({ where: { businessId } }),
    prisma.ingredient.findMany({ where: { businessId }, select: { name: true, currentStock: true } }),
    calculateTotalHPP(businessId, today, endOfDay),
    calculateExpenses(businessId, today, endOfDay),
    // Ambil data 7 hari terakhir untuk targetAOV yang realistis
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        businessId,
        createdAt: {
          gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          lte: endOfDay
        }
      }
    })
  ])

  const targetOmzetBulanan = business.goals[0]?.targetOmzet || 0
  // Fix: gunakan 30 hari sebagai default, atau operatingDays * 4 jika tersedia
  const hariOperasionalBulanan = business.operatingDays > 0 ? business.operatingDays * 4 : 30
  const targetOmzetHarian = calculateDailyTarget(targetOmzetBulanan, hariOperasionalBulanan)

  // 4. Hitung Aktual & Target
  const actualAOV = calculateAOV(actualOmzet, actualTransactions)

  // Fix targetAOV: gunakan AOV historis 7 hari jika ada, fallback ke 20000
  const historicalOmzet7d = recentSales._sum.totalAmount || 0
  const historicalTx7d = recentSales._count.id || 0
  const targetAOV = historicalTx7d > 3
    ? Math.round(historicalOmzet7d / historicalTx7d)
    : 20000

  const gap = calculateGap(targetOmzetHarian, actualOmzet)
  const targetTransactionsTotal = Math.ceil(targetOmzetHarian / (targetAOV || 20000))
  const targetTransactionsSisa = calculateTargetTransactions(gap, actualAOV, targetOmzetHarian)

  // 5. Hitung Profitabilitas (integrasi Pengeluaran)
  const grossProfit = calculateGrossProfit(actualOmzet, actualHpp)
  const netProfit = calculateNetProfit(grossProfit, actualExpenses)

  // 6. Deteksi marginDrop yang nyata:
  //    - netProfit kurang dari 50% grossProfit (biaya operasional > 50% laba kotor)
  //    - atau netProfit negatif meski sudah ada omzet
  const marginDrop = actualOmzet > 0 && (
    netProfit < grossProfit * 0.5 ||
    (actualExpenses > 0 && actualExpenses > actualHpp * 0.5)
  )

  // 7. Deteksi High Expense:
  //    Pengeluaran operasional > 30% dari omzet hari ini
  const highExpense = actualOmzet > 0 && actualExpenses > actualOmzet * 0.30

  // 8. Data Confidence
  const daysWithData = firstSale
    ? Math.ceil((Date.now() - firstSale.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isSetupComplete = true
  const confidence = assessDataConfidence(daysWithData, totalSalesCount, isSetupComplete)

  // 9. Cek Stok Kurang
  const lowStockItems: string[] = []
  for (const ing of ingredients) {
    if (ing.currentStock <= 0) lowStockItems.push(ing.name)
  }

  // 10. Generate Recommendations (dengan data expenses & profitabilitas)
  const recommendations = generateRecommendations({
    targetOmzet: targetOmzetHarian,
    actualOmzet,
    targetTransactions: targetTransactionsTotal,
    actualTransactions,
    targetAOV,
    actualAOV,
    marginDrop,
    highExpense,
    expenses: actualExpenses,
    netProfit,
    lowStockItems,
    confidence
  })

  // 11. Susun Hasil Engine
  return {
    targetHarian: targetOmzetHarian,
    sudahMasuk: actualOmzet,
    masihKurang: gap,
    butuhTransaksiSisa: targetTransactionsSisa,
    aovAktual: actualAOV,
    rekomendasiUtama: recommendations[0] || null,
    confidence,
    lowStockItems,
    // Data keuangan baru — tersedia untuk dashboard & analisis
    grossProfit,
    netProfit,
    expenses: actualExpenses,
    hpp: actualHpp,
    marginDrop,
    highExpense
  }
}
