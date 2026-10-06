"use client"
import { formatNumber, formatRupiah } from '@/lib/format';

import { useState, useEffect } from "react"
import Link from "next/link"
import { getTransactionHistory } from "@/actions/history"
import { getPendingTransactions } from "@/lib/adapters/offlineQueueAdapter"
import { calculateHistoryMetrics } from "@/lib/engines/historyEngine"

type SaleItem = {
  id: string
  quantity: number
  priceAtSale: number
  product: { name: string }
}

type Sale = {
  id: string
  clientTransactionId: string
  totalAmount: number
  createdAt: Date
  saleItems: SaleItem[]
  status: "SYNCED" | "PENDING"
}

export default function RiwayatClient({ plan }: { plan?: string }) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState("today")
  const [tier, setTier] = useState<string>("Starter")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, tierData] = await Promise.all([
          getTransactionHistory(),
          fetch("/api/user/status").then(r => r.json()).catch(() => ({ tier: "Starter" }))
        ])
        
        const fetchedTier = tierData.tier || "Starter"
        setTier(fetchedTier)

        if (!res.data) return

        const dbSales: Sale[] = res.data.map((s: any) => ({
          ...s,
          status: "SYNCED"
        }))

        const queue = getPendingTransactions()
        const pendingSales: Sale[] = queue.map((q: any) => ({
          id: q.clientTransactionId,
          clientTransactionId: q.clientTransactionId,
          totalAmount: q.totalAmount || 0,
          createdAt: new Date(q.timestamp),
          saleItems: q.cart.map((c: any) => ({
            id: Math.random().toString(),
            quantity: c.quantity,
            priceAtSale: c.price,
            product: { name: "Produk (Offline)" }
          })),
          status: "PENDING"
        }))

        // Merge and sort
        let merged = [...pendingSales, ...dbSales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        const tier = tierData.tier || "Starter"
        if (tier === "Starter") {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          merged = merged.filter(m => new Date(m.createdAt) >= sevenDaysAgo)
        }
        
        setSales(merged)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter berdasarkan tanggal
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    const now = new Date();
    
    if (dateFilter === "today") {
      return saleDate.getDate() === now.getDate() && 
             saleDate.getMonth() === now.getMonth() && 
             saleDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === "7d") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return saleDate >= sevenDaysAgo;
    } else if (dateFilter === "30d") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return saleDate >= thirtyDaysAgo;
    }
    return true;
  });

  // Delegasikan perhitungan bisnis ke Engine (Single Source of Truth)
  const metrics = calculateHistoryMetrics(filteredSales)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 max-w-7xl mx-auto">
      {tier === "Starter" && (
        <div className="bg-amber-100 text-amber-800 text-xs font-bold text-center px-4 py-2 border-b border-amber-200">
          Paket Starter: Riwayat dibatasi 7 hari terakhir. Upgrade ke Pro/Lifetime untuk akses riwayat tanpa batas.
        </div>
      )}
      {/* HEADER FLAT STANDAR */}
      <div className="bg-white px-4 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200">
        <div className="mb-4 md:mb-0">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm font-semibold mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Beranda
          </Link>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
        </div>
        <div className="flex gap-2">
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
          >
            <option value="today">Hari Ini</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d" disabled={tier === "Starter"}>{tier === "Starter" ? "30 Hari (Terkunci)" : "30 Hari Terakhir"}</option>
          </select>
        </div>
      </div>
      
      <div className="p-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-semibold mb-1">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalTransaksi}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-semibold mb-1">Total Omzet</p>
            <p className="text-2xl font-bold text-blue-700">{formatRupiah(metrics.totalOmzet)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-semibold mb-1">AOV</p>
            <p className="text-2xl font-bold text-green-700">{formatRupiah(metrics.aov)}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 mt-10">Memuat data...</p>
        ) : (
          <div className="space-y-3">
            {filteredSales.map(sale => (
              <details key={sale.id} className="bg-white rounded-xl shadow-sm border border-gray-200 group overflow-hidden">
                <summary className="p-4 lg:px-6 flex flex-col lg:flex-row justify-between lg:items-center cursor-pointer list-none hover:bg-gray-50 transition-colors gap-3">
                  <div className="flex items-center gap-4 min-w-[250px]">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(sale.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    {sale.status === "PENDING" ? (
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">PENDING</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">SYNCED</span>
                    )}
                  </div>
                  
                  <div className="hidden lg:block flex-1 text-sm text-gray-600 truncate px-4">
                    {sale.saleItems.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}
                  </div>

                  <div className="text-right flex justify-between lg:justify-end items-center gap-4 min-w-[150px]">
                    <span className="lg:hidden text-xs text-gray-500">Total:</span>
                    <p className="text-sm font-bold text-gray-900">{formatRupiah(sale.totalAmount)}</p>
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </summary>
                <div className="px-4 lg:px-6 pb-4 border-t border-gray-100 pt-4 bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Rincian Item Terjual</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sale.saleItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-white p-3 rounded-lg border border-gray-100">
                        <p className="text-gray-700"><span className="font-semibold">{item.quantity}x</span> {item.product.name}</p>
                        <p className="text-gray-900 font-semibold">{formatRupiah((item.priceAtSale * item.quantity))}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ))}
            {filteredSales.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                <p className="text-gray-500 font-medium">Belum ada transaksi di periode ini.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
