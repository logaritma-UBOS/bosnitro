"use client"
import { formatNumber, formatRupiah } from '@/lib/format';

import { useState, useEffect } from "react"
import Link from "next/link"
import { fetchAOVMarginData, AOVMarginPeriodFilter } from "@/actions/aovMargin"
import { calculateAOVMarginAnalysis, AOVMarginAnalysisResult, ProductMixQuadrant } from "@/lib/engines/aovMarginEngine"

export default function AOVMarginClient() {
  const [period, setPeriod] = useState<AOVMarginPeriodFilter>("30_DAYS")
  const [result, setResult] = useState<AOVMarginAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchAOVMarginData(period)
        if (res.error) {
          setError(res.error)
          return
        }

        if (res.aovResult) {
          setResult(res.aovResult)
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [period])

  const getQuadrantInfo = (q: ProductMixQuadrant) => {
    switch (q) {
      case "PAHLAWAN_BISNIS": return { label: "Pahlawan Bisnis", color: "bg-blue-100 text-blue-800", desc: "Omzet tinggi, Margin tinggi" }
      case "VOLUME_TINGGI_MARGIN_PERHATIAN": return { label: "Cek Margin", color: "bg-orange-100 text-orange-800", desc: "Omzet tinggi, Margin rendah" }
      case "MARGIN_BAGUS_VOLUME_PERHATIAN": return { label: "Cek Volume", color: "bg-yellow-100 text-yellow-800", desc: "Margin tinggi, Omzet rendah" }
      case "PERLU_EVALUASI": return { label: "Perlu Evaluasi", color: "bg-red-100 text-red-800", desc: "Omzet rendah, Margin rendah" }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* --- DESKTOP HEADER --- */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-4 lg:px-8 py-4 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1">
              &larr; Kembali ke Beranda
            </Link>
            <h1 className="text-xl font-bold text-slate-900">AOV & Margin</h1>
            <p className="text-slate-500 text-xs mt-0.5">Analisis kualitas dan profitabilitas pesanan.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 rounded-lg p-1 flex">
              {(["TODAY", "7_DAYS", "30_DAYS"] as AOVMarginPeriodFilter[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`py-1.5 px-3 rounded-md text-sm font-semibold transition-colors ${
                    period === p ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {p === "TODAY" ? "Hari Ini" : p === "7_DAYS" ? "7 Hari" : "30 Hari"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden bg-indigo-700 text-white p-4 pb-6 shrink-0 rounded-b-3xl shadow-sm z-10 relative">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-white text-sm font-semibold opacity-90 hover:opacity-100">
            &larr; Beranda
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-1">AOV & Margin</h1>
        <p className="text-indigo-100 text-sm">Analisis kualitas dan profitabilitas pesanan.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-4 md:mt-0 relative z-20">
        
        {/* MOBILE PERIOD SELECTOR */}
        <div className="md:hidden bg-white rounded-xl shadow-sm border border-slate-100 p-2 mb-6 flex gap-2 overflow-x-auto no-scrollbar">
          {(["TODAY", "7_DAYS", "30_DAYS"] as AOVMarginPeriodFilter[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors min-w-[80px] ${
                period === p ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {p === "TODAY" ? "Hari Ini" : p === "7_DAYS" ? "7 Hari" : "30 Hari"}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 border border-red-100 font-medium">
            Error: {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-700 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Menganalisis margin...</p>
          </div>
        ) : !result ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-100">
            <div className="text-4xl mb-3">🛒</div>
            <p className="text-slate-900 font-bold mb-1">Gagal memuat data</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* CONFIDENCE & INSIGHTS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-12 space-y-3">
                {result.confidence === "LOW" && (
                  <div className="bg-warning-50 text-warning-800 p-3 rounded-lg text-sm font-semibold flex items-center gap-2 border border-warning-200">
                    <span className="text-lg">⚠️</span> Data masih terlalu sedikit untuk tren stabil.
                  </div>
                )}
                {result.insights.map((insight, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-xl shadow-sm border border-indigo-100 flex gap-3 items-start">
                    <div className="text-xl mt-0.5">💡</div>
                    <p className="text-slate-900 font-bold leading-tight text-sm md:text-base">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AOV & MARGIN CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AOV CARD */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rata-rata Belanja per Pesanan (AOV)</p>
                  <p className="text-3xl font-bold text-slate-900 mb-2">{formatRupiah(result.currentAOV)}</p>
                  <p className="text-sm text-slate-500">
                    Rata-rata tiap pelanggan keluar uang {formatRupiah(result.currentAOV)}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  {result.aovChangePercentage > 0 ? (
                    <p className="text-sm font-bold text-green-600 flex items-center gap-1.5">
                      <span>↑</span> {Math.abs(Math.round(result.aovChangePercentage))}% dibanding periode sebelumnya
                    </p>
                  ) : result.aovChangePercentage < 0 ? (
                    <p className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                      <span>↓</span> {Math.abs(Math.round(result.aovChangePercentage))}% dibanding periode sebelumnya
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                      <span>-</span> Stabil
                    </p>
                  )}
                </div>
              </div>

              {/* MARGIN CARD */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Margin Kotor Rata-Rata</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${result.currentMargin >= 40 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {result.currentMargin >= 40 ? 'SEHAT' : 'PERLU PERHATIAN'}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-indigo-700 mb-2">{result.currentMargin}%</p>
                  <p className="text-sm text-slate-500">
                    Persentase keuntungan sebelum biaya operasional
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  {result.marginChangePercentage > 0 ? (
                    <p className="text-sm font-bold text-green-600 flex items-center gap-1.5">
                      <span>↑</span> {Math.abs(Math.round(result.marginChangePercentage))}% dibanding periode sebelumnya
                    </p>
                  ) : result.marginChangePercentage < 0 ? (
                    <p className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                      <span>↓</span> {Math.abs(Math.round(result.marginChangePercentage))}% dibanding periode sebelumnya
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                      <span>-</span> Stabil
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* PRODUCT MIX ACCORDION */}
            <div>
              <h2 className="text-slate-900 font-bold mb-4">Analisis Produk (Product Mix)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.productMix.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4 bg-white rounded-xl border border-slate-100 md:col-span-2">
                    Tidak ada produk terjual pada periode ini.
                  </p>
                ) : (
                  result.productMix.map(p => {
                    const info = getQuadrantInfo(p.quadrant)
                    return (
                      <div key={p.productId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-base font-bold text-slate-900">{p.productName}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${info.color}`}>
                              {info.label}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Kontribusi Omzet</p>
                              <p className="text-sm font-bold text-slate-900">{formatRupiah(p.revenue)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Margin Produk</p>
                              <p className="text-sm font-bold text-indigo-700">{p.margin}%</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
                          <p className="text-xs text-slate-600">
                            <strong>Analisis:</strong> {info.desc}.
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  )
}
