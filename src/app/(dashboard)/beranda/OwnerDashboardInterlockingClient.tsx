"use client"

import { useState, useMemo, useEffect } from "react"
import { useBranch } from "@/context/BranchContext"
import { InterlockingTransaction, FraudAlert, Analytics30Days, Branch } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import BranchSelector from "@/components/branch/BranchSelector"
import AddBranchModal from "@/components/branch/AddBranchModal"
import EditBranchModal from "@/components/branch/EditBranchModal"
import Link from "next/link"
import { getLocalTransactions, syncTransactions, subscribeTransactions } from "@/lib/transactionStore"
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  AlertCircle,
  Camera,
  Lock,
  Send,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  X,
  Copy,
  MessageCircle,
  Trophy,
  Award,
  Sparkles,
  Building2,
  Radio,
  Clock,
  Check,
  ChevronRight,
  Flame,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

export default function OwnerDashboardInterlockingClient({
  initialTransactions,
  initialAlerts,
  initialTelegramPhone,
}: {
  initialTransactions: InterlockingTransaction[]
  initialAlerts: FraudAlert[]
  initialTelegramPhone?: string
}) {
  const { branches, selectedBranch, selectedBranchId, isAllBranches, deleteBranchState, refreshBranches } = useBranch()
  const [transactions, setTransactions] = useState<InterlockingTransaction[]>(() => {
    if (typeof window !== "undefined") {
      const local = getLocalTransactions()
      if (local.length > 0) {
        const map = new Map<string, InterlockingTransaction>()
        for (const t of initialTransactions) {
          if (t && t.id) map.set(t.id, t)
        }
        for (const t of local) {
          if (t && t.id) map.set(t.id, t)
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
    }
    return initialTransactions
  })
  const [alerts] = useState<FraudAlert[]>(initialAlerts)
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null)

  // Branch Management Modal States
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

  // 30-Day Analytics & Reward State
  const [analytics30Days, setAnalytics30Days] = useState<Analytics30Days | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  // Dynamic Telegram info
  const [telegramPhone, setTelegramPhone] = useState(initialTelegramPhone || "083153598697")
  const [telegramChatId, setTelegramChatId] = useState<string | null>("-5332437584")
  const [telegramBotToken, setTelegramBotToken] = useState<string | null>(null)
  const [telegramSentAutomatic, setTelegramSentAutomatic] = useState(false)

  const refreshDashboardTransactions = async () => {
    const branchParam = isAllBranches ? "ALL" : selectedBranchId
    const synced = await syncTransactions(branchParam)
    if (synced && synced.length > 0) {
      setTransactions(synced)
    }
  }

  useEffect(() => {
    refreshDashboardTransactions()

    fetch("/api/settings/store")
      .then((res) => res.json())
      .then((data) => {
        if (data.telegramPhone) setTelegramPhone(data.telegramPhone)
        if (data.telegramChatId) setTelegramChatId(data.telegramChatId)
        if (data.telegramBotToken) setTelegramBotToken(data.telegramBotToken)
        try {
          const userKey = data.userId || data.userEmail || "default"
          localStorage.setItem(`ubos_store_settings_${userKey}`, JSON.stringify({
            storeName: data.storeName,
            telegramPhone: data.telegramPhone,
            telegramChatId: data.telegramChatId,
            telegramBotToken: data.telegramBotToken,
          }))
        } catch (e) {}
      })
      .catch(() => {})

    // Load 30-day analytics & reward status
    fetch(`/api/analytics/30-days?branchId=${isAllBranches ? "ALL" : selectedBranchId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setAnalytics30Days(data.data)
        setLoadingAnalytics(false)
      })
      .catch(() => setLoadingAnalytics(false))

    // Real-time listener for POS transaction completions
    const unsubscribe = subscribeTransactions(() => {
      refreshDashboardTransactions()
      fetch(`/api/analytics/30-days?branchId=${isAllBranches ? "ALL" : selectedBranchId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setAnalytics30Days(data.data)
        })
        .catch(() => {})
    })

    return () => unsubscribe()
  }, [selectedBranchId, isAllBranches])

  // Telegram report state
  const [sendingTelegram, setSendingTelegram] = useState(false)
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null)
  const [telegramCleanText, setTelegramCleanText] = useState<string | null>(null)
  const [telegramShareUrl, setTelegramShareUrl] = useState<string | null>(null)
  const [telegramWhatsappUrl, setTelegramWhatsappUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSendTelegramReport = async () => {
    setSendingTelegram(true)
    setTelegramStatus(null)
    setTelegramCleanText(null)
    setTelegramShareUrl(null)
    setTelegramWhatsappUrl(null)
    setTelegramSentAutomatic(false)

    // Ensure we use the freshest values
    let effectivePhone = telegramPhone
    let effectiveChatId = telegramChatId
    let effectiveBotToken = telegramBotToken
    try {
      const saved = localStorage.getItem("ubos_store_settings")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (!effectivePhone && parsed.telegramPhone) effectivePhone = parsed.telegramPhone
        if (!effectiveChatId && parsed.telegramChatId) effectiveChatId = parsed.telegramChatId
        if (!effectiveBotToken && parsed.telegramBotToken) effectiveBotToken = parsed.telegramBotToken
      }
    } catch (e) {}

    try {
      const res = await fetch("/api/telegram/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranchId,
          recipient: effectivePhone || "083153598697",
          chatId: effectiveChatId || undefined,
          botToken: effectiveBotToken || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok && data.error) throw new Error(data.error || "Gagal memproses pengiriman")
      setTelegramStatus(data.message || `Laporan transaksi harian diproses.`)
      setTelegramSentAutomatic(Boolean(data.sentAutomatic))
      if (data.cleanText) setTelegramCleanText(data.cleanText)
      if (data.shareUrl) setTelegramShareUrl(data.shareUrl)
      if (data.whatsappUrl) setTelegramWhatsappUrl(data.whatsappUrl)
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSendingTelegram(false)
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
    if (!confirm(`Hapus cabang "${branchName}"? Data transaksi dan perangkat cabang ini akan dinonaktifkan.`)) {
      return
    }
    try {
      const res = await fetch(`/api/branches?id=${encodeURIComponent(branchId)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal menghapus cabang")
      }
      deleteBranchState(branchId)
      await refreshBranches()
    } catch (e: any) {
      alert("Error: " + e.message)
    }
  }

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
  const branchLabel = isAllBranches ? `Seluruh ${branches.length} Cabang` : selectedBranch.name

  // Multi-branch stats (Image 2: Cards for 4 branches)
  const branchCardsData = useMemo(() => {
    return branches.map((b) => {
      const bTrx = transactions.filter((t) => t.branchId === b.id)
      const bRev = bTrx.reduce((acc, t) => acc + t.totalAmount, 0)
      let bNitrogen = 0
      let bOli = 0
      bTrx.forEach((t) => {
        t.items.forEach((it) => {
          if (it.category === "NITROGEN") bNitrogen += it.quantity
          else bOli += it.quantity
        })
      })

      return {
        branch: b,
        revenue: bRev,
        nitrogenCount: bNitrogen,
        oliCount: bOli,
        txCount: bTrx.length,
      }
    })
  }, [branches, transactions])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {isAllBranches ? "Dashboard Eksekutif Anti-Loss (Semua Cabang)" : `Dashboard Operasional - ${selectedBranch.name}`}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {isAllBranches
              ? "Monitoring live feed 4 cabang, evaluasi target 30 hari & sistem reward, interlocking IoT & audit visual"
              : `Ringkasan analisis penjualan 30 hari dan omzet harian ${selectedBranch.name} (${selectedBranch.location})`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {isAllBranches && (
            <button
              type="button"
              onClick={handleSendTelegramReport}
              disabled={sendingTelegram}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {sendingTelegram
                  ? "Mengirim Laporan..."
                  : `Kirim Laporan Telegram (${telegramChatId ? `Grup ${telegramChatId}` : telegramPhone})`}
              </span>
            </button>
          )}
          <div className="w-full sm:w-64">
            <BranchSelector allowAll={true} />
          </div>
        </div>
      </div>

      {/* Telegram Report Status Banner */}
      {telegramStatus && (
        <div
          className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 border ${
            telegramSentAutomatic
              ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs"
              : "bg-sky-50 border-sky-200 text-sky-950"
          }`}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                telegramSentAutomatic ? "text-emerald-600" : "text-sky-600"
              }`}
            />
            <div>
              <h4 className="text-xs font-extrabold">
                {telegramSentAutomatic ? "✓ Laporan Otomatis Terkirim ke Telegram!" : "Laporan Transaksi Harian"}
              </h4>
              <p
                className={`text-xs mt-0.5 ${
                  telegramSentAutomatic ? "text-emerald-800 font-medium" : "text-sky-800"
                }`}
              >
                {telegramStatus}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {telegramCleanText && (
              <button
                type="button"
                onClick={() => handleCopyReport(telegramCleanText)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? "✓ Tersalin!" : "Salin Teks"}</span>
              </button>
            )}
            {telegramShareUrl && (
              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                <span>Buka di Telegram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {telegramWhatsappUrl && (
              <a
                href={telegramWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Kirim via WA</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* REQUIREMENT #4: ANALISIS PENJUALAN 30 HARI & SISTEM REWARD WIDGET */}
      {analytics30Days && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700 space-y-6 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">
                    Analisis Penjualan 30 Hari & Evaluasi Reward
                  </h2>
                  <span className="bg-yellow-400/20 text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-yellow-400/30">
                    Sistem Reward Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Target harian ditetapkan Owner: <strong className="text-white">{formatRupiah(analytics30Days.targetDailyOmzet || 0)}</strong> / hari
                </p>
              </div>
            </div>

            {/* Reward Status Celebration Badge */}
            {analytics30Days.isRewardUnlocked ? (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-500/25 animate-bounce">
                <Award className="w-5 h-5 text-yellow-200" />
                <div>
                  <div className="leading-tight">TARGET TERCAPAI!</div>
                  <div className="text-[10px] font-semibold text-emerald-100">
                    Bonus Reward: {formatRupiah(analytics30Days.rewardBonusPool || 0)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 text-slate-300 px-4 py-2 rounded-2xl text-xs font-bold border border-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Mengejar Target ({analytics30Days.achievementPercentage}%)</span>
              </div>
            )}
          </div>

          {/* 30-Day Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Omzet (30 Hari)</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums mt-1">
                {formatRupiah(analytics30Days.totalOmzet30Days || 0)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {analytics30Days.totalTransactions30Days} Total Transaksi
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-Rata Omzet / Hari</span>
              <p className="text-xl sm:text-2xl font-black text-yellow-300 tabular-nums mt-1">
                {formatRupiah(analytics30Days.actualDailyAverage)}
              </p>
              <p className="text-[10px] text-emerald-300 mt-1 font-bold">
                {analytics30Days.actualDailyAverage >= (analytics30Days.targetDailyOmzet || 0) ? "▲ Melebihi Target" : "▼ Di Bawah Target"}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Target Harian Owner</span>
              <p className="text-xl sm:text-2xl font-black text-slate-200 tabular-nums mt-1">
                {formatRupiah(analytics30Days.targetDailyOmzet || 0)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Pencapaian: <strong className="text-yellow-300">{analytics30Days.achievementPercentage}%</strong>
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Hari Target Tercapai</span>
              <p className="text-xl sm:text-2xl font-black text-cyan-300 tabular-nums mt-1">
                {analytics30Days.daysTargetAchieved || 0} / 30 Hari
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Konsistensi: {Math.round(((analytics30Days.daysTargetAchieved || 0) / 30) * 100)}%
              </p>
            </div>
          </div>

          {/* Progress Bar towards target */}
          <div className="space-y-1.5 relative z-10">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">Kemajuan Rata-Rata Penjualan vs Target</span>
              <span className="text-yellow-300">{analytics30Days.achievementPercentage}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-yellow-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, analytics30Days.achievementPercentage)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* KELOLA CABANG OUTLET (Dashboard Owner: Edit nama cabang, lokasi/alamat, hapus, dan tambah cabang baru) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Kelola Cabang Outlet ({branches.length} Outlet Aktif)
              </h2>
              <p className="text-xs text-slate-500">
                Kelola nama cabang, alamat gerai, status perangkat IoT, atau tambah cabang baru
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddBranchOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Cabang Baru</span>
          </button>
        </div>

        {/* Info Banner when only 1 branch exists (Fresh registration state) */}
        {branches.length === 1 && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Cabang Pertama Siap Diatur</h4>
                <p className="text-xs text-emerald-850 mt-0.5">
                  Anda memiliki 1 cabang awal. Silakan klik tombol <b>Edit Cabang</b> untuk menyesuaikan nama cabang dan alamat gerai fisik Anda agar tercetak rapi di struk kasir.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditingBranch(branches[0])}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Nama & Alamat Cabang</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {branchCardsData.map((bItem, idx) => (
            <div
              key={bItem.branch.id}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 hover:bg-white transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <h3 className="text-sm font-extrabold text-slate-900 truncate">
                      {bItem.branch.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                    Online
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-start gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="truncate">{bItem.branch.location || "Alamat belum diatur"}</span>
                </div>

                <div className="space-y-2 mb-4 bg-white p-3 rounded-xl border border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Omzet Riil</span>
                    <p className="text-lg font-black text-slate-900 tabular-nums">
                      {formatRupiah(bItem.revenue)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px]">Trx Nitrogen</span>
                      <p className="font-bold text-emerald-700">{bItem.nitrogenCount} ban</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Unit Oli</span>
                      <p className="font-bold text-blue-700">{bItem.oliCount} botol</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-slate-400" />
                    {bItem.branch.deviceId || `ESP32-${idx + 1}`}
                  </span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px]">
                    Valve Ready
                  </span>
                </div>

                {/* Branch Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingBranch(bItem.branch)}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Edit nama dan lokasi cabang ini"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Cabang</span>
                  </button>

                  {branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBranch(bItem.branch.id, bItem.branch.name)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Hapus cabang ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
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

        {/* Card 2: Laba Kotor */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Laba Kotor (Gross Profit)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {formatRupiah(totalGrossProfit)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Margin: {totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Card 3: Transaksi Valid */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Transaksi Terverifikasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
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
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <p className="text-lg font-black text-emerald-800">
                {isAllBranches ? `${branches.length} / ${branches.length} Online` : "Online (Normal)"}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Solenoid Valve & Flow Sensor Aktif
            </p>
          </div>
        </div>
      </div>

      {/* FRAUD CONTROL & ANOMALY ALERTS WIDGET (Image 2: Telegram Fraud Alert Log - Khusus Semua Cabang) */}
      {isAllBranches && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Log Peringatan Fraud Telegram (Real-Time Sensor Anomaly)
                </h2>
                <p className="text-xs text-slate-500">
                  Pemberitahuan otomatis ke bot Telegram owner saat terdeteksi anomali hardware atau selisih kasir
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-black px-3 py-1 rounded-full ${
                filteredAlerts.length > 0 ? "bg-red-100 text-red-800 animate-pulse" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {filteredAlerts.length > 0 ? `${filteredAlerts.length} Anomali Terdeteksi` : "Aman / Normal"}
            </span>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ada anomali sensor pada cabang ini. Sistem pengisian berjalan tertib.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
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
      )}

      {/* VISUAL AUDIT GALLERY (Image 2: Live Fraud & Audit Stream - Khusus Semua Cabang) */}
      {isAllBranches && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Live Audit & Foto Bukti Transaksi
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap struk diverifikasi dengan foto plat nomor kendaraan & foto botol oli bekas yang diganti
              </p>
            </div>

            <Link
              href="/shift-closing"
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lihat Audit Shift Closing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada transaksi dengan bukti foto audit di cabang ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTransactions.slice(0, 9).map((tx) => (
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
                              title: `Foto Plat Kendaraan (${tx.customerPlate || tx.id})`,
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
                            Plat: {tx.customerPlate || "Tercatat"}
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
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Valid Interlocked</span>
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
      )}

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

      {/* MODAL TAMBAH CABANG OUTLET (Dashboard Owner) */}
      <AddBranchModal
        isOpen={isAddBranchOpen}
        onClose={() => setIsAddBranchOpen(false)}
        onSuccess={() => refreshBranches()}
      />

      {/* MODAL EDIT NAMA & LOKASI CABANG (Dashboard Owner) */}
      <EditBranchModal
        branch={editingBranch}
        isOpen={!!editingBranch}
        onClose={() => setEditingBranch(null)}
        onSuccess={() => refreshBranches()}
      />
    </div>
  )
}
