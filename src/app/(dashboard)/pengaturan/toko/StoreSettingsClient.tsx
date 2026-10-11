"use client"

import React, { useState, useEffect } from "react"
import { useBranch } from "@/context/BranchContext"
import { StoreProfileSettings, HardwareSettings } from "@/types/branch"
import BluetoothPrinterModal from "@/components/bluetooth/BluetoothPrinterModal"
import { formatRupiah } from "@/lib/format"
import {
  formatTextReceipt,
  printDirectWebBluetooth,
  getRawBtIntentUrl,
} from "@/lib/bluetoothPrinter"
import {
  Store,
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
  Radio,
  Video,
  Printer,
  Bluetooth,
  Trophy,
  Zap,
  Play,
  Check,
  Cloud,
  Key,
  Eye,
  EyeOff,
} from "lucide-react"

export default function StoreSettingsClient({
  initialSettings,
}: {
  initialSettings: StoreProfileSettings
}) {
  const { branches, refreshBranches, selectedBranchId, selectedBranch, isAllBranches } = useBranch()
  const [activeTab, setActiveTab] = useState<"PROFIL" | "HARDWARE" | "TARGET_REWARD">(
    isAllBranches ? "PROFIL" : "HARDWARE"
  )
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false)

  // Strictly enforce tab isolation: Owner mode has PROFIL & TARGET_REWARD, Branch mode has only HARDWARE
  useEffect(() => {
    if (isAllBranches) {
      if (activeTab === "HARDWARE") {
        setActiveTab("PROFIL")
      }
    } else {
      if (activeTab !== "HARDWARE") {
        setActiveTab("HARDWARE")
      }
    }
  }, [isAllBranches, activeTab])

  // Store Profile State
  const [storeName, setStoreName] = useState(initialSettings.storeName)
  const [telegramPhone, setTelegramPhone] = useState(initialSettings.telegramPhone)
  const [telegramChatId, setTelegramChatId] = useState(initialSettings.telegramChatId || "")
  const [telegramBotToken, setTelegramBotToken] = useState(() => {
    if (initialSettings.telegramBotToken) return initialSettings.telegramBotToken
    if (typeof window !== "undefined") {
      const dedicated = localStorage.getItem("bosnitro_telegram_bot_token")
      if (dedicated) return dedicated
      const userKey = initialSettings.userId || initialSettings.userEmail || "default"
      const saved = localStorage.getItem(`ubos_store_settings_${userKey}`) || localStorage.getItem("ubos_store_settings")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.telegramBotToken) return parsed.telegramBotToken
        } catch (e) {}
      }
    }
    return ""
  })
  const [showBotToken, setShowBotToken] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(initialSettings.profileImage)

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sync with browser localStorage on mount to guarantee client persistence scoped by account
  useEffect(() => {
    try {
      const userKey = initialSettings.userId || initialSettings.userEmail || "default"
      const dedicated = localStorage.getItem("bosnitro_telegram_bot_token")
      const saved = localStorage.getItem(`ubos_store_settings_${userKey}`) || localStorage.getItem("ubos_store_settings")
      let localBotToken = dedicated || ""
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.storeName && !initialSettings.storeName) setStoreName(parsed.storeName)
        if (parsed.telegramPhone && !initialSettings.telegramPhone) setTelegramPhone(parsed.telegramPhone)
        if (parsed.telegramChatId && !initialSettings.telegramChatId) setTelegramChatId(parsed.telegramChatId)
        if (parsed.telegramBotToken && !localBotToken) localBotToken = parsed.telegramBotToken
      }
      const effectiveToken = initialSettings.telegramBotToken || localBotToken
      if (effectiveToken) {
        setTelegramBotToken(effectiveToken)
        localStorage.setItem("bosnitro_telegram_bot_token", effectiveToken)

        if (!initialSettings.telegramBotToken && localBotToken) {
          fetch("/api/settings/store", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storeName: initialSettings.storeName || "BOSNITRO",
              telegramBotToken: localBotToken,
            }),
          }).catch(() => {})
        }
      }
    } catch (e) {}
  }, [initialSettings])

  // Hardware Settings State
  const [hwSettings, setHwSettings] = useState<HardwareSettings>({
    esp32Ip: "192.168.1.150:81",
    esp32Token: "UBOS-SECURE-KEY-8899",
    motorTimerTambah: 15,
    motorTimerBaru: 30,
    mobilTimerTambah: 30,
    mobilTimerFull: 60,
    cctvSnapshotUrl: "http://192.168.1.180/cgi-bin/snapshot.cgi",
    cctvCaptureMode: "BOTH",
    cctvAuthUser: "admin",
    cctvAuthPass: "admin123",
    bluetoothPrinterName: "RPP02N / MPT-II",
    bluetoothPrinterMac: "66:32:B1:88:9F:12",
    paperSize: "58mm",
    printerDriverMode: "WEB_BLUETOOTH",
    autoPrintAfterPayment: true,
    targetDailyOmzet: 2500000,
    rewardBonusPool: 2000000,
    rewardCriteria: "DAILY_AVG_TARGET",
  })

  // Hardware Test Results
  const [espTestResult, setEspTestResult] = useState<string | null>(null)
  const [testingEsp, setTestingEsp] = useState(false)
  const [cctvTestResult, setCctvTestResult] = useState<{ message: string; url?: string } | null>(null)
  const [testingCctv, setTestingCctv] = useState(false)
  const [printerTestResult, setPrinterTestResult] = useState<string | null>(null)
  const [testingPrinter, setTestingPrinter] = useState(false)

  // Cloudinary state
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState("")
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState("")
  const [cloudinaryStatus, setCloudinaryStatus] = useState<{
    cloudName: string
    apiKey: string
    hasSecret: boolean
    hasPreset: boolean
    isConfigured: boolean
  } | null>(null)
  const [savingCloudinary, setSavingCloudinary] = useState(false)
  const [cloudinaryFeedback, setCloudinaryFeedback] = useState<string | null>(null)

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

  // Load Cloudinary status on mount
  useEffect(() => {
    fetch("/api/cloudinary/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          setCloudinaryStatus(data)
        }
      })
      .catch(console.error)
  }, [])

  // Load hardware settings per selected branch (Isolated per branch)
  useEffect(() => {
    const branchParam = isAllBranches ? "branch-utama" : selectedBranchId
    fetch(`/api/hardware/settings?branchId=${branchParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setHwSettings((prev) => ({ ...prev, ...data }))
        }
      })
      .catch(console.error)
  }, [selectedBranchId, isAllBranches])

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
        const reader = new FileReader()
        reader.onloadend = () => setProfileImage(reader.result as string)
        reader.readAsDataURL(file)
      }
    } catch {
      const reader = new FileReader()
      reader.onloadend = () => setProfileImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Save Store Profile
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
          telegramBotToken: telegramBotToken.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Gagal menyimpan")

      // Persist in localStorage for instant synchronization scoped by account and dedicated token key
      try {
        const userKey = initialSettings.userId || initialSettings.userEmail || "default"
        if (telegramBotToken.trim()) {
          localStorage.setItem("bosnitro_telegram_bot_token", telegramBotToken.trim())
        }
        const settingsPayload = {
          storeName: storeName.trim(),
          profileImage,
          telegramPhone: telegramPhone.trim(),
          telegramChatId: telegramChatId.trim(),
          telegramBotToken: telegramBotToken.trim(),
        }
        localStorage.setItem(`ubos_store_settings_${userKey}`, JSON.stringify(settingsPayload))
        localStorage.setItem("ubos_store_settings", JSON.stringify(settingsPayload))
      } catch (e) {}

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menyimpan")
    } finally {
      setSaving(false)
    }
  }

  // Save Hardware & Reward Settings
  const handleSaveHardwareSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    setErrorMessage(null)

    const targetBranch = isAllBranches ? "branch-utama" : selectedBranchId

    try {
      const res = await fetch("/api/hardware/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...hwSettings,
          branchId: targetBranch,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Gagal menyimpan hardware settings")

      if (cloudinaryApiSecret || cloudinaryUploadPreset) {
        await fetch("/api/cloudinary/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiSecret: cloudinaryApiSecret || undefined,
            uploadPreset: cloudinaryUploadPreset || undefined,
          }),
        }).catch(console.error)
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan pengaturan hardware")
    } finally {
      setSaving(false)
    }
  }

  // Hardware Test: ESP32 Valve
  const handleTestEsp32 = async () => {
    setTestingEsp(true)
    setEspTestResult(null)
    const targetBranch = isAllBranches ? "branch-utama" : selectedBranchId
    try {
      const res = await fetch("/api/hardware/iot-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: targetBranch,
          durationSeconds: hwSettings.motorTimerTambah,
          vehicleType: "MOTOR",
          serviceVariant: "ISI_TAMBAH",
        }),
      })
      const data = await res.json()
      setEspTestResult(data.message || "Sinyal IoT sukses terkirim ke ESP32!")
    } catch (e: any) {
      setEspTestResult("Gagal: " + e.message)
    } finally {
      setTestingEsp(false)
    }
  }

  // Hardware Test: CCTV Snapshot
  const handleTestCctv = async () => {
    setTestingCctv(true)
    setCctvTestResult(null)
    const targetBranch = isAllBranches ? "branch-utama" : selectedBranchId
    try {
      const res = await fetch("/api/hardware/cctv-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: targetBranch,
          snapshotType: "PLAT_NOMOR",
          vehiclePlate: "B 1234 TEST",
        }),
      })
      const data = await res.json()
      setCctvTestResult({
        message: data.message || "Snapshot CCTV berhasil ditangkap!",
        url: data.data?.imageUrl,
      })
    } catch (e: any) {
      setCctvTestResult({ message: "Gagal: " + e.message })
    } finally {
      setTestingCctv(false)
    }
  }

  // Hardware Test: Bluetooth Printer
  const handleTestPrinter = async () => {
    setTestingPrinter(true)
    setPrinterTestResult(null)
    try {
      const dummyTx: any = {
        id: "TEST-PRINT-" + Date.now().toString().slice(-4),
        branchName: storeName || "Cabang Utama",
        cashierName: "Admin Owner",
        customerPlate: "B 8888 PRO",
        createdAt: new Date().toISOString(),
        items: [{ productName: "Test Uji Thermal Printer", quantity: 1, price: 10000, subtotal: 10000 }],
        totalAmount: 10000,
        paymentMethod: "CASH",
      }

      const receiptText = formatTextReceipt(dummyTx, storeName, hwSettings.paperSize, "TES HARDWARE BLUETOOTH OK")

      if (hwSettings.printerDriverMode === "WEB_BLUETOOTH") {
        const res = await printDirectWebBluetooth(receiptText)
        setPrinterTestResult(res.message)
      } else {
        const url = getRawBtIntentUrl(receiptText)
        window.location.href = url
        setPrinterTestResult("Membuka aplikasi RawBT Helper...")
      }
    } catch (e: any) {
      setPrinterTestResult("Error Printer: " + e.message)
    } finally {
      setTestingPrinter(false)
    }
  }

  // Test Telegram
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
          botToken: telegramBotToken.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Gagal menguji bot")
      setTelegramTestResult({
        message: data.message || "Format laporan disiapkan!",
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

  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    if (branches.length <= 1) {
      alert("Cabang utama tidak dapat dihapus jika hanya tersisa 1 cabang.")
      return
    }
    if (!confirm(`Hapus cabang "${branchName}"?`)) return
    try {
      const res = await fetch(`/api/branches?id=${encodeURIComponent(branchId)}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      await refreshBranches()
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isAllBranches ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
            }`}>
              {isAllBranches ? <Building2 className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {isAllBranches ? "Pengaturan Pusat Bisnis & Target (Owner)" : `Pengaturan Hardware & IoT - ${selectedBranch?.name || "Cabang Outlet"}`}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {isAllBranches
              ? "Kelola identitas brand, nomor & bot Telegram laporan, serta target 30 hari & bonus reward yang disinkronisasi ke seluruh cabang."
              : `Kelola integrasi modul ESP32, kamera CCTV plat/botol, dan printer Bluetooth thermal untuk ${selectedBranch?.name || "cabang ini"} (${selectedBranch?.location || ""}).`}
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Pengaturan berhasil disimpan dan disinkronkan ke seluruh sistem!</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-red-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-1 overflow-x-auto">
        {isAllBranches ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("PROFIL")}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === "PROFIL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Profil Toko & Telegram</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("TARGET_REWARD")}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === "TARGET_REWARD" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span>Target 30 Hari & Reward</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab("HARDWARE")}
            className="py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap bg-white text-slate-900 shadow-xs transition-all"
          >
            <Cpu className="w-4 h-4 text-amber-600" />
            <span>Integrasi Hardware & IoT</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">
              ESP32 • CCTV • BT
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: PROFIL TOKO & TELEGRAM (HANYA MUNCUL DI LEVEL OWNER / SEMUA CABANG) */}
      {isAllBranches && activeTab === "PROFIL" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative group">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center shadow-xs">
                  {profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileImage} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer transition-transform group-hover:scale-105">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Logo / Foto Profil Toko</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP (Max 3MB)</p>
              </div>
            </div>

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
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor WhatsApp / Telegram Laporan Harian <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={telegramPhone}
                    onChange={(e) => setTelegramPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ID Chat / Grup Telegram Toko (Opsional)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="Contoh: -100xxxxxxxxxx"
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Token Bot Telegram (Opsional untuk Kirim Otomatis)
                  </label>
                  <span className="text-[10px] text-slate-400">Dari @BotFather</span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showBotToken ? "text" : "password"}
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    placeholder="Contoh: 7123456789:AAHxxxxx..."
                    className="w-full pl-9 pr-10 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBotToken(!showBotToken)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showBotToken ? "Sembunyikan Token" : "Tampilkan Token"}
                  >
                    {showBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Masukkan token dari <strong>@BotFather</strong> dan pastikan bot telah diundang ke grup Telegram toko (<strong>{telegramChatId || "-5332437584"}</strong>) agar laporan terkirim 100% otomatis.
                </p>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={testingTelegram}
                  className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  <span>{testingTelegram ? "Menguji..." : "Uji Coba Kirim Telegram"}</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Menyimpan..." : "Simpan Profil Toko"}</span>
                </button>
              </div>

              {telegramTestResult && (
                <div className={`p-4 rounded-2xl text-xs font-medium border animate-in fade-in ${
                  telegramTestResult.message.startsWith("✓")
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-sky-50 border-sky-200 text-sky-900"
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">{telegramTestResult.message}</span>
                  </div>
                  {telegramTestResult.shareUrl && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a
                        href={telegramTestResult.shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka di Telegram</span>
                      </a>
                      {telegramTestResult.cleanText && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(telegramTestResult.cleanText || "")
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copied ? "Tersalin!" : "Salin Teks"}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: INTEGRASI HARDWARE & IOT (Terisolasi Khusus per Cabang) */}
      {!isAllBranches && activeTab === "HARDWARE" && (
        <form onSubmit={handleSaveHardwareSettings} className="space-y-6">
          {/* Active Branch Hardware Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-sm font-extrabold text-emerald-950">
                  Konfigurasi Hardware & IoT: {selectedBranch.name}
                </h4>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Alamat IP ESP32, kamera CCTV, dan printer Bluetooth ini terisolasi dan hanya berlaku untuk gerai {selectedBranch.name}.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-mono font-bold self-start sm:self-auto">
              {selectedBranch.deviceId || selectedBranch.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SUB-PANEL 1: IOT NITROGEN (ESP32) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">IoT Nitrogen (ESP32)</h3>
                  <p className="text-[10px] text-slate-500">Katup Solenoid & Relay Control</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  IP / WebSocket URI ESP32
                </label>
                <input
                  type="text"
                  value={hwSettings.esp32Ip}
                  onChange={(e) => setHwSettings({ ...hwSettings, esp32Ip: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl"
                  placeholder="192.168.1.150:81"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Token Keamanan Solenoid
                </label>
                <input
                  type="password"
                  value={hwSettings.esp32Token}
                  onChange={(e) => setHwSettings({ ...hwSettings, esp32Token: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Motor Tambah (s)</label>
                  <input
                    type="number"
                    value={hwSettings.motorTimerTambah}
                    onChange={(e) => setHwSettings({ ...hwSettings, motorTimerTambah: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Motor Baru (s)</label>
                  <input
                    type="number"
                    value={hwSettings.motorTimerBaru}
                    onChange={(e) => setHwSettings({ ...hwSettings, motorTimerBaru: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Mobil Tambah (s)</label>
                  <input
                    type="number"
                    value={hwSettings.mobilTimerTambah}
                    onChange={(e) => setHwSettings({ ...hwSettings, mobilTimerTambah: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Mobil Kuras/Full (s)</label>
                  <input
                    type="number"
                    value={hwSettings.mobilTimerFull}
                    onChange={(e) => setHwSettings({ ...hwSettings, mobilTimerFull: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestEsp32}
                  disabled={testingEsp}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{testingEsp ? "Menguji..." : "Uji Sinyal Solenoid (15s)"}</span>
                </button>
                {espTestResult && (
                  <p className="text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded-lg mt-2 font-medium">
                    {espTestResult}
                  </p>
                )}
              </div>
            </div>

            {/* SUB-PANEL 2: AUTO-CAPTURE CCTV / SNAPSHOT */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Auto-Capture CCTV</h3>
                  <p className="text-[10px] text-slate-500">Kamera Plat & Botol Bekas</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mode Kamera Audit
                </label>
                <select
                  value={hwSettings.cctvCaptureMode}
                  onChange={(e) => setHwSettings({ ...hwSettings, cctvCaptureMode: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium"
                >
                  <option value="BOTH">Opsi Fleksibel (Kamera Tablet/HP & CCTV IP)</option>
                  <option value="DEVICE_CAMERA">Hanya Kamera HP / Tablet (getUserMedia)</option>
                  <option value="CCTV_IP">Hanya CCTV IP (RTSP / HTTP Snapshot)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  URL Snapshot CCTV IP
                </label>
                <input
                  type="text"
                  value={hwSettings.cctvSnapshotUrl}
                  onChange={(e) => setHwSettings({ ...hwSettings, cctvSnapshotUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl"
                  placeholder="http://192.168.1.180/snapshot.cgi"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">User CCTV</label>
                  <input
                    type="text"
                    value={hwSettings.cctvAuthUser}
                    onChange={(e) => setHwSettings({ ...hwSettings, cctvAuthUser: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Password CCTV</label>
                  <input
                    type="password"
                    value={hwSettings.cctvAuthPass}
                    onChange={(e) => setHwSettings({ ...hwSettings, cctvAuthPass: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestCctv}
                  disabled={testingCctv}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{testingCctv ? "Mengambil..." : "Uji Ambil Snapshot CCTV"}</span>
                </button>
                {cctvTestResult && (
                  <div className="mt-2 text-[10px] bg-blue-50 text-blue-900 p-2 rounded-lg font-medium">
                    <p>{cctvTestResult.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SUB-PANEL 3: PRINTER STRUK MINI BLUETOOTH */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Printer Struk Bluetooth</h3>
                  <p className="text-[10px] text-slate-500">Thermal 58mm / 80mm ESC/POS</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Metode Koneksi Driver
                </label>
                <select
                  value={hwSettings.printerDriverMode}
                  onChange={(e) => setHwSettings({ ...hwSettings, printerDriverMode: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium"
                >
                  <option value="WEB_BLUETOOTH">Opsi A: Web Bluetooth API (Direct Chrome)</option>
                  <option value="RAWBT_INTENT">Opsi B: Android RawBT Intent Helper</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ukuran Lebar Kertas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHwSettings({ ...hwSettings, paperSize: "58mm" })}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      hwSettings.paperSize === "58mm" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    58mm (Standar Mini)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHwSettings({ ...hwSettings, paperSize: "80mm" })}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      hwSettings.paperSize === "80mm" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    80mm (Lebar)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Perangkat Bluetooth
                </label>
                <input
                  type="text"
                  value={hwSettings.bluetoothPrinterName}
                  onChange={(e) => setHwSettings({ ...hwSettings, bluetoothPrinterName: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl"
                  placeholder="RPP02N / MPT-II / Thermal-POS"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsBluetoothModalOpen(true)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>Buka Dialog Sambungkan Bluetooth</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestPrinter}
                  disabled={testingPrinter}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{testingPrinter ? "Mencetak..." : "Uji Cetak Struk Bluetooth"}</span>
                </button>
                {printerTestResult && (
                  <p className="text-[10px] text-purple-900 bg-purple-50 p-2 rounded-lg mt-2 font-medium">
                    {printerTestResult}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SUB-PANEL 4: CLOUDINARY MEDIA CLOUD STORAGE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Cloudinary Media Cloud Storage</h3>
                  <p className="text-[10px] text-slate-500">Penyimpanan Media Foto Audit CCTV, Struk & Foto Produk</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Tersinkronisasi
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-500">Cloud Name:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-xs">
                    {cloudinaryStatus?.cloudName || "eiwfpdb2"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-500">API Key:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-xs">
                    {cloudinaryStatus?.apiKey || "296696875898832"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[11px] font-bold text-slate-500">Status Server:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Tersinkronisasi & Siap Digunakan
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    API Secret (Opsional untuk Direct Signed Upload)
                  </label>
                  <input
                    type="password"
                    value={cloudinaryApiSecret}
                    onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                    placeholder={cloudinaryStatus?.hasSecret ? "•••••••••••••••••••••••••••••• (Tersimpan)" : "Masukkan API Secret (jika ada)..."}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {cloudinaryStatus?.hasSecret
                      ? "API Secret aktif terpasang untuk signed direct upload ke Cloudinary."
                      : "Jika API Secret belum diisi, foto tetap aman tersimpan via fallback local/base64 tanpa hambatan."}
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    disabled={savingCloudinary}
                    onClick={async () => {
                      setSavingCloudinary(true)
                      setCloudinaryFeedback(null)
                      try {
                        const res = await fetch("/api/cloudinary/config", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            apiSecret: cloudinaryApiSecret || undefined,
                            uploadPreset: cloudinaryUploadPreset || undefined,
                          }),
                        })
                        const data = await res.json()
                        if (data.success) {
                          setCloudinaryStatus(data)
                          setCloudinaryFeedback("Konfigurasi Cloudinary berhasil disimpan!")
                        } else {
                          setCloudinaryFeedback("Gagal menyimpan konfigurasi.")
                        }
                      } catch (err: any) {
                        setCloudinaryFeedback("Error: " + err.message)
                      } finally {
                        setSavingCloudinary(false)
                        setTimeout(() => setCloudinaryFeedback(null), 3000)
                      }
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    {savingCloudinary ? "Menyimpan..." : "Simpan Kunci Cloudinary"}
                  </button>
                  {cloudinaryFeedback && (
                    <span className="text-[11px] font-bold text-emerald-600">
                      {cloudinaryFeedback}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{saving ? "Menyimpan Hardware..." : "Simpan Seluruh Pengaturan Hardware"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TARGET 30 HARI & SISTEM REWARD (Hanya Diatur oleh Owner & Sinkron ke Seluruh Cabang) */}
      {isAllBranches && activeTab === "TARGET_REWARD" && (
        <form onSubmit={handleSaveHardwareSettings} className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Target Penjualan 30 Hari & Sistem Reward Karyawan
                </h2>
                <p className="text-xs text-slate-500">
                  Konfigurasikan target omzet rata-rata harian yang akan memicu reward otomatis bagi tim outlet
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Target Rata-Rata Omzet Per Hari (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={hwSettings.targetDailyOmzet}
                    onChange={(e) => setHwSettings({ ...hwSettings, targetDailyOmzet: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm font-black border border-slate-200 rounded-xl text-emerald-700"
                    placeholder="2500000"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Proyeksi 30 Hari: <span className="font-bold text-slate-700">{formatRupiah((hwSettings.targetDailyOmzet || 0) * 30)}</span> per bulan
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nominal Bonus Pool Reward (Rp)
                  </label>
                  <input
                    type="number"
                    value={hwSettings.rewardBonusPool}
                    onChange={(e) => setHwSettings({ ...hwSettings, rewardBonusPool: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm font-black border border-slate-200 rounded-xl text-yellow-700"
                    placeholder="2000000"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bonus yang akan dicairkan kepada tim/kasir saat target rata-rata 30 hari tercapai.
                  </p>
                </div>
              </div>

              {/* Informational Card Preview */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50/50 border border-yellow-200 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-yellow-200/60 text-yellow-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
                    <Trophy className="w-3 h-3 text-yellow-700" />
                    <span>Logika Algoritma Reward Otomatis</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 mb-2">
                    Evaluasi Performa Setiap 30 Hari
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed space-y-1">
                    Sistem akan menghitung total omzet riil selama 30 hari terakhir dibagi 30 hari. Jika angka rata-rata harian <strong>≥ {formatRupiah(hwSettings.targetDailyOmzet || 0)}</strong>, dashboard eksekutif akan mengaktifkan badge <strong>TARGET TERCAPAI</strong> serta alokasi bonus reward karyawan sebesar <strong>{formatRupiah(hwSettings.rewardBonusPool || 0)}</strong>.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-yellow-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-yellow-800">Status Sistem Reward:</span>
                  <span className="font-extrabold bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px]">
                    AKTIF & TERINTEGRASI
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Menyimpan..." : "Simpan Target & Reward"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      <BluetoothPrinterModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        storeName={storeName || "BOSNITRO NITROGEN"}
        paperSize={hwSettings.paperSize || "58mm"}
        onPaperSizeChange={(sz) => setHwSettings({ ...hwSettings, paperSize: sz })}
      />
    </div>
  )
}
