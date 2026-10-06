import { formatRupiah } from '@/lib/format';
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  calculateOmzet, calculateTransactionCount, calculateAOV,
  calculateTotalHPP, calculateExpenses, calculateGrossProfit,
  calculateNetProfit, calculateMargin
} from "@/lib/engines/calculationEngine"

export const dynamic = "force-dynamic"

export default async function LaporanPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role === "KASIR") redirect("/kasir")

  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) redirect("/")

  const period = (await searchParams).period || 'today'

  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)

  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)

  let label = "Hari Ini"
  if (period === '7days') {
    startDate.setDate(startDate.getDate() - 6)
    label = "7 Hari Terakhir"
  } else if (period === 'month') {
    startDate.setDate(1)
    label = "Bulan Ini"
  }

  const omzet = await calculateOmzet(business.id, startDate, endDate)
  const txCount = await calculateTransactionCount(business.id, startDate, endDate)
  const aov = calculateAOV(omzet, txCount)
  const hpp = await calculateTotalHPP(business.id, startDate, endDate)
  const expenses = await calculateExpenses(business.id, startDate, endDate)
  const incomeLain = 0
  const grossProfit = calculateGrossProfit(omzet + incomeLain, hpp)
  const margin = calculateMargin(grossProfit, omzet + incomeLain)
  const netProfit = calculateNetProfit(grossProfit, expenses)

  const filterLinks = [
    { href: '/laporan?period=today', label: 'Hari Ini', value: 'today' },
    { href: '/laporan?period=7days', label: '7 Hari', value: '7days' },
    { href: '/laporan?period=month', label: 'Bulan Ini', value: 'month' },
  ]

  return (
        <div className="min-h-screen bg-slate-50 pb-16">

      {/* ===== DESKTOP HEADER ===== */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-4 lg:px-8 py-4 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1">
              &larr; Kembali ke Beranda
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Laporan Keuangan</h1>
          </div>
          {/* Filter Tabs Desktop */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-sm">
            {filterLinks.map(f => (
              <Link key={f.value} href={f.href}
                className={`px-4 py-1.5 rounded-lg font-semibold transition-colors ${period === f.value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MOBILE HEADER ===== */}
      <div className="md:hidden bg-blue-700 text-white p-4 pb-8 shrink-0 rounded-b-3xl">
        <Link href="/" className="text-white text-sm font-semibold mb-3 inline-block">&larr; Beranda</Link>
        <h1 className="text-xl font-bold">Laporan Keuangan</h1>
        {/* Filter Tabs Mobile */}
        <div className="flex gap-2 mt-4 bg-blue-800/50 p-1 rounded-xl text-sm w-fit">
          {filterLinks.map(f => (
            <Link key={f.value} href={f.href}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-colors ${period === f.value ? 'bg-white text-blue-700' : 'text-blue-100 hover:text-white'}`}>
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ===== CONTENT CONTAINER ===== */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-4 md:mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ===== KOLOM KIRI — KPI Ringkasan ===== */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wide">Ringkasan {label}</h2>

              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-1">Omzet</p>
                <p className="text-3xl font-bold text-slate-900">{formatRupiah(omzet)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Transaksi</p>
                  <p className="text-lg font-bold text-slate-800">{txCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Rata-rata (AOV)</p>
                  <p className="text-lg font-bold text-slate-800">{formatRupiah(aov)}</p>
                </div>
              </div>
            </div>

            {/* Net Profit highlight card */}
            <div className={`p-5 rounded-xl shadow-sm border ${netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Untung Bersih</p>
              <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatRupiah(netProfit)}</p>
              <p className="text-xs text-slate-400 mt-2">Setelah HPP & operasional</p>
            </div>
          </div>

          {/* ===== KOLOM KANAN — Rincian P&L ===== */}
          <div className="lg:col-span-8 space-y-4">

            {/* Card Omzet & AOV */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wide">Pendapatan</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-600">Penjualan POS</p>
                  <p className="text-xs text-slate-400 mt-0.5">{txCount} transaksi &bull; AOV {formatRupiah(aov)}</p>
                </div>
                <p className="text-lg font-bold text-slate-900">{formatRupiah(omzet)}</p>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                <p className="text-sm text-slate-400">Uang Masuk Lain</p>
                <p className="text-sm font-bold text-slate-400">Rp 0</p>
              </div>
            </div>

            {/* Card HPP & Laba Kotor */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wide">Modal & Laba Kotor</h3>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-slate-600">Total Modal / HPP</p>
                <p className="text-sm font-bold text-orange-600">- {formatRupiah(hpp)}</p>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-800">Untung Kotor</p>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">{formatRupiah(grossProfit)}</p>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">Margin {margin}%</span>
                </div>
              </div>
            </div>

            {/* Card Pengeluaran & Laba Bersih */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wide">Pengeluaran Operasional</h3>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-slate-600">Total Pengeluaran</p>
                  <Link href="/pengeluaran" className="text-xs text-blue-600 hover:underline mt-0.5 inline-block">Lihat detail &rarr;</Link>
                </div>
                <p className="text-sm font-bold text-red-600">- {formatRupiah(expenses)}</p>
              </div>
              <div className={`p-4 rounded-xl flex justify-between items-center ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm font-bold text-slate-800">Untung Bersih</p>
                <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatRupiah(netProfit)}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
      )
}
