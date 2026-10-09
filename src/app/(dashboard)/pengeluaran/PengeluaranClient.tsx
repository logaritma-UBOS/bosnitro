"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useBranch } from "@/context/BranchContext"
import BranchSelector from "@/components/branch/BranchSelector"
import { formatRupiah } from "@/lib/format"
import { BranchExpense } from "@/lib/interlockingDb"
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  FileText,
} from "lucide-react"

export default function PengeluaranClient() {
  const { selectedBranch, selectedBranchId, isAllBranches, setSelectedBranchId, branches } = useBranch()
  const [expenses, setExpenses] = useState<BranchExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form State
  const [category, setCategory] = useState("Bahan Baku")
  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState("")

  const kategoriList = [
    "Bahan Baku",
    "Listrik & Air",
    "Gas & Kompresor",
    "Transportasi & Logistik",
    "Gaji & Uang Makan",
    "Perawatan Alat & IoT",
    "Kemasan & Perlengkapan",
    "Marketing & Promosi",
    "Lainnya",
  ]

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const branchParam = isAllBranches ? "ALL" : selectedBranchId
      const res = await fetch(`/api/expenses?branchId=${branchParam}`)
      const data = await res.json()
      if (data.expenses && Array.isArray(data.expenses)) {
        setExpenses(data.expenses)
      } else {
        setExpenses([])
      }
    } catch (err) {
      console.error("Gagal memuat pengeluaran:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [selectedBranchId, isAllBranches])

  const totalPengeluaran = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0)
  }, [expenses])

  const averageHarian = useMemo(() => {
    const day = new Date().getDate() || 1
    return expenses.length > 0 ? Math.round(totalPengeluaran / day) : 0
  }, [expenses, totalPengeluaran])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) {
      setErrorMsg("Nominal pengeluaran harus lebih dari 0")
      return
    }

    if (isAllBranches) {
      setErrorMsg("Pilih cabang spesifik terlebih dahulu untuk mencatat pengeluaran.")
      return
    }

    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranchId,
          category,
          amount,
          description,
        }),
      })

      const data = await res.json()
      if (data.error) {
        setErrorMsg(data.error)
      } else {
        setShowAddModal(false)
        setAmount(0)
        setDescription("")
        fetchExpenses()
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan pengeluaran")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Yakin ingin menghapus catatan pengeluaran ini?")) return
    try {
      await fetch(`/api/expenses?id=${id}`, { method: "DELETE" })
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      console.error("Gagal menghapus pengeluaran:", err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/beranda"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-slate-900">
                {isAllBranches
                  ? "Akumulasi Pengeluaran Seluruh Cabang"
                  : `Pengeluaran Operasional - ${selectedBranch.name}`}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Catatan biaya operasional yang langsung terakumulasi ke laporan keuangan konsolidasi.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <BranchSelector />
            {!isAllBranches && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Pengeluaran</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Warning if on All Branches */}
        {isAllBranches && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">Mode Akumulasi Semua Cabang Aktif</p>
                <p className="mt-0.5">
                  Pengeluaran dicatat per-cabang secara terpisah. Untuk mencatat pengeluaran operasional baru, silakan pilih salah satu cabang fisik.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* KPI Summary Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">
                Ringkasan Biaya ({isAllBranches ? "Semua Cabang" : selectedBranch.name})
              </h2>
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Total Pengeluaran Bulan Ini</p>
                <p className="text-3xl font-black text-red-600 tabular-nums">
                  {formatRupiah(totalPengeluaran)}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Rata-rata Harian</p>
                  <p className="text-base font-bold text-slate-800 tabular-nums">
                    {formatRupiah(averageHarian)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-0.5">Jumlah Catatan</p>
                  <p className="text-base font-bold text-slate-800">{expenses.length} Transaksi</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">Akumulasi Otomatis:</span> Setiap pengeluaran yang dicatat di cabang ini akan langsung memotong laba kotor pada <strong>Laporan Keuangan Konsolidasi</strong> di Semua Cabang untuk menghitung Laba Bersih yang akurat.
            </div>
          </div>

          {/* Expenses List */}
          <div className="lg:col-span-8 space-y-3">
            {loading ? (
              <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
                Memuat data pengeluaran...
              </div>
            ) : expenses.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-bold mb-1">Belum Ada Catatan Pengeluaran</p>
                <p className="text-xs text-slate-400 mb-4">
                  {isAllBranches
                    ? "Belum ada cabang yang mencatat pengeluaran operasional."
                    : `Belum ada pengeluaran yang dicatat untuk ${selectedBranch.name}.`}
                </p>
                {!isAllBranches && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-block bg-red-600 text-white px-4 py-2 text-xs font-bold rounded-xl hover:bg-red-700 transition-colors shadow-xs"
                  >
                    + Catat Pengeluaran Pertama
                  </button>
                )}
              </div>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex justify-between items-center hover:border-red-200 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{exp.category}</span>
                      {isAllBranches && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {exp.branchName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(exp.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      &bull; {exp.description || "Tidak ada catatan"}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-black text-red-600 tabular-nums">
                        {formatRupiah(exp.amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Pengeluaran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Catat Pengeluaran Baru</h3>
                <p className="text-xs text-slate-500">Cabang: {selectedBranch.name}</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Pengeluaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {kategoriList.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Beli oli galon cadangan / Token listrik"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || !amount}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {saving ? "Menyimpan..." : "Simpan Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
