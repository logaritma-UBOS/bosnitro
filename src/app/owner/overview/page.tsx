import { authorizeOwner } from "@/actions/ownerAuth"
import { prisma } from "@/lib/prisma"
import { OwnerUnavailableState } from "@/components/owner/OwnerComponents"

export const dynamic = "force-dynamic"

export default async function OwnerOverviewPage() {
  await authorizeOwner().catch(() => {})

  // 1. Data Actual (Omzet Ekosistem)
  const sales = await prisma.sale.aggregate({ 
    _sum: { totalAmount: true },
    _count: { id: true }
  })
  const actualTotal = sales._sum.totalAmount || 0
  const totalTransactions = sales._count.id || 0

  // 2. Data Target (Agregasi Target UMKM)
  const goals = await prisma.goal.aggregate({ _sum: { targetOmzet: true } })
  // Jika database belum memiliki goal sama sekali, fallback ke target awal 0
  const targetTotal = goals._sum.targetOmzet || 0 

  // 3. Kalkulasi Gap & Estimasi AOV
  const gapTotal = Math.max(0, targetTotal - actualTotal)
  const progressPercent = targetTotal > 0 ? Math.min(100, Math.round((actualTotal / targetTotal) * 100)) : (actualTotal > 0 ? 100 : 0)

  // Real AOV calculation instead of hardcode
  const averageAov = totalTransactions > 0 ? actualTotal / totalTransactions : 0
  const remainingTx = gapTotal > 0 && averageAov > 0 ? Math.ceil(gapTotal / averageAov) : 0

  // 4. Rekomendasi Teratas (Tindakan Cepat)
  const recs = await prisma.recommendation.findMany({
    where: { status: "ACTIVE" },
    orderBy: { priorityScore: "desc" },
    take: 1
  })
  const topRecommendationTitle = recs[0]?.causeText || "Pantau Aktivitas Bisnis"
  const actionSuggestion = recs[0]?.actionText || "Tinjau kinerja tenant yang belum memenuhi target harian."

  // 5. Agregasi Riil Masalah Utama (Gap Analysis)
  // Menghitung jumlah masalah berdasarkan metricType dari engine rekomendasi
  const problemAggregation = await prisma.recommendation.groupBy({
    by: ['metricType'],
    _count: { _all: true },
    orderBy: { _count: { metricType: 'desc' } },
    take: 3
  })
  const totalProblems = await prisma.recommendation.count()

  // Helper untuk mengubah metricType Enum DB menjadi teks manusiawi
  const formatMetricType = (metric: string) => {
    if (metric === "OMZET") return "Toko Sepi (Traffic/Omzet Turun)"
    if (metric === "AOV") return "Pembelian Kecil (AOV Rendah)"
    if (metric === "FREQUENCY") return "Pelanggan Jarang Kembali"
    return metric
  }

  // Generate UI mapping for problems based on DB percentages
  const problemColors = ["bg-rose-400", "bg-amber-400", "bg-blue-400"]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Ringkasan Kondisi Usaha</h1>
        <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
          Metrik Global Ekosistem
        </span>
      </div>

      {/* Grid Alur Metode Logaritma: Target -> Realisasi -> Selisih -> Aksi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. Target */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">1. Target Keseluruhan</span>
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="text-2xl font-bold text-slate-900">Rp {targetTotal.toLocaleString('id-ID')}</div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Akumulasi target omzet seluruh mitra</p>
        </div>

        {/* 2. Realisasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">2. Realisasi (Actual)</span>
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="text-2xl font-bold text-slate-900">Rp {actualTotal.toLocaleString('id-ID')}</div>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-2">{progressPercent}% dari target tercapai</p>
        </div>

        {/* 3. Selisih (Gap) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">3. Kekurangan (Gap)</span>
              <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            </div>
            <div className="text-2xl font-bold text-rose-600">-Rp {gapTotal.toLocaleString('id-ID')}</div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Butuh estimasi {remainingTx}x transaksi lagi</p>
        </div>

        {/* 4. Solusi & Rekomendasi */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">4. Tindakan Cepat</span>
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="text-sm font-bold text-slate-900 line-clamp-2">{topRecommendationTitle}</div>
          </div>
          <p className="text-xs text-blue-600 font-medium mt-2 line-clamp-2">{actionSuggestion}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Kendala Utama (Penyebab Kurang Target)</h2>
          <div className="space-y-4">
            {problemAggregation.length > 0 ? (
              problemAggregation.map((prob, index) => {
                const percent = Math.round((prob._count._all / totalProblems) * 100)
                return (
                  <div key={prob.metricType}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{formatMetricType(prob.metricType)}</span>
                      <span className="text-slate-500">{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${problemColors[index % problemColors.length]}`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-sm text-slate-500 py-4 text-center">Belum ada data kendala tercatat.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Target Bisnis Terbanyak</h2>
          <OwnerUnavailableState 
            title="Belum Terhubung" 
            message="Data target bisnis belum di-aggregate dari aplikasi merchant UBOS dan COWAY." 
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Daftar Solusi & Menu Aksi</h2>
          <OwnerUnavailableState 
            title="Belum Terhubung" 
            message="Mesin pemetaan solusi belum menghasilkan laporan agregasi lintas platform." 
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Tingkat Keberhasilan Aksi</h2>
          <OwnerUnavailableState 
            title="Belum Terhubung" 
            message="Laporan konversi eksekusi promosi masih dalam proses update Logaritma Core." 
          />
        </div>
      </div>
    </div>
  )
}
