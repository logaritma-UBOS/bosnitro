"use client"
import { formatNumber, formatRupiah } from '@/lib/format';

import { useState, useEffect } from "react"
import Link from "next/link"
import { fetchSalesTimeData, SalesTimePeriodFilter } from "@/actions/salesTime"
import { calculateSalesTimeAnalysis, SalesTimeAnalysisResult, HourlyMetric } from "@/lib/engines/salesTimeEngine"

export default function SalesTimeClient() {
  const [period, setPeriod] = useState<SalesTimePeriodFilter>("7_DAYS")
  const [result, setResult] = useState<SalesTimeAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchSalesTimeData(period)
        if (res.error) {
          setError(res.error)
          return
        }

        if (res.result) {
          setResult(res.result)
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [period])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 max-w-md mx-auto relative">
      <div className="bg-indigo-700 text-white p-4 pb-6 shrink-0 rounded-b-3xl shadow-sm z-10">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-white text-sm font-semibold opacity-90 hover:opacity-100">
            ← Beranda
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-1">Analisis Waktu</h1>
        <p className="text-indigo-100 text-sm">Pola transaksi & omzet per jam bisnis.</p>
      </div>

      <div className="p-4 -mt-4 relative z-20">
        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-6 flex gap-2 overflow-x-auto no-scrollbar">
          {(["TODAY", "7_DAYS", "30_DAYS"] as SalesTimePeriodFilter[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors min-w-[80px] ${
                period === p ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-50"
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
            <p className="text-gray-500 text-sm font-medium">Menganalisis jam...</p>
          </div>
        ) : !result ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            <div className="text-4xl mb-3">🕒</div>
            <p className="text-gray-900 font-bold mb-1">Gagal memuat data</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* CURRENT TIME STATUS */}
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
              <span className="text-sm font-medium text-gray-500">Jam Saat Ini:</span>
              <span className="text-base font-bold text-gray-900">
                {String(result.currentBusinessHour).padStart(2, '0')}:00
              </span>
            </div>

            {/* INSIGHT CARDS */}
            <div className="space-y-3">
              {result.insights.map((insight, idx) => (
                <div key={idx} className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-xl shadow-sm border border-indigo-100 flex gap-3 items-start">
                  <div className="text-xl mt-0.5">💡</div>
                  <p className="text-gray-900 font-bold leading-tight text-sm">
                    {insight}
                  </p>
                </div>
              ))}
            </div>

            {/* PEAK HIGHLIGHTS */}
            {result.confidence !== "LOW" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Jam Terpadat</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {result.peakTransactionHour !== null ? `${String(result.peakTransactionHour).padStart(2, '0')}:00` : "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Transaksi terbanyak</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">AOV Tertinggi</p>
                  <p className="text-xl font-bold text-green-700">
                    {result.peakAOVHour !== null ? `${String(result.peakAOVHour).padStart(2, '0')}:00` : "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Rata-rata belanja</p>
                </div>
              </div>
            )}

            {/* HOURLY LIST ACCORDION */}
            <div>
              <h2 className="text-gray-900 font-bold mb-3">Detail Per Jam</h2>
              <div className="space-y-3">
                {result.hourlyMetrics.filter(m => m.transactionCount > 0).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-white rounded-xl border border-gray-100">
                    Tidak ada transaksi pada periode ini.
                  </p>
                ) : (
                  result.hourlyMetrics
                    .filter(m => m.transactionCount > 0)
                    .map((metric: HourlyMetric) => (
                      <details key={metric.hour} className="bg-white rounded-xl shadow-sm border border-gray-100 group overflow-hidden">
                        <summary className="p-4 flex justify-between items-center cursor-pointer list-none select-none hover:bg-gray-50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold text-gray-900">
                                {String(metric.hour).padStart(2, '0')}:00 - {String((metric.hour + 1) % 24).padStart(2, '0')}:00
                              </p>
                              {result.peakTransactionHour === metric.hour && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-full">RAMAI</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {metric.transactionCount} transaksi
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3 shrink-0">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{formatRupiah(metric.omzet)}</p>
                              <p className="text-xs text-gray-400">Omzet</p>
                            </div>
                            <div className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 group-open:rotate-180 transition-transform">
                              ▼
                            </div>
                          </div>
                        </summary>
                        
                        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
                          <div className="bg-white p-3 rounded-lg border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rata-rata Belanja (AOV)</p>
                            <p className="text-sm font-bold text-green-700">{formatRupiah(metric.aov)}</p>
                          </div>
                        </div>
                      </details>
                    ))
                )}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  )
}
