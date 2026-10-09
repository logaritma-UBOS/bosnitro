"use client"

import React, { useState } from "react"
import { InterlockingTransaction, FraudAlert } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import { useBranch } from "@/context/BranchContext"
import BranchSelector from "@/components/branch/BranchSelector"
import {
  ShieldAlert,
  Camera,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  Radio,
  Eye,
  Filter,
  ExternalLink,
  Cpu,
} from "lucide-react"

export default function AuditFraudClient({
  initialTransactions,
  initialAlerts,
}: {
  initialTransactions: InterlockingTransaction[]
  initialAlerts: FraudAlert[]
}) {
  const { selectedBranchId, isAllBranches } = useBranch()
  const [filterType, setFilterType] = useState<"ALL" | "PLAT" | "BOTOL">("ALL")
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null)

  const filteredTransactions = initialTransactions.filter((tx) => {
    if (!isAllBranches && tx.branchId !== selectedBranchId) return false
    if (filterType === "PLAT" && !tx.vehiclePhotoUrl) return false
    if (filterType === "BOTOL" && !tx.usedBottlePhotoUrl) return false
    return true
  })

  const filteredAlerts = initialAlerts.filter((al) => {
    if (!isAllBranches && al.branchId !== selectedBranchId) return false
    return true
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Pusat Audit & Deteksi Fraud (Anti-Loss)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitoring sensor flow meter, anomali penggunaan katup, dan audit visual snapshot plat nomor & botol oli
          </p>
        </div>

        <div className="w-full sm:w-64">
          <BranchSelector allowAll={true} />
        </div>
      </div>

      {/* Telegram Fraud Alert Feed */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              Notifikasi Anomali Telegram ({filteredAlerts.length})
            </h2>
          </div>
          <span className="text-[10px] font-black uppercase bg-red-100 text-red-800 px-2.5 py-1 rounded-full">
            IoT Sensor Live
          </span>
        </div>

        <div className="space-y-3">
          {filteredAlerts.map((al) => (
            <div
              key={al.id}
              className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-red-900">{al.branchName}</span>
                    <span className="text-[10px] font-mono bg-red-200 text-red-800 px-1.5 py-0.5 rounded">
                      {al.deviceId}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-red-800 mt-1">{al.message}</p>
                  <p className="text-[10px] text-red-500 mt-0.5">
                    Waktu Deteksi: {new Date(al.detectedAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Telegram Notified ✓
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Audit Stream */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              Live Audit Stream (Foto Plat & Botol Bekas)
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg ${filterType === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"}`}
            >
              Semua Foto
            </button>
            <button
              type="button"
              onClick={() => setFilterType("PLAT")}
              className={`px-3 py-1.5 rounded-lg ${filterType === "PLAT" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"}`}
            >
              Foto Plat Kendaraan
            </button>
            <button
              type="button"
              onClick={() => setFilterType("BOTOL")}
              className={`px-3 py-1.5 rounded-lg ${filterType === "BOTOL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"}`}
            >
              Foto Botol Bekas Oli
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-mono font-bold text-slate-800">{tx.id}</span>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {tx.branchName}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mb-2">
                  Kasir: <strong className="text-slate-700">{tx.cashierName}</strong> • {new Date(tx.createdAt).toLocaleTimeString("id-ID")}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {tx.vehiclePhotoUrl && (
                    <div
                      onClick={() => setPreviewPhoto({ url: tx.vehiclePhotoUrl!, title: `Plat: ${tx.customerPlate || tx.id}` })}
                      className="cursor-pointer group relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-300"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tx.vehiclePhotoUrl} alt="Plat" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1 py-0.5 rounded text-center truncate">
                        {tx.customerPlate || "Plat Nomor"}
                      </span>
                    </div>
                  )}

                  {tx.usedBottlePhotoUrl && (
                    <div
                      onClick={() => setPreviewPhoto({ url: tx.usedBottlePhotoUrl!, title: `Botol Bekas: ${tx.id}` })}
                      className="cursor-pointer group relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-300"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tx.usedBottlePhotoUrl} alt="Botol" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1 py-0.5 rounded text-center truncate">
                        Botol Bekas Oli
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 space-y-0.5">
                  {tx.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate">{it.quantity}x {it.productName}</span>
                      <span className="font-semibold">{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-900">{formatRupiah(tx.totalAmount)}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Zoom */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">{previewPhoto.title}</h3>
              <button type="button" onClick={() => setPreviewPhoto(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewPhoto.url} alt="Audit" className="max-h-[65vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
