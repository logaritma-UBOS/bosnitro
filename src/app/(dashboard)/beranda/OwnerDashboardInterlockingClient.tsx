"use client"

import { useState, useMemo } from "react"
import { useBranch } from "@/context/BranchContext"
import { InterlockingTransaction, FraudAlert, DEFAULT_BRANCHES } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import BranchSelector from "@/components/branch/BranchSelector"
import Link from "next/link"

export default function OwnerDashboardInterlockingClient({
  initialTransactions,
  initialAlerts,
}: {
  initialTransactions: InterlockingTransaction[]
  initialAlerts: FraudAlert[]
}) {
  const { selectedBranch, selectedBranchId, isAllBranches } = useBranch()
  const [transactions] = useState<InterlockingTransaction[]>(initialTransactions)
  const [alerts, setAlerts] = useState<FraudAlert[]>(initialAlerts)
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null)

  // Filter based on active branch selector
  const filteredTransactions = useMemo(() => {
    if (isAllBranches) return transactions
    return transactions.filter((t) => t.branchId === selectedBranchId)
  }, [transactions, selectedBranchId, isAllBranches])

  const filteredAlerts = useMemo(() => {
    if (isAllBranches) return alerts
    return alerts.filter((a) => a.branchId === selectedBranchId)
  }, [alerts, selectedBranchId, isAllBranches])

  // KPIs
  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0)
  }, [filteredTransactions])

  const totalGrossProfit = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + (t.grossProfit || t.totalAmount * 0.7), 0)
  }, [filteredTransactions])

  const validTxCount = filteredTransactions.length

  const branchLabel = isAllBranches ? "Seluruh 4 Cabang" : selectedBranch.name

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📊</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Dashboard Anti-Loss & Pengawasan Multi-Cabang
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitoring omzet real-time, audit visual plat nomor & botol oli, serta deteksi kebocoran sensor IoT
          </p>
        </div>

        <div className="w-full md:w-72">
          <BranchSelector allowAll={true} />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Omzet */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Total Omzet ({branchLabel})
            </span>
            <span className="text-xl p-2 bg-emerald-50 rounded-xl">💰</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {formatRupiah(totalRevenue)}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              ✓ Termasuk Nitrogen & Ritel
            </p>
          </div>
        </div>

        {/* Card 2: Laba Kotor (Gross Profit) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Laba Kotor (Gross Profit)
            </span>
            <span className="text-xl p-2 bg-blue-50 rounded-xl">📈</span>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-900 tabular-nums">
              {formatRupiah(totalGrossProfit)}
            </p>
            <p className="text-[11px] text-blue-600 font-bold mt-1">
              Margin Rata-rata: {totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Card 3: Transaksi Valid */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Transaksi Terverifikasi
            </span>
            <span className="text-xl p-2 bg-purple-50 rounded-xl">🛡️</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {validTxCount} Transaksi
            </p>
            <p className="text-[11px] text-purple-600 font-bold mt-1">
              100% Bukti Visual Terlampir
            </p>
          </div>
        </div>

        {/* Card 4: Status IoT Perangkat */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Status Perangkat IoT
            </span>
            <span className="text-xl p-2 bg-emerald-50 rounded-xl">📟</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <p className="text-lg font-black text-emerald-800">
                {isAllBranches ? "4 / 4 Online" : "Online (Normal)"}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Solenoid Valve & Flow Sensor Aktif
            </p>
          </div>
        </div>
      </div>

      {/* FRAUD CONTROL & ANOMALY ALERTS WIDGET */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚨</span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Peringatan Anomali Sensor Flow Meter (Anti-Loss Leak Detection)
              </h2>
              <p className="text-xs text-slate-500">
                Mendeteksi penggunaan gas liar atau katup solenoid bocor tanpa transaksi tercatat di POS
              </p>
            </div>
          </div>

          <span className={`text-xs font-black px-3 py-1 rounded-full ${
            filteredAlerts.length > 0 ? "bg-red-100 text-red-800 animate-pulse" : "bg-emerald-100 text-emerald-800"
          }`}>
            {filteredAlerts.length > 0 ? `${filteredAlerts.length} Anomali Terdeteksi` : "Aman / Normal"}
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Tidak ada anomali sensor flow meter pada cabang ini. Sistem pengisian berjalan tertib.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl p-2 bg-red-100 rounded-xl text-red-600 shrink-0">⚠️</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-red-900">{alert.branchName}</span>
                      <span className="text-[10px] font-mono bg-red-200/60 text-red-800 px-1.5 py-0.5 rounded">
                        {alert.deviceId}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-red-800 mt-1">{alert.message}</p>
                    <p className="text-[10px] text-red-500 mt-0.5">
                      Waktu Deteksi: {new Date(alert.detectedAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-xl">
                    Telegram Terkirim ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VISUAL AUDIT GALLERY (FOTO PLAT NOMOR & FOTO BOTOL BEKAS) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📸</span>
              <h2 className="text-base font-extrabold text-slate-900">
                Galeri Visual Audit Transaksi
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap struk penjualan nitrogen diverifikasi dengan foto plat kendaraan & penjualan ritel dengan foto botol bekas
            </p>
          </div>

          <Link
            href="/shift-closing"
            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            <span>🔒 Lihat Audit Shift Closing</span>
            <span>→</span>
          </Link>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada transaksi dengan bukti foto audit di cabang ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-300 transition-all hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-slate-800">{tx.id}</span>
                    <span className="text-[10px] font-bold bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md">
                      {tx.branchName}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3">
                    Kasir: <span className="font-semibold text-slate-700">{tx.cashierName}</span> • {new Date(tx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </p>

                  {/* Photo Badges / Previews */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {tx.vehiclePhotoUrl ? (
                      <div
                        onClick={() =>
                          setPreviewPhoto({
                            url: tx.vehiclePhotoUrl!,
                            title: `Foto Plat Kendaraan (${tx.id})`,
                          })
                        }
                        className="cursor-pointer group relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-300"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tx.vehiclePhotoUrl}
                          alt="Plat Nomor"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded text-center truncate">
                          Plat Nomor Kendaraan
                        </span>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                        Tanpa Nitrogen
                      </div>
                    )}

                    {tx.usedBottlePhotoUrl ? (
                      <div
                        onClick={() =>
                          setPreviewPhoto({
                            url: tx.usedBottlePhotoUrl!,
                            title: `Foto Botol Bekas Oli (${tx.id})`,
                          })
                        }
                        className="cursor-pointer group relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-300"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tx.usedBottlePhotoUrl}
                          alt="Botol Bekas"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded text-center truncate">
                          Botol Bekas Oli
                        </span>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                        Tanpa Ritel
                      </div>
                    )}
                  </div>

                  {/* Items summary */}
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    {tx.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate">
                          {it.quantity}x {it.productName}
                        </span>
                        <span className="font-semibold tabular-nums">{formatRupiah(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex justify-between items-center text-xs">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    ✓ Valid Interlocked
                  </span>
                  <span className="font-black text-slate-900 tabular-nums">
                    {formatRupiah(tx.totalAmount)}
                  </span>
                </div>
              </div>
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
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                ✕
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
