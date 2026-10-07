"use client"

import React, { useState } from "react"
import { useBranch } from "@/context/BranchContext"
import { StoreProfileSettings, Branch } from "@/types/branch"
import AddBranchModal from "@/components/branch/AddBranchModal"
import {
  Store,
  User,
  Phone,
  Camera,
  Building2,
  MapPin,
  Cpu,
  Plus,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Copy,
  MessageCircle,
  Hash,
} from "lucide-react"

export default function StoreSettingsClient({
  initialSettings,
}: {
  initialSettings: StoreProfileSettings
}) {
  const { branches, refreshBranches } = useBranch()
  const [storeName, setStoreName] = useState(initialSettings.storeName)
  const [telegramPhone, setTelegramPhone] = useState(initialSettings.telegramPhone)
  const [telegramChatId, setTelegramChatId] = useState(initialSettings.telegramChatId || "")
  const [profileImage, setProfileImage] = useState<string | null>(initialSettings.profileImage)
  
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Test telegram state
  const [testingTelegram, setTestingTelegram] = useState(false)
  const [telegramTestResult, setTelegramTestResult] = useState<{
    message: string
    cleanText?: string
    shareUrl?: string
    whatsappUrl?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Add branch modal state
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false)

  // Photo upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setProfileImage(data.url)
      } else {
        // Fallback to local base64 preview
        const reader = new FileReader()
        reader.onloadend = () => {
          setProfileImage(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    } catch (err) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    setErrorMessage(null)

    try {
      const res = await fetch("/api/settings/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: storeName.trim(),
          profileImage,
          telegramPhone: telegramPhone.trim(),
          telegramChatId: telegramChatId.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal menyimpan pengaturan")
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const handleTestTelegram = async () => {
    setTestingTelegram(true)
    setTelegramTestResult(null)

    try {
      const res = await fetch("/api/telegram/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: telegramPhone.trim(),
          chatId: telegramChatId.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal menguji bot telegram")
      }

      setTelegramTestResult({
        message: data.message || "Format laporan berhasil disiapkan!",
        cleanText: data.cleanText,
        shareUrl: data.shareUrl,
        whatsappUrl: data.whatsappUrl,
      })
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setTestingTelegram(false)
    }
  }

  const handleCopyReport = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    if (branches.length <= 1) {
      alert("Cabang utama tidak dapat dihapus jika hanya tersisa 1 cabang.")
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus cabang "${branchName}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/branches?id=${encodeURIComponent(branchId)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Gagal menghapus cabang")
      await refreshBranches()
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Pengaturan Toko & Profil
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola nama toko, logo/foto profil, integrasi grup Telegram, dan cabang gerai
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Pengaturan toko dan integrasi Telegram berhasil disimpan dan disinkronkan ke seluruh sistem!</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-red-800 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Foto Profil / Logo */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative group">
              <div className="w-28 h-28 rounded-3xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center shadow-xs">
                {profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileImage}
                    alt="Logo Toko"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-12 h-12 text-slate-300" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer transition-transform group-hover:scale-105">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-800">Foto Profil / Logo Toko</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG, atau WEBP (Maksimal 3MB)
              </p>
            </div>
          </div>

          {/* Card 2: Identitas Toko & Telegram */}
          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Toko / Bisnis <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nama Toko Anda"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Ditampilkan pada sidebar, header kasir POS, dan kop struk belanja konsumen.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor WhatsApp / Telegram Pelaporan Harian <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={telegramPhone}
                  onChange={(e) => setTelegramPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tersinkronisasi otomatis dengan nomor telepon akun saat registrasi.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ID Chat / ID Grup Telegram Toko (Opsional untuk Kirim Otomatis ke Grup)
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Contoh ID Grup: -100xxxxxxxxxx atau ID Chat Akun"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Gunakan ID Grup jika Anda ingin laporan otomatis masuk ke grup Telegram tim/manajer toko Anda. Bot UBOS akan otomatis memposting laporan ke grup ini.
              </p>

              {/* Tombol Uji Coba Laporan Telegram & Opsi Fleksibel */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testingTelegram ? "Menyiapkan..." : "Uji Coba Laporan"}</span>
                  </button>

                  {telegramTestResult?.cleanText && (
                    <button
                      type="button"
                      onClick={() => handleCopyReport(telegramTestResult.cleanText!)}
                      className={`px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border ${
                        copied
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? "✓ Teks Laporan Berhasil Disalin!" : "Salin Teks Laporan"}</span>
                    </button>
                  )}

                  {telegramTestResult?.shareUrl && (
                    <a
                      href={telegramTestResult.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-xs rounded-xl transition-colors"
                    >
                      <span>Buka di Telegram</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {telegramTestResult?.whatsappUrl && (
                    <a
                      href={telegramTestResult.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kirim via WhatsApp Langsung</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {telegramTestResult && (
                  <p className="text-[11px] text-slate-600 font-medium">
                    {telegramTestResult.message}
                  </p>
                )}

                <div className="text-[10px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200/60 space-y-1">
                  <p className="font-bold text-slate-700">💡 Cara Kerja Multi-Tenant Grup Telegram:</p>
                  <p>
                    Setiap toko yang mendaftar memiliki data grup yang terisolasi. Jika Anda mengisikan ID Grup di atas, bot akan mengirimkan laporan harian langsung ke grup toko Anda tanpa tercampur dengan toko pengguna lain.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Bagian Kelola Cabang Outlet */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                Kelola Cabang Outlet ({branches.length} Cabang Aktif)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap cabang beroperasi secara mandiri dengan omzet terpisah, interlocking katup solenoid, dan audit shift
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddBranchOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Cabang Baru</span>
          </button>
        </div>

        {/* Tabel / Grid Cabang */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch, index) => (
            <div
              key={branch.id}
              className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    {branch.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Online
                  </span>
                </div>

                <div className="flex items-start gap-1.5 text-slate-500 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{branch.location}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                  <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>ID: {branch.deviceId || `ESP32-${branch.id.toUpperCase()}`}</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {index === 0 ? "Cabang Pusat" : `Cabang #${index + 1}`}
                </span>
                {branches.length > 1 && index !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBranch(branch.id, branch.name)}
                    className="text-red-500 hover:text-red-700 p-1 transition-colors"
                    title="Hapus Cabang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddBranchModal
        isOpen={isAddBranchOpen}
        onClose={() => setIsAddBranchOpen(false)}
        onSuccess={() => refreshBranches()}
      />
    </div>
  )
}
