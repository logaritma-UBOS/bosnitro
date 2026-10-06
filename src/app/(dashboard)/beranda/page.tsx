import { formatNumber, formatRupiah } from '@/lib/format';
export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { runLogaritmaEngine } from "@/lib/engines/logaritmaEngine"
import { Card, CardContent } from "@/components/ui/Card"
import { IconHome, IconCatalog, IconHistory, IconInsights, IconWarning, IconCash, IconTrendingUp } from "@/components/ui/Icons"
import { trackEvent } from "@/actions/analytics"
import ProfileMenu from "@/components/ProfileMenu"
import NotificationBell from "@/components/NotificationBell"
import LandingPage from "@/components/LandingPage"
import UbosFeed from "@/components/dashboard/UbosFeed"
import VipBannerWrapper from "@/components/dashboard/VipBannerWrapper"
import InstallAppButton from "@/components/InstallAppButton"
import { calculateTierFromRevenues, syncUserMayarPayment } from "@/lib/mayarSync"

// Maps recommendation type  contextual CTA label + destination
function getContextualCTA(type: string | undefined): { label: string; href: string } {
  switch (type) {
    case "AOV":       return { label: "Buka Kasir & Up-Sell", href: "/kasir" }
    case "TRANSACTION": return { label: "Buat Promo Sekarang", href: "/promo" }
    case "STOCK":     return { label: "Cek & Tambah Stok", href: "/katalog" }
    case "MARGIN":    return { label: "Periksa HPP Produk", href: "/katalog" }
    case "DATA":      return { label: "Catat Transaksi", href: "/kasir" }
    case "SUCCESS":   return { label: "Lihat Performa", href: "/wawasan-bisnis" }
    default:          return { label: "Buka Kasir", href: "/kasir" }
  }
}

// Progress psychology text based on progress %
function getProgressMessage(pct: number, masihKurang: number): string {
  if (pct === 0)   return "Belum ada transaksi. Fokus dapatkan penjualan pertama."
  if (pct < 35)    return `Sudah mulai. Tinggal ${formatRupiah(masihKurang)} lagi menuju target.`
  if (pct < 60)    return `Berjalan baik. Sudah separuh jalan, tinggal ${formatRupiah(masihKurang)}.`
  if (pct < 80)    return `Hampir sampai! Tinggal ${formatRupiah(masihKurang)} lagi.`
  if (pct < 100)   return `Sangat dekat! Kurang ${formatRupiah(masihKurang)} untuk mencapai target.`
  return " Target hari ini tercapai. Pertahankan!"
}

