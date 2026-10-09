"use client"

import React, { useState, useEffect, useMemo } from "react"
import { CustomerCRM } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import { generateWhatsAppReminderUrl } from "@/lib/crmDb"
import { useBranch } from "@/context/BranchContext"
import BranchSelector from "@/components/branch/BranchSelector"
import {
  Users,
  Search,
  MessageCircle,
  Clock,
  Bike,
  Car,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  Phone,
  Store,
  ExternalLink,
  X,
} from "lucide-react"

export default function CrmClient({ initialCustomers }: { initialCustomers: CustomerCRM[] }) {
  const { selectedBranchId, isAllBranches } = useBranch()
  const [customers, setCustomers] = useState<CustomerCRM[]>(initialCustomers)
  const [search, setSearch] = useState("")
  const [vehicleFilter, setVehicleFilter] = useState<"ALL" | "MOTOR" | "MOBIL">("ALL")
  const [retentionFilter, setRetentionFilter] = useState<"ALL" | "DUE">("ALL")
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Add customer form state
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newPlate, setNewPlate] = useState("")
  const [newVehicleType, setNewVehicleType] = useState<"MOTOR" | "MOBIL">("MOTOR")
  const [newServiceType, setNewServiceType] = useState("Isi Angin Nitrogen & Servis Oli")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch CRM data on mount and branch change
  useEffect(() => {
    const branchParam = isAllBranches ? "ALL" : selectedBranchId
    fetch(`/api/crm?branchId=${branchParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setCustomers(data.data)
      })
      .catch(console.error)
  }, [selectedBranchId, isAllBranches])

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Branch filter
      if (!isAllBranches && c.branchId && c.branchId !== selectedBranchId) return false

      // Vehicle filter
      if (vehicleFilter !== "ALL" && c.vehicleType !== vehicleFilter) return false

      // Retention filter (due if > 30 days ago)
      if (retentionFilter === "DUE") {
        const diffDays = Math.floor(
          (Date.now() - new Date(c.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (diffDays < 30) return false
      }

      // Search query
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.plateNumber.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      )
    })
  }, [customers, selectedBranchId, isAllBranches, vehicleFilter, retentionFilter, search])

  // KPI Calculations
  const totalCount = customers.length
  const dueCount = customers.filter((c) => {
    const days = Math.floor((Date.now() - new Date(c.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24))
    return days >= 30
  }).length
  const totalCustomerSpend = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0)

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlate || !newPhone) return
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName || `Pelanggan ${newPlate}`,
          phone: newPhone,
          vehiclePlate: newPlate,
          vehicleType: newVehicleType,
          serviceType: newServiceType,
          branchId: selectedBranchId || "branch-utama",
          branchName: "Cabang Utama",
          totalSpent: 50000,
        }),
      })

      const data = await res.json()
      if (data.data) {
        setCustomers((prev) => [data.data, ...prev])
        setIsAddOpen(false)
        setNewName("")
        setNewPhone("")
        setNewPlate("")
      }
    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Customer Retention & CRM
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Database loyalitas pelanggan, riwayat servis plat nomor, dan otomatisasi pengingat WhatsApp
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data Pelanggan</span>
          </button>
          <div className="w-full sm:w-60">
            <BranchSelector allowAll={true} />
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black uppercase text-slate-400">Total Pelanggan Terdaftar</span>
          <p className="text-2xl font-black text-slate-900 tabular-nums mt-1">{totalCount} Kendaraan</p>
          <p className="text-xs text-slate-500 mt-1">Tersinkronisasi otomatis saat transaksi POS</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black uppercase text-slate-400">Perlu Pengingat Servis (&gt;30 Hari)</span>
          <p className="text-2xl font-black text-amber-600 tabular-nums mt-1">{dueCount} Pelanggan</p>
          <p className="text-xs text-amber-700 font-semibold mt-1">Siap dikirim pesan WhatsApp retention</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black uppercase text-slate-400">Total Belanja Pelanggan</span>
          <p className="text-2xl font-black text-emerald-700 tabular-nums mt-1">{formatRupiah(totalCustomerSpend)}</p>
          <p className="text-xs text-slate-500 mt-1">Akumulasi seluruh riwayat transaksi</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari plat nomor, nama, atau nomor WhatsApp..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Vehicle Type Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setVehicleFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg ${vehicleFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"}`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setVehicleFilter("MOTOR")}
              className={`px-3 py-1.5 rounded-lg ${vehicleFilter === "MOTOR" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"}`}
            >
              Motor
            </button>
            <button
              type="button"
              onClick={() => setVehicleFilter("MOBIL")}
              className={`px-3 py-1.5 rounded-lg ${vehicleFilter === "MOBIL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"}`}
            >
              Mobil
            </button>
          </div>

          {/* Retention status toggle */}
          <button
            type="button"
            onClick={() => setRetentionFilter(retentionFilter === "ALL" ? "DUE" : "ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              retentionFilter === "DUE"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{retentionFilter === "DUE" ? "Hanya Butuh Servis" : "Semua Status"}</span>
          </button>
        </div>
      </div>

      {/* Customer List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Tidak ada data pelanggan yang cocok dengan pencarian / filter.
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const diffDays = Math.floor(
              (Date.now() - new Date(c.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)
            )
            const isDue = diffDays >= 30
            const waUrl = generateWhatsAppReminderUrl(c)

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                        {c.vehicleType === "MOTOR" ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">{c.plateNumber}</h3>
                        <p className="text-xs text-slate-500 font-medium">{c.name}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        isDue
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isDue ? `Waktunya Servis (${diffDays}h)` : `${diffDays} hari lalu`}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Servis Terakhir:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                        {c.lastServiceType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Outlet Kunjungan:</span>
                      <span className="font-medium text-slate-700">{c.branchName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Belanja:</span>
                      <span className="font-bold text-emerald-700">{formatRupiah(c.totalSpent)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">WhatsApp:</span>
                      <span className="font-mono text-slate-700">{c.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isDue
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Kirim Pengingat WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Tambah Pelanggan Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Pelanggan CRM</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plat Nomor Kendaraan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  placeholder="B 1234 ABC"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Pak Bambang"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="08123456789"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kendaraan</label>
                <select
                  value={newVehicleType}
                  onChange={(e) => setNewVehicleType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="MOTOR">Sepeda Motor</option>
                  <option value="MOBIL">Mobil</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Servis</label>
                <input
                  type="text"
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
