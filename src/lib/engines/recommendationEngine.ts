import { DataConfidence } from "./dataConfidence"

export type Recommendation = {
  ruleId: string
  priority: number
  type: string
  causeText: string
  actionText: string
  expectedResult: string
  sourceMetrics?: any
}

export function generateRecommendations(params: {
  targetOmzet: number
  actualOmzet: number
  targetTransactions: number
  actualTransactions: number
  targetAOV: number
  actualAOV: number
  marginDrop: boolean
  highExpense: boolean         // NEW: expenses > 30% of omzet
  expenses: number             // NEW: total expenses today
  netProfit: number            // NEW: omzet - hpp - expenses
  lowStockItems: string[]
  confidence: DataConfidence
}): Recommendation[] {
  const {
    targetOmzet, actualOmzet,
    targetTransactions, actualTransactions,
    targetAOV, actualAOV,
    marginDrop, highExpense, expenses, netProfit,
    lowStockItems, confidence
  } = params

  // PRIORITY 1: Data Tidak Cukup
  if (confidence === "LOW") {
    return [{
      ruleId: "RULE_5_LOW_DATA",
      priority: 100,
      type: "DATA",
      causeText: "Data transaksi belum cukup untuk analisis akurat.",
      actionText: "Catat penjualan rutin selama 2 hari ke depan.",
      expectedResult: "Sistem dapat mendiagnosa kelemahan toko."
    }]
  }

  const recs: Recommendation[] = []

  // PRIORITY 2: Critical Stock
  if (lowStockItems.length > 0) {
    recs.push({
      ruleId: "RULE_4_LOW_STOCK",
      priority: 90,
      type: "STOCK",
      causeText: `Stok ${lowStockItems.join(", ")} hampir habis. Target masih kurang.`,
      actionText: "Prioritas utama: Segera tambah stok hari ini.",
      expectedResult: "Tidak kehilangan omzet karena kehabisan barang."
    })
  }

  // PRIORITY 3: Margin Drop — omzet oke tapi untung tipis karena HPP naik
  if (actualOmzet >= targetOmzet && marginDrop && !highExpense) {
    recs.push({
      ruleId: "RULE_3_MARGIN_DROP",
      priority: 82,
      type: "MARGIN",
      causeText: "Omzet capai target, tapi keuntungan bersih tipis karena modal/HPP membengkak.",
      actionText: "Periksa harga bahan baku yang sedang naik di menu Katalog.",
      expectedResult: "Margin kembali normal tanpa perlu capek nambah pelanggan."
    })
  }

  // PRIORITY 3b: High Expense — pengeluaran operasional terlalu besar
  if (highExpense) {
    recs.push({
      ruleId: "RULE_6_HIGH_EXPENSE",
      priority: 80,
      type: "EXPENSE",
      causeText: `Pengeluaran operasional hari ini terlalu tinggi dan menggerus keuntungan bersih.`,
      actionText: "Tinjau catatan pengeluaran hari ini. Efisiensi di mana bisa dikurangi.",
      expectedResult: "Untung bersih meningkat tanpa harus naikkan omzet."
    })
  }

  // Jika target belum tercapai (Gap > 0)
  if (actualOmzet < targetOmzet) {
    const aovIsClose = actualAOV >= (targetAOV * 0.8)
    const txIsClose = actualTransactions >= (targetTransactions * 0.8)

    // PRIORITY 4: Low AOV
    if (txIsClose && !aovIsClose) {
      recs.push({
        ruleId: "RULE_2_LOW_AOV",
        priority: 70,
        type: "AOV",
        causeText: "Toko ramai, tapi rata-rata belanjanya terlalu kecil.",
        actionText: "Lakukan Up-Selling (Tawarkan tambah es teh/kerupuk di kasir).",
        expectedResult: `Omzet naik tanpa perlu cari pelanggan baru.`
      })
    }
    // PRIORITY 5: Low Transactions
    else if (!txIsClose && aovIsClose) {
      recs.push({
        ruleId: "RULE_1_LOW_TX",
        priority: 60,
        type: "TRANSACTION",
        causeText: "Pelanggan belanja cukup banyak, tapi jumlah orangnya kurang.",
        actionText: "Sebarkan promo di grup WA / tawarkan diskon kecil untuk pancing pelanggan baru.",
        expectedResult: `Tambah pelanggan lagi hari ini.`
      })
    }
    // Both low
    else {
      recs.push({
        ruleId: "RULE_GENERAL_LOW",
        priority: 50,
        type: "GENERAL",
        causeText: "Toko sepi dan belanjaan rata-rata kecil.",
        actionText: "Fokus tawarkan paket bundling agar keranjang belanja lebih besar.",
        expectedResult: "Kejar omzet lebih cepat dengan sedikit pembeli."
      })
    }
  }

  // Jika sukses dan aman (omzet tercapai, margin sehat, pengeluaran normal)
  if (actualOmzet >= targetOmzet && !marginDrop && !highExpense && recs.length === 0) {
    recs.push({
      ruleId: "RULE_0_SUCCESS",
      priority: 10,
      type: "SUCCESS",
      causeText: "Target omzet hari ini sudah tercapai dan keuangan sehat.",
      actionText: "Pertahankan performa atau dorong up-sell kecil-kecilan.",
      expectedResult: "Tutup toko dengan tenang."
    })
  }

  return recs.sort((a, b) => b.priority - a.priority)
}
