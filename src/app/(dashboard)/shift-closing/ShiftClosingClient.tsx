"use client"

import { useState } from "react"
import { useBranch } from "@/context/BranchContext"
import { ShiftClosing } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import BranchSelector from "@/components/branch/BranchSelector"

export default function ShiftClosingClient({
  initialClosings,
  user,
}: {
  initialClosings: ShiftClosing[]
  user?: { id?: string; name?: string | null; role?: string | null }
}) {
  const { selectedBranch, selectedBranchId } = useBranch()
  const isOwnerOrManager = user?.role === "OWNER" || user?.role === "MANAGER"

  const [activeTab, setActiveTab] = useState<"INPUT" | "HISTORY">("INPUT")
  const [closings, setClosings] = useState<ShiftClosing[]>(initialClosings)

  // Cashier inputs
  const [physicalCash, setPhysicalCash] = useState<number>(0)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submittedClosing, setSubmittedClosing] = useState<ShiftClosing | null>(null)

  // Denomination counter state for easy cash counting
  const [counts, setCounts] = useState<{ [denom: number]: number }>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  })

  const updateDenom = (denom: number, count: number) => {
    const newCounts = { ...counts, [denom]: Math.max(0, count) }
    setCounts(newCounts)

    const total = Object.entries(newCounts).reduce(
      (sum, [d, c]) => sum + Number(d) * Number(c),
      0
    )
    setPhysicalCash(total)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (physicalCash <= 0) {
      if (!confirm("Total uang fisik bernilai Rp 0. Apakah Anda yakin tidak ada uang tunai di laci?")) {
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/shift-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranchId,
          physicalCash,
          notes,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Gagal menutup shift")

      setSubmittedClosing(data.closing)
      setClosings((prev) => [data.closing, ...prev])
      setPhysicalCash(0)
      setNotes("")
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🔒</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Tutup Shift & Audit Setoran (Blind Closing)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Sistem penguncian setoran tertutup untuk mencegah manipulasi uang tunai fisik di kasir
          </p>
        </div>

        <div className="w-full md:w-64">
          <BranchSelector />
        </div>
      </div>

      {/* Tabs */}
      {isOwnerOrManager && (
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-xs">
          <button
            type="button"
            onClick={() => setActiveTab("INPUT")}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
              activeTab === "INPUT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Form Input Kasir
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
              activeTab === "HISTORY" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Audit Selisih (Owner)
          </button>
        </div>
      )}

      {/* TAB 1: FORM INPUT BLIND CLOSING */}
      {activeTab === "INPUT" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {submittedClosing ? (
              <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-sm text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 text-3xl rounded-full flex items-center justify-center mx-auto">
                  ✓
                </div>
                <h2 className="text-2xl font-black text-slate-900">Tutup Shift Berhasil Tercatat</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Laporan setoran tunai fisik Anda untuk cabang <b>{submittedClosing.branchName}</b> telah terkirim dan tersimpan aman di sistem audit Owner.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID Laporan</span>
                    <span className="font-mono font-bold text-slate-800">{submittedClosing.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kasir Bertugas</span>
                    <span className="font-bold text-slate-800">{submittedClosing.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Uang Fisik Diserahkan</span>
                    <span className="font-black text-emerald-700">{formatRupiah(submittedClosing.physicalCash)}</span>
                  </div>
                  {isOwnerOrManager && (
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Selisih Hitungan Sistem</span>
                      <span className={`font-bold ${submittedClosing.discrepancy < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {formatRupiah(submittedClosing.discrepancy)}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSubmittedClosing(null)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Buat Input Tutup Shift Lainnya
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                {/* Security Badge */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h3 className="text-xs font-bold text-amber-950">Mode Blind Closing Aktif</h3>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      Angka omzet sistem sengaja <b>disembunyikan</b> dari kasir. Kasir cukup menghitung uang tunai fisik yang ada di laci kasir saat ini secara jujur dan akurat.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Total Uang Tunai Fisik di Laci Kasir (Rp) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-bold">Rp</span>
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      value={physicalCash || ""}
                      onChange={(e) => setPhysicalCash(Number(e.target.value))}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Anda juga dapat menggunakan asisten kalkulator lembaran uang di sebelah kanan.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Catatan Shift / Serah Terima (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Shift sore selesai. Modal awal laci Rp 100.000 sudah dipisahkan..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? "Menyimpan Data Setoran..." : "Kirim Laporan Tutup Shift Sekarang →"}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Cash Counter Assistant */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs h-fit space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Asisten Hitung Lembaran Uang
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCounts({ 100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0 })
                  setPhysicalCash(0)
                }}
                className="text-[10px] font-bold text-red-500 hover:text-red-700"
              >
                Reset
              </button>
            </div>

            <div className="space-y-2">
              {[100000, 50000, 20000, 10000, 5000, 2000, 1000].map((denom) => (
                <div key={denom} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700 w-20 tabular-nums">
                    {formatRupiah(denom)}
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <button
                      type="button"
                      onClick={() => updateDenom(denom, (counts[denom] || 0) - 1)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={counts[denom] || ""}
                      onChange={(e) => updateDenom(denom, Number(e.target.value))}
                      placeholder="0"
                      className="w-12 text-center py-1 bg-slate-50 border border-slate-200 rounded-md font-bold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => updateDenom(denom, (counts[denom] || 0) + 1)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 w-24 text-right tabular-nums">
                    = {formatRupiah(denom * (counts[denom] || 0))}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Total Akumulasi:</span>
              <span className="font-black text-emerald-700 text-sm tabular-nums">
                {formatRupiah(physicalCash)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT SELISIH (OWNER & MANAGER ONLY) */}
      {activeTab === "HISTORY" && isOwnerOrManager && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Rekapitulasi Audit Selisih Setoran Seluruh Shift
            </h3>
            <span className="text-xs text-slate-500">
              Total {closings.length} Laporan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-700 font-black text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Waktu & Cabang</th>
                  <th className="px-6 py-4">Kasir</th>
                  <th className="px-6 py-4">Uang Fisik Kasir</th>
                  <th className="px-6 py-4">Omzet Sistem</th>
                  <th className="px-6 py-4">Selisih Setoran</th>
                  <th className="px-6 py-4">Status Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Belum ada data shift closing tercatat.
                    </td>
                  </tr>
                ) : (
                  closings.map((c) => {
                    const isMatch = Math.abs(c.discrepancy) < 100
                    const isDeficit = c.discrepancy < -100

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{c.branchName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(c.closedAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {c.cashierName}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900 tabular-nums">
                          {formatRupiah(c.physicalCash)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 tabular-nums">
                          {formatRupiah(c.systemRevenue)}
                        </td>
                        <td className="px-6 py-4 font-black tabular-nums">
                          <span className={isMatch ? "text-emerald-700" : isDeficit ? "text-red-600" : "text-amber-600"}>
                            {c.discrepancy > 0 ? "+" : ""}
                            {formatRupiah(c.discrepancy)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                              isMatch
                                ? "bg-emerald-100 text-emerald-800"
                                : isDeficit
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isMatch ? "✓ Cocok / Valid" : isDeficit ? "⚠️ Selisih Kurang" : "ℹ️ Selisih Lebih"}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
