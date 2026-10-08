"use client"

import { useState, useMemo, useEffect } from "react"
import { useBranch } from "@/context/BranchContext"
import { InterlockingProduct } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import BranchSelector from "@/components/branch/BranchSelector"
import {
  PackageSearch,
  Gauge,
  Droplets,
  Cpu,
  Bike,
  Car,
  Clock,
  Pencil,
  Plus,
  Search,
  Barcode,
  Package,
  Check,
  X,
} from "lucide-react"

export default function KatalogNitrogenRetailClient({
  initialProducts,
  userRole,
}: {
  initialProducts: InterlockingProduct[]
  userRole?: string
}) {
  const { selectedBranch } = useBranch()
  const [products, setProducts] = useState<InterlockingProduct[]>(initialProducts)
  const [activeTab, setActiveTab] = useState<"NITROGEN" | "RETAIL">("NITROGEN")
  const [searchQuery, setSearchQuery] = useState("")

  // Edit Nitrogen Modal State
  const [editingNitrogen, setEditingNitrogen] = useState<InterlockingProduct | null>(null)
  const [nitroPrice, setNitroPrice] = useState<number>(0)
  const [nitroTimer, setNitroTimer] = useState<number>(15)
  const [savingNitro, setSavingNitro] = useState(false)

  // Add/Edit Retail Modal State
  const [editingRetail, setEditingRetail] = useState<Partial<InterlockingProduct> | null>(null)
  const [retailName, setRetailName] = useState("")
  const [retailBarcode, setRetailBarcode] = useState("")
  const [retailPrice, setRetailPrice] = useState<number>(0)
  const [retailCostPrice, setRetailCostPrice] = useState<number>(0)
  const [retailStock, setRetailStock] = useState<number>(0)
  const [savingRetail, setSavingRetail] = useState(false)

  // Dynamic sync with catalog on branch change
  useEffect(() => {
    if (!selectedBranch?.id) return
    fetch(`/api/catalog/products?branchId=${selectedBranch.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products)
        }
      })
      .catch(console.error)
  }, [selectedBranch?.id])

  const nitrogenItems = useMemo(() => {
    return products.filter((p) => p.category === "NITROGEN")
  }, [products])

  const retailItems = useMemo(() => {
    return products.filter((p) => {
      if (p.category !== "RETAIL") return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      )
    })
  }, [products, searchQuery])

  const openEditNitrogen = (item: InterlockingProduct) => {
    setEditingNitrogen(item)
    setNitroPrice(item.price)
    setNitroTimer(item.timerSeconds || 15)
  }

  const handleSaveNitrogen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNitrogen) return
    setSavingNitro(true)

    try {
      const res = await fetch("/api/catalog/nitrogen/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingNitrogen.id,
          price: nitroPrice,
          timerSeconds: nitroTimer,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Gagal update nitrogen")

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingNitrogen.id
            ? { ...p, price: nitroPrice, timerSeconds: nitroTimer }
            : p
        )
      )
      setEditingNitrogen(null)
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSavingNitro(false)
    }
  }

  const openAddRetail = () => {
    setEditingRetail({})
    setRetailName("")
    setRetailBarcode("")
    setRetailPrice(0)
    setRetailCostPrice(0)
    setRetailStock(10)
  }

  const openEditRetail = (p: InterlockingProduct) => {
    setEditingRetail(p)
    setRetailName(p.name)
    setRetailBarcode(p.barcode || "")
    setRetailPrice(p.price)
    setRetailCostPrice(p.costPrice)
    setRetailStock(p.stock)
  }

  const handleSaveRetail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingRetail(true)

    try {
      const res = await fetch("/api/catalog/retail/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRetail?.id,
          name: retailName,
          barcode: retailBarcode,
          price: retailPrice,
          costPrice: retailCostPrice,
          stock: retailStock,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Gagal menyimpan barang ritel")

      const saved = data.product
      setProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = saved
          return updated
        }
        return [...prev, saved]
      })

      setEditingRetail(null)
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSavingRetail(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <PackageSearch className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Katalog & Konfigurasi Interlocking
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola tarif layanan nitrogen (timer katup solenoid ESP32) serta stok barang ritel & oli
          </p>
        </div>

        <div className="w-full md:w-64">
          <BranchSelector />
        </div>
      </div>

      {/* Main Category Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("NITROGEN")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === "NITROGEN"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Gauge className="w-4 h-4 text-emerald-600" />
          <span>Layanan Nitrogen</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
            4 Jasa
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("RETAIL")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === "RETAIL"
              ? "bg-white text-blue-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Droplets className="w-4 h-4 text-blue-600" />
          <span>Ritel / Oli</span>
          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
            Stok Cabang
          </span>
        </button>
      </div>

      {/* TAB 1: NITROGEN SERVICES */}
      {activeTab === "NITROGEN" && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-700" />
                <span>Konfigurasi Katup Solenoid IoT (Hardware Interlocking)</span>
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                Layanan nitrogen merupakan jasa murni (non-stok). Durasi detik yang disetel di sini akan dikirim ke sensor ESP32 untuk membuka katup gas secara otomatis saat kasir memproses struk.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nitrogenItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                        {item.vehicleType === "MOTOR" ? <Bike className="w-6 h-6" /> : <Car className="w-6 h-6" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          {item.vehicleType} • {item.serviceType === "TAMBAH" ? "Tambah Angin" : "Kuras & Full"}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900">{item.name}</h3>
                      </div>
                    </div>

                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      Non-Stok
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Tarif Pengisian</p>
                      <p className="text-lg font-black text-slate-900 tabular-nums">
                        {formatRupiah(item.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Durasi Katup Buka</p>
                      <p className="text-lg font-black text-emerald-700 flex items-center gap-1.5 tabular-nums">
                        <Clock className="w-4 h-4" />
                        <span>{item.timerSeconds} Detik</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => openEditNitrogen(item)}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Tarif & Timer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RETAIL / OLI */}
      {activeTab === "RETAIL" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari barcode / nama oli & barang..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-500 shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="button"
              onClick={openAddRetail}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Barang Ritel</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-700 font-black text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Barang & SKU</th>
                    <th className="px-6 py-4">Harga Modal (HPP)</th>
                    <th className="px-6 py-4">Harga Jual</th>
                    <th className="px-6 py-4">Margin Laba</th>
                    <th className="px-6 py-4">Stok ({selectedBranch.name})</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {retailItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Tidak ada barang ritel ditemukan.
                      </td>
                    </tr>
                  ) : (
                    retailItems.map((item) => {
                      const marginPercent =
                        item.price > 0
                          ? Math.round(((item.price - item.costPrice) / item.price) * 100)
                          : 0

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Droplets className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                                  <Barcode className="w-3 h-3 text-slate-400" />
                                  <span>Barcode: {item.barcode || "-"}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700 tabular-nums">
                            {formatRupiah(item.costPrice)}
                          </td>
                          <td className="px-6 py-4 font-black text-slate-900 tabular-nums">
                            {formatRupiah(item.price)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full">
                              +{marginPercent}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                item.stock > 10
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.stock > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              <Package className="w-3 h-3" />
                              <span>{item.stock} Pcs</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openEditRetail(item)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 inline-flex items-center gap-1"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit / Stok</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Edit Layanan Nitrogen */}
      {editingNitrogen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">
                Edit Tarif & Timer: {editingNitrogen.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingNitrogen(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNitrogen} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tarif Penjualan (Rupiah) *
                </label>
                <input
                  type="number"
                  required
                  value={nitroPrice}
                  onChange={(e) => setNitroPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Durasi Katup Solenoid Terbuka (Detik) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="300"
                    required
                    value={nitroTimer}
                    onChange={(e) => setNitroTimer(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-16"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Detik
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Rekomendasi: Motor Tambah 15s, Motor Full 35s, Mobil Tambah 30s, Mobil Full 90s.
                </p>
              </div>

              <div className="pt-4 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingNitrogen(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingNitro}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  {savingNitro ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <span>Simpan Perubahan</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add / Edit Ritel & Oli */}
      {editingRetail && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingRetail.id ? "Edit Barang Ritel" : "Tambah Barang Ritel Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRetail} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang *</label>
                <input
                  type="text"
                  required
                  value={retailName}
                  onChange={(e) => setRetailName(e.target.value)}
                  placeholder="Contoh: Oli Yamalube Matic 0.8L"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Barcode / SKU (Untuk Scanner)
                </label>
                <input
                  type="text"
                  value={retailBarcode}
                  onChange={(e) => setRetailBarcode(e.target.value)}
                  placeholder="Contoh: 8999901001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Modal / HPP *
                  </label>
                  <input
                    type="number"
                    required
                    value={retailCostPrice}
                    onChange={(e) => setRetailCostPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Jual Kasir *
                  </label>
                  <input
                    type="number"
                    required
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stok Fisik di Cabang {selectedBranch.name} *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={retailStock}
                  onChange={(e) => setRetailStock(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingRetail(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRetail}
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
                >
                  {savingRetail ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <span>Simpan Barang</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
