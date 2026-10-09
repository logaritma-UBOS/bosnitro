"use client"

import React, { useState, useEffect } from "react"
import { useBranch } from "@/context/BranchContext"
import { Branch } from "@/types/branch"
import { Building2, MapPin, Cpu, Save, X, CheckCircle2, AlertCircle } from "lucide-react"

interface EditBranchModalProps {
  branch: Branch | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (updatedBranch: Branch) => void
}

export default function EditBranchModal({ branch, isOpen, onClose, onSuccess }: EditBranchModalProps) {
  const { updateBranchState } = useBranch()
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [deviceId, setDeviceId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (branch) {
      setName(branch.name)
      setLocation(branch.location || "")
      setDeviceId(branch.deviceId || "")
      setError(null)
      setSuccess(false)
    }
  }, [branch, isOpen])

  if (!isOpen || !branch) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Nama cabang wajib diisi.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/branches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: branch.id,
          name: name.trim(),
          location: location.trim(),
          deviceId: deviceId.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal memperbarui data cabang")
      }

      updateBranchState(data.branch)
      if (onSuccess) onSuccess(data.branch)
      setSuccess(true)

      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan perubahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[85] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Edit Data Cabang</h3>
            <p className="text-xs text-slate-500">Sesuaikan nama outlet dan alamat gerai fisik Anda</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Data cabang berhasil diperbarui!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Cabang <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Cabang Utama / Gerai Tambun"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat / Lokasi Outlet <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Jl. Sultan Hasanudin No. 10, Tambun Selatan"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ID Modul Hardware IoT (Opsional)
            </label>
            <div className="relative">
              <Cpu className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="ESP32-UTAMA"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Identifier unik perangkat IoT solenoid relay untuk gerai ini.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