export default async function Home() {
  const session = await auth()
  
  if (session?.user?.role === 'KASIR' || session?.user?.role === 'MANAGER') {
    redirect("/kasir")
  }
  
  const whereClause = (session?.user as any)?.staffBusinessId ? { id: (session?.user as any).staffBusinessId } : { userId: (session?.user?.id || "") as string };
  const business = await prisma.business.findFirst({
    where: whereClause,
    include: { goals: true, user: true }
  })

  if (!business) redirect("/onboarding")

  trackEvent(business.id, "dashboard_viewed").catch(() => {})

  const revenues = await prisma.ubosRevenue.findMany({
    where: { userId: business.userId, status: "PAID" },
    orderBy: { createdAt: "desc" }
  });

  let tierStatus = calculateTierFromRevenues(business.user?.email, revenues);

  if (tierStatus.tier === "Starter" && business.user?.email) {
    const syncRes = await syncUserMayarPayment(business.user.email, business.userId);
    if (syncRes?.tierStatus && syncRes.tierStatus.tier !== "Starter") {
      tierStatus = syncRes.tierStatus;
    }
  }

  const tier = tierStatus.tier;

  const {
    targetHarian,
    sudahMasuk,
    masihKurang,
    butuhTransaksiSisa,
    aovAktual,
    rekomendasiUtama,
    confidence,
    lowStockItems,
    netProfit,
    expenses: engineExpenses,
    grossProfit,
    marginDrop,
    highExpense
  } = await runLogaritmaEngine(business.id)

  const progressPct = targetHarian > 0 ? Math.min(100, Math.round((sudahMasuk / targetHarian) * 100)) : 0

  const hourStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta", hour: "numeric", hour12: false });
  const currentHour = parseInt(hourStr, 10);
  let greeting = "Selamat Malam";
  if (currentHour >= 5 && currentHour < 11) greeting = "Selamat Pagi";
  else if (currentHour >= 11 && currentHour < 15) greeting = "Selamat Siang";
  else if (currentHour >= 15 && currentHour < 18) greeting = "Selamat Sore";

  const cta = getContextualCTA(rekomendasiUtama?.type)
  const progressMsg = getProgressMessage(progressPct, masihKurang)

  // Confidence UI config
  const confidenceConfig = {
    HIGH: {
      dot: "bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
      label: "Analisis Cukup Kuat",
      color: "text-success-700",
      explanation: "Data transaksi sudah cukup untuk diagnosis yang akurat.",
    },
    MEDIUM: {
      dot: "bg-warning-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
      label: "Analisis Sementara",
      color: "text-warning-700",
      explanation: "Rekomendasi berdasarkan pola awal. Makin banyak transaksi, makin akurat.",
    },
    LOW: {
      dot: "bg-gray-400",
      label: "Data Belum Cukup",
      color: "text-gray-500",
      explanation: "Catat lebih banyak transaksi agar UBOS bisa mendiagnosa bisnis Anda.",
    },
  }
  const conf = confidenceConfig[confidence as keyof typeof confidenceConfig] ?? confidenceConfig.LOW

  // Fetch Global Settings
  const notifSettingRow = null
  const bannerSettingRow = null
  const notifSetting = { text: "", active: "false" }
  const bannerSetting = { imageUrl: "", linkUrl: "", active: "false" }
  
  

  return (
        <div className="min-h-screen bg-gray-50 pb-32 overflow-x-hidden">
      <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-8 box-border">

        {/* HEADER */}
        <div className="flex justify-between items-start pt-2 mb-5 md:mb-8">
          <div>
            <div className="mb-2 flex items-center">
              <Image src="/logo-ubos.png" alt="UBOS Logo" width={100} height={32} className="h-8 w-auto object-contain lg:hidden" priority />
            </div>
            <h2 className="text-sm font-bold text-gray-700">{business.name}</h2>
            <p className="text-xs text-gray-400 font-medium">{greeting} </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <ProfileMenu userImage={business.user?.image} />
          </div>
        </div>

        <InstallAppButton />

        {tier === "Starter" && (
          <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-2xl p-4 mb-6 border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                <span className="text-xl">⭐</span>
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-sm">Paket Starter (Batas 15 Produk)</h3>
                <p className="text-amber-800 text-xs mt-1">Buka Kuota Unlimited Katalog & Rekomendasi AI Bisnis Harian seharga Rp49rb/bulan.</p>
              </div>
            </div>
            <Link href="/upgrade" className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg text-center transition-colors">
              Tingkatkan Sekarang
            </Link>
          </div>
        )}

        {(tier === "Pro Bulanan" || tier === "Pro Tahunan") && (
          <div className="bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                <span className="text-xl">💎</span>
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 text-sm">Paket {tierStatus.planName} Aktif</h3>
                <p className="text-emerald-800 text-xs mt-1">
                  {tierStatus.daysRemaining !== null 
                    ? `Sisa masa aktif: ${tierStatus.daysRemaining} hari lagi. Semua fitur premium terbuka tanpa batas.`
                    : "Semua fitur premium terbuka tanpa batas."}
                </p>
              </div>
            </div>
            <Link href="/upgrade" className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg text-center transition-colors">
              Perpanjang Paket
            </Link>
          </div>
        )}

        {tier === "Lifetime" && (
          <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-2xl p-4 mb-6 border border-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                <span className="text-xl">👑</span>
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-sm">Lifetime Founder Pass Aktif</h3>
                <p className="text-blue-800 text-xs mt-1">Akses eksklusif seumur hidup. Terima kasih atas dukungan Anda.</p>
              </div>
            </div>
          </div>
        )}

        <VipBannerWrapper />

        {/* GLOBAL NOTIFICATION */}
        {notifSetting.active === "true" && notifSetting.text && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3 shadow-sm">
            <div className="shrink-0 text-blue-500 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v9a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM12 16.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" /></svg>
            </div>
            <p className="text-sm text-blue-900 font-medium leading-relaxed">{notifSetting.text}</p>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="space-y-4 lg:space-y-6">

            {/*  SECTION 1: TARGET & HEALTH MONITOR  */}
            {/* MOBILE VIEW (< lg) */}
            <div className="lg:hidden bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">Kondisi Bisnis Hari Ini</p>
                <Link href="/pengaturan/target" className="text-[10px] font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-2.5 rounded-lg border border-primary-100 transition-colors min-h-[44px] inline-flex items-center">Ubah Target</Link>
              </div>

              {/* Target */}
              <div className="flex justify-between items-baseline pb-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400">Target Harian</p>
                <p className="text-sm font-bold text-gray-600">{formatRupiah(targetHarian)}</p>
              </div>

              {/* Actual (dominant) */}
              <div className="py-3 md:py-4">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.12em] mb-1">Tercapai</p>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight tabular-nums">{formatRupiah(sudahMasuk)}</h2>

                {/* Progress bar + psychology message */}
                <div className="mt-3 space-y-1.5">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${progressPct >= 100 ? "bg-success-500" : progressPct >= 60 ? "bg-primary-500" : progressPct >= 1 ? "bg-warning-500" : "bg-gray-200"}`}
                      style={{ width: `${Math.max(progressPct, 0)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{progressMsg}</p>
                </div>
              </div>

              {/* Gap */}
              {masihKurang > 0 && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <div className="flex-1 bg-red-50 rounded-xl p-3 border border-red-100">
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.12em] mb-1">Kekurangan</p>
                    <p className="text-base font-black text-red-600 tabular-nums">-{formatRupiah(masihKurang)}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.12em] mb-1">Butuh Transaksi</p>
                    <p className="text-base font-black text-gray-800">{butuhTransaksiSisa}x lagi</p>
                  </div>
                </div>
              )}
            </div>

            {/* DESKTOP VIEW (>= lg) */}
            <div className="hidden lg:grid grid-cols-3 gap-5">
              {/* TARGET */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">Target Harian</p>
                    <Link href="/pengaturan/target" className="text-gray-400 hover:text-primary-600 transition-colors" title="Ubah Target">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M2.695 14.763l-1.262 3.152a.5.5 0 00.65.65l3.152-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                      </svg>
                    </Link>
                  </div>
                  <p className="text-2xl font-black text-gray-900 tabular-nums">{formatRupiah(targetHarian)}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">Bulan ini: {formatRupiah(targetHarian * 30)}</p>
                </div>
              </div>

              {/* ACTUAL / TERCAPAI */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.12em] mb-2">Tercapai</p>
                  <p className="text-2xl font-black text-gray-900 tabular-nums">{formatRupiah(sudahMasuk)} <span className="text-sm font-bold text-gray-400">({progressPct}%)</span></p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${progressPct >= 100 ? "bg-success-500" : progressPct >= 60 ? "bg-primary-500" : progressPct >= 1 ? "bg-warning-500" : "bg-gray-200"}`}
                      style={{ width: `${Math.max(progressPct, 0)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed truncate">{progressMsg}</p>
                </div>
              </div>

              {/* GAP */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.12em] mb-2">Kekurangan (Gap)</p>
                  <p className={`text-2xl font-black tabular-nums ${masihKurang > 0 ? "text-red-600" : "text-success-600"}`}>
                    {masihKurang > 0 ? `-${formatRupiah(masihKurang)}` : " Tercapai"}
                  </p>
                </div>
                {masihKurang > 0 ? (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Butuh <span className="font-bold text-gray-800">{butuhTransaksiSisa}x</span> transaksi lagi</p>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Luar biasa! Target terlampaui.</p>
                  </div>
                )}
              </div>
            </div>

            {/*  CARD 2: PERINGATAN STOK  */}
            {lowStockItems && lowStockItems.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                <IconWarning className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-900 mb-1">Stok Menipis ({lowStockItems.length} item)</p>
                  <p className="text-xs text-amber-800 leading-relaxed mb-3 break-words">{lowStockItems.join(", ")}</p>
                  <Link href="/katalog" className="inline-block text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors">Cek Stok &rarr;</Link>
                </div>
              </div>
            )}

            {/*  CARD 3: PRIORITAS HARI INI (Diagnosis  Evidence  Action)  */}
            {tier === "Starter" ? (
              <div className="rounded-3xl p-6 relative overflow-hidden bg-gray-50 border border-gray-200 opacity-90">
                <div className="absolute top-0 right-0 p-5 opacity-10 pointer-events-none select-none">
                  <IconInsights className="w-28 h-28 text-gray-400" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.12em]">Prioritas Hari Ini</p>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-amber-100 border border-amber-200 shadow-sm shrink-0">
                      <span className="text-[9px] font-bold text-amber-800">Fitur Terkunci</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 leading-snug mb-3">
                    Insight Rekomendasi Harian
                  </h3>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 lg:p-5 border border-white shadow-sm mb-5">
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                      Upgrade ke paket Pro atau Lifetime untuk mendapatkan rekomendasi AI harian yang dianalisis otomatis dari pola transaksi dan inventaris bisnis Anda.
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <Link href="/upgrade" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm shadow-sm hover:bg-gray-800 transition-all active:scale-[0.98]">
                      Upgrade Sekarang
                    </Link>
                  </div>
                </div>
              </div>
            ) : rekomendasiUtama && (
              <div className={`rounded-3xl p-6 relative overflow-hidden ${
                rekomendasiUtama.type === "SUCCESS"
                  ? "bg-success-50 border border-success-200"
                  : "bg-blue-50 border border-blue-200"
              }`}>
                {/* Background accent */}
                <div className="absolute top-0 right-0 p-5 opacity-[0.06] pointer-events-none select-none">
                  <IconInsights className="w-28 h-28 text-blue-900" />
                </div>

                <div className="relative z-10">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{rekomendasiUtama.type === "SUCCESS" ? "" : ""}</span>
                      <p className="text-[10px] font-black text-blue-700 uppercase tracking-[0.12em]">Prioritas Hari Ini</p>
                    </div>
                    {/* Contextual confidence badge */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/70 border border-white/80 shadow-sm shrink-0`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${conf.dot}`}></span>
                      <span className={`text-[9px] font-bold ${conf.color}`}>{conf.label}</span>
                    </div>
                  </div>

                  {/* Action text  DOMINANT */}
                  <h3 className="text-xl font-black text-gray-900 leading-snug mb-5">
                    {rekomendasiUtama.actionText}
                  </h3>

                  {/* Evidence block  "Kenapa?" as supporting proof */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 lg:p-5 border border-white shadow-sm mb-5">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.12em] mb-2 lg:mb-3">Kenapa?</p>
                    <p className="text-sm lg:text-base font-medium text-gray-700 leading-relaxed mb-3 lg:mb-4">
                      {rekomendasiUtama.causeText}
                    </p>
                    {/* Data chain as evidence */}
                    <div className="grid grid-cols-3 gap-2 lg:gap-4 pt-3 lg:pt-4 border-t border-gray-100">
                      <div className="text-center lg:text-left">
                        <p className="text-[9px] text-gray-400 font-semibold uppercase lg:mb-1">Target</p>
                        <p className="text-xs lg:text-sm font-black text-gray-700 tabular-nums">{formatRupiah(targetHarian)}</p>
                      </div>
                      <div className="text-center lg:text-left">
                        <p className="text-[9px] text-gray-400 font-semibold uppercase lg:mb-1">Actual</p>
                        <p className="text-xs lg:text-sm font-black text-gray-700 tabular-nums">{formatRupiah(sudahMasuk)}</p>
                      </div>
                      <div className="text-center lg:text-left">
                        <p className="text-[9px] text-gray-400 font-semibold uppercase lg:mb-1">Gap</p>
                        <p className={`text-xs lg:text-sm font-black tabular-nums ${masihKurang > 0 ? "text-red-600" : "text-success-600"}`}>{masihKurang > 0 ? `-${formatRupiah(masihKurang)}` : " Tercapai"}</p>
                      </div>
                    </div>

                    {/* Keuangan Mini: Net Profit & Pengeluaran */}
                    {(engineExpenses > 0 || grossProfit > 0) && (
                      <div className={`flex items-center justify-between gap-4 mt-3 pt-3 border-t ${highExpense || marginDrop ? 'border-red-100 bg-red-50 -mx-2 px-2 rounded-lg py-2' : 'border-gray-100'}`}>
                        <div>
                          <p className="text-[9px] text-gray-400 font-semibold uppercase">Untung Bersih</p>
                          <p className={`text-xs font-black tabular-nums ${netProfit >= 0 ? 'text-success-700' : 'text-red-600'}`}>{formatRupiah(netProfit)}</p>
                        </div>
                        {engineExpenses > 0 && (
                          <div className="text-right">
                            <p className="text-[9px] text-gray-400 font-semibold uppercase">Pengeluaran</p>
                            <p className={`text-xs font-black tabular-nums ${highExpense ? 'text-red-600' : 'text-gray-600'}`}>- {formatRupiah(engineExpenses)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confidence explanation */}
                    <p className="text-[10px] text-gray-400 mt-3 pt-2 lg:mt-4 lg:pt-3 border-t border-gray-100 leading-relaxed">{conf.explanation}</p>
                  </div>

                  {/* Expected result + Contextual CTA */}
                  <div className="flex items-center justify-between gap-3">
                    {rekomendasiUtama.expectedResult && (
                      <p className="text-xs text-blue-700 font-bold flex items-center gap-1.5 min-w-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 text-blue-500">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate">{rekomendasiUtama.expectedResult}</span>
                      </p>
                    )}
                    <Link
                      href={cta.href}
                      className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all whitespace-nowrap"
                    >
                      {cta.label}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

        <div className="mt-6 mb-2">
          <UbosFeed position="bottom" />
        </div>

        {/* GLOBAL BANNER PROMO */}
        {bannerSetting.active === "true" && bannerSetting.imageUrl && (
          <div className="mt-8 mb-4 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative">
            {bannerSetting.linkUrl ? (
              <a href={bannerSetting.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative hover:opacity-95 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bannerSetting.imageUrl} alt="Promo Banner" className="w-full h-auto object-cover" style={{maxHeight: '400px'}} />
              </a>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={bannerSetting.imageUrl} alt="Promo Banner" className="w-full h-auto object-cover" style={{maxHeight: '400px'}} />
            )}
          </div>
        )}
      </div>


    </div>
      )
}
