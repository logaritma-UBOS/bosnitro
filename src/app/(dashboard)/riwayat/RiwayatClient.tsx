"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useBranch } from "@/context/BranchContext"
import BranchSelector from "@/components/branch/BranchSelector"
import { formatRupiah } from "@/lib/format"
import { InterlockingTransaction } from "@/types/branch"
import { getPendingTransactions } from "@/lib/adapters/offlineQueueAdapter"
import {
  getLocalTransactions,
  syncTransactions,
  subscribeTransactions,
  saveLocalTransactions,
} from "@/lib/transactionStore"
import {
  History,
  TrendingUp,
  Receipt,
  Building2,
  Calendar,
  Camera,
  ChevronDown,
  X,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"

export default function RiwayatClient() {
  const { selectedBranch, selectedBranchId, isAllBranches } = useBranch()
  const [transactions, setTransactions] = useState<InterlockingTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<"today" | "7d" | "30d" | "all">("today")
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null)

  const fetchTransactions = async () => {
    const branchParam = isAllBranches ? "ALL" : selectedBranchId

    // 1. Instant local render (Zero loading delay)
    const localCached = getLocalTransactions(branchParam)
    if (localCached.length > 0) {
      setTransactions(localCached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    try {
      // 2. Perform two-way sync with server
      const syncedList = await syncTransactions(branchParam)

      // 3. Merge pending offline transactions if any
      const queue = getPendingTransactions()
      const pendingTxList: InterlockingTransaction[] = queue
        .filter((q: any) => isAllBranches || !q.branchId || q.branchId === selectedBranchId)
        .map((q: any) => ({
          id: q.clientTransactionId,
          branchId: q.branchId || selectedBranchId,
          branchName: selectedBranch.name,
          cashierName: "Kasir (Offline)",
          totalAmount: q.totalAmount || 0,
          totalCostPrice: (q.totalAmount || 0) * 0.4,
          grossProfit: (q.totalAmount || 0) * 0.6,
          customerPlate: q.customerPlate || null,
          customerName: q.customerName || null,
          customerPhone: q.customerPhone || null,
          vehiclePhotoUrl: null,
          usedBottlePhotoUrl: null,
          status: "COMPLETED",
          paymentMethod: q.paymentMethod || "CASH",
          createdAt: new Date(q.timestamp).toISOString(),
          items: (q.cart || []).map((c: any) => ({
            productId: c.productId || "item",
            productName: c.name || "Item POS",
            category: c.category || "NITROGEN",
            quantity: c.quantity || 1,
            price: c.price || 0,
            costPrice: (c.price || 0) * 0.4,
            subtotal: (c.price || 0) * (c.quantity || 1),
          })),
        }))

      const map = new Map<string, InterlockingTransaction>()
      for (const t of syncedList) {
        if (t && t.id) map.set(t.id, t)
      }
      for (const t of pendingTxList) {
        if (t && t.id && !map.has(t.id)) map.set(t.id, t)
      }

      const merged = Array.from(map.values())
        .filter((t) => isAllBranches || t.branchId === selectedBranchId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setTransactions(merged)
      if (merged.length > 0) {
        saveLocalTransactions(merged)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()

    // Real-time listener for transactions created across windows/tabs/POS
    const unsubscribe = subscribeTransactions(() => {
      fetchTransactions()
    })
    return () => unsubscribe()
  }, [selectedBranchId, isAllBranches])

  // Filter based on date & strict branch isolation
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Strict branch isolation
      if (!isAllBranches && tx.branchId !== selectedBranchId) {
        return false
      }

      const txDate = new Date(tx.createdAt)
      const now = new Date()

      if (dateFilter === "today") {
        const toYMD = (d: string | Date) => {
          const dt = new Date(d)
          if (isNaN(dt.getTime())) return ""
          return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(dt)
        }
        return toYMD(tx.createdAt) === toYMD(now)
      } else if (dateFilter === "7d") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return txDate >= sevenDaysAgo
      } else if (dateFilter === "30d") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return txDate >= thirtyDaysAgo
      }
      return true
    })
  }, [transactions, dateFilter, selectedBranchId, isAllBranches])

  // KPI calculations
  const totalOmzet = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.totalAmount, 0)
  }, [filteredTransactions])

  const totalTransaksi = filteredTransactions.length
  const aov = totalTransaksi > 0 ? Math.round(totalOmzet / totalTransaksi) : 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 font-sans">
      {/* HEADER FLAT STANDAR */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {isAllBranches ? "Riwayat Transaksi - Semua Cabang (Akumulasi)" : `Riwayat Transaksi - ${selectedBranch.name}`}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {isAllBranches
                ? "Seluruh catatan transaksi interlocking & penjualan terakumulasi dari seluruh gerai cabang"
                : `Daftar transaksi interlocking kasir untuk ${selectedBranch.name} (${selectedBranch.location})`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="w-full sm:w-60">
              <BranchSelector allowAll={true} />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold rounded-xl px-3 py-2.5 shadow-xs focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              <option value="today">Hari Ini</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="all">Semua Riwayat</option>
            </select>
          </div>
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Transaksi
              </span>
              <Receipt className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {totalTransaksi} <span className="text-xs font-normal text-slate-400">Trx</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Omzet
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 tabular-nums">
              {formatRupiah(totalOmzet)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Rata-Rata Belanja (AOV)
              </span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-800 tabular-nums">
              {formatRupiah(aov)}
            </p>
          </div>
        </div>

        {/* TRANSACTIONS LIST */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
            Memuat transaksi cabang...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada transaksi ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1">
              Belum ada transaksi di cabang ini pada periode yang dipilih.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <details
                key={tx.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs group overflow-hidden transition-all hover:border-emerald-300"
              >
                <summary className="p-4 sm:p-5 flex flex-col lg:flex-row justify-between lg:items-center cursor-pointer list-none hover:bg-slate-50/70 transition-colors gap-3">
                  <div className="flex flex-wrap items-center gap-3 min-w-[280px]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{tx.id}</span>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                          {tx.branchName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        •{" "}
                        {new Date(tx.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {tx.customerPlate && (
                      <span className="bg-yellow-50 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-yellow-200">
                        Plat: {tx.customerPlate}
                      </span>
                    )}

                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {tx.paymentMethod}
                    </span>
                  </div>

                  <div className="hidden lg:block flex-1 text-xs text-slate-600 truncate px-4">
                    {tx.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-4 min-w-[180px]">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 tabular-nums">
                        {formatRupiah(tx.totalAmount)}
                      </p>
                      <p className="text-[10px] text-slate-400">Kasir: {tx.cashierName}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                  </div>
                </summary>

                <div className="px-4 sm:px-6 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  {/* Photo Audit Section if available */}
                  {(tx.vehiclePhotoUrl || tx.usedBottlePhotoUrl) && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-purple-600" />
                        <span>Foto Bukti Audit Transaksi</span>
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {tx.vehiclePhotoUrl && (
                          <div
                            onClick={() =>
                              setPreviewPhoto({
                                url: tx.vehiclePhotoUrl!,
                                title: `Foto Plat Kendaraan (${tx.customerPlate || tx.id})`,
                              })
                            }
                            className="cursor-pointer group relative w-36 aspect-video rounded-xl overflow-hidden bg-black border border-slate-200"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={tx.vehiclePhotoUrl}
                              alt="Foto Plat"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1 rounded text-center truncate">
                              Plat: {tx.customerPlate || "Tercatat"}
                            </span>
                          </div>
                        )}

                        {tx.usedBottlePhotoUrl && (
                          <div
                            onClick={() =>
                              setPreviewPhoto({
                                url: tx.usedBottlePhotoUrl!,
                                title: `Foto Botol Bekas Oli (${tx.id})`,
                              })
                            }
                            className="cursor-pointer group relative w-36 aspect-video rounded-xl overflow-hidden bg-black border border-slate-200"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={tx.usedBottlePhotoUrl}
                              alt="Botol Bekas"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1 rounded text-center truncate">
                              Botol Bekas Oli
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items Break-down */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                      Rincian Item Penjualan
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tx.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-slate-200/80"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">
                              <span className="font-bold text-emerald-700">{item.quantity}x</span>{" "}
                              {item.productName}
                            </p>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">
                              {item.category}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900 tabular-nums">
                            {formatRupiah(item.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PHOTO PREVIEW / ZOOM */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl border border-slate-200"
          >
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">{previewPhoto.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt="Preview Audit"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
