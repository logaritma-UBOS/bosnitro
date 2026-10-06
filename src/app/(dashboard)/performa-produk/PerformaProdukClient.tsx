"use client"
import { formatNumber, formatRupiah } from '@/lib/format';

import { useState, useEffect } from "react"
import Link from "next/link"
import { fetchProductPerformanceData, PeriodFilter } from "@/actions/productPerformance"
import { calculateProductPerformance, generateRecommendationContext, ProductPerformanceMetric } from "@/lib/engines/productPerformanceEngine"

export default function PerformaProdukClient() {
  const [period, setPeriod] = useState<PeriodFilter>("7_DAYS")
  const [metrics, setMetrics] = useState<ProductPerformanceMetric[]>([])
  const [context, setContext] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchProductPerformanceData(period)
        if (res.error) {
          setError(res.error)
          return
        }

        if (res.result) {
          setMetrics(res.result)
          setContext(generateRecommendationContext(res.result))
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
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* --- DESKTOP HEADER --- */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-4 lg:px-8 py-4 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1">
              &larr; Kembali ke Beranda
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Performa Produk</h1>
            <p className="text-slate-500 text-xs mt-0.5">Analisis penjualan dan tren historis.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 rounded-lg p-1 flex">
              {(["TODAY", "7_DAYS", "30_DAYS"] as PeriodFilter[]).map(p => (
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
      <div className="md:hidden bg-blue-700 text-white p-4 pb-6 shrink-0 rounded-b-3xl shadow-sm z-10 relative">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-white text-sm font-semibold opacity-90 hover:opacity-100">
            &larr; Beranda
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-1">Performa Produk</h1>
        <p className="text-blue-100 text-sm">Analisis penjualan dan tren historis.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-4 md:mt-0 relative z-20">
        
        {/* MOBILE PERIOD SELECTOR (Hidden on Desktop) */}
        <div className="md:hidden bg-white rounded-xl shadow-sm border border-slate-100 p-2 mb-6 flex gap-2 overflow-x-auto no-scrollbar">
          {(["TODAY", "7_DAYS", "30_DAYS"] as PeriodFilter[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors min-w-[80px] ${
                period === p ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-50"
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
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Menganalisis performa...</p>
          </div>
        ) : metrics.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-100">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-slate-900 font-bold mb-1">Belum ada data penjualan</p>
            <p className="text-slate-500 text-sm">Transaksi produk di periode ini akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* TOP HIGHLIGHTS (Grid 2 Kolom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {context?.topSellingProduct && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start gap-4 hover:border-blue-200 transition-colors">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl shrink-0">🔥</div>
                  <div>
                    <p className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wider">Paling Laku</p>
                    <p className="text-slate-900 font-bold text-base leading-tight mb-2">
                      {context.topSellingProduct.productName}
                    </p>
                    <p className="text-slate-500 text-sm">
                      Terjual <span className="font-bold text-slate-800">{context.topSellingProduct.salesVolume} porsi</span> ({Math.round(context.topSellingProduct.revenueContribution)}% dari total omzet).
                    </p>
                  </div>
                </div>
              )}

              {context?.highestProfitProduct && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start gap-4 hover:border-green-200 transition-colors">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl shrink-0">💰</div>
                  <div>
                    <p className="text-xs text-green-600 font-bold mb-1 uppercase tracking-wider">Paling Untung</p>
                    <p className="text-slate-900 font-bold text-base leading-tight mb-2">
                      {context.highestProfitProduct.productName}
                    </p>
                    <p className="text-slate-500 text-sm">
                      Memberikan margin kotor terbesar: <span className="font-bold text-slate-800">{context.highestProfitProduct.margin}%</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PRODUCT LIST GRID */}
            <div>
              <h2 className="text-slate-900 font-bold mb-4 flex items-center justify-between">
                <span>Rincian Produk</span>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{metrics.length} Produk Terjual</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map(product => (
                  <details key={product.productId} className="bg-white rounded-xl shadow-sm border border-slate-200 group overflow-hidden">
                    <summary className="p-4 flex justify-between items-center cursor-pointer list-none select-none hover:bg-slate-50 transition-colors">
                      <div className="flex-1 pr-4 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-900 truncate">{product.productName}</p>
                          {product.trend === "UP" && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full shrink-0">↑</span>}
                          {product.trend === "DOWN" && <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full shrink-0">↓</span>}
                        </div>
                        <p className="text-xs text-slate-500">
                          Terjual {product.salesVolume} unit
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3 shrink-0">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{formatRupiah(product.revenue)}</p>
                        </div>
                        <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 group-open:rotate-180 transition-transform">
                          ▼
                        </div>
                      </div>
                    </summary>
                    
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Untung Kotor</p>
                          <p className="text-sm font-bold text-green-700">{formatRupiah(product.grossProfit)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Margin</p>
                          <p className="text-sm font-bold text-slate-900">{product.margin}%</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                        <div className="flex justify-between p-3 text-xs">
                          <span className="text-slate-500">HPP / Modal Item</span>
                          <span className="font-semibold text-slate-900">{formatRupiah(product.hpp)}</span>
                        </div>
                        <div className="flex justify-between p-3 text-xs">
                          <span className="text-slate-500">Tren Penjualan</span>
                          <span className={`font-semibold ${product.trendPercentage > 0 ? 'text-green-600' : product.trendPercentage < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                            {product.trendPercentage > 0 ? '+' : ''}{Math.round(product.trendPercentage)}%
                          </span>
                        </div>
                        <div className="flex justify-between p-3 text-xs">
                          <span className="text-slate-500">Kontribusi Omzet</span>
                          <span className="font-semibold text-slate-900">{Math.round(product.revenueContribution)}%</span>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  )
}
