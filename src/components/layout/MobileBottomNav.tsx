"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { logoutUser } from "@/actions/auth"
import { useBranch } from "@/context/BranchContext"
import {
  Home,
  Package,
  Lock,
  Receipt,
  Menu,
  Plus,
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  ReceiptText,
  MessageSquare,
  LogOut,
  X,
  Store,
  ShieldCheck,
} from "lucide-react"

export default function MobileBottomNav({ role = "OWNER" }: { role?: string }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const pathname = usePathname()
  const { isAllBranches } = useBranch()

  if (pathname === "/login" || pathname === "/register" || pathname === "/reset-sandi") {
    return null
  }

  const isActive = (path: string) => {
    if (path === "/" || path === "/beranda") return pathname === "/" || pathname === "/beranda"
    return pathname?.startsWith(path)
  }

  const navItemClass = (path: string) =>
    `flex flex-col items-center justify-center flex-1 h-full ${
      isActive(path) ? "text-emerald-600 font-bold" : "text-slate-400 hover:text-slate-700"
    }`

  // Base menu categories with scoping
  const baseKelolaLinks = [
    { label: "Tutup Shift", href: "/shift-closing", icon: Lock, scope: "BRANCH_ONLY" },
    { label: "Audit & Fraud", href: "/audit-fraud", icon: ShieldCheck, scope: "ALL_ONLY" },
    { label: "Pelanggan CRM", href: "/crm", icon: Users, scope: "BOTH" },
    { label: "Pengeluaran", href: "/pengeluaran", icon: DollarSign, scope: "BOTH" },
    { label: "Pegawai", href: "/pengaturan/pegawai", icon: Users, scope: "BRANCH_ONLY" },
    { label: "Pengaturan & IoT", href: "/pengaturan/toko", icon: Store, scope: "BRANCH_ONLY" },
  ]

  const baseBisnisLinks = [
    { label: "Performa Produk", href: "/performa-produk", icon: TrendingUp, scope: "ALL_ONLY" },
    { label: "Rata-rata Belanja", href: "/performa-aov", icon: BarChart3, scope: "ALL_ONLY" },
    { label: "Laporan Keuangan", href: "/laporan", icon: ReceiptText, scope: "ALL_ONLY" },
  ]

  // Filter based on branch mode (ALL vs BRANCH)
  const filteredKelola = baseKelolaLinks.filter((l) =>
    isAllBranches ? l.scope !== "BRANCH_ONLY" : l.scope !== "ALL_ONLY"
  )
  const filteredBisnis = baseBisnisLinks.filter((l) =>
    isAllBranches ? l.scope !== "BRANCH_ONLY" : l.scope !== "ALL_ONLY"
  )

  let menuCategories = [
    { title: "KELOLA", links: filteredKelola },
    { title: "PAHAMI BISNIS", links: filteredBisnis },
  ].filter((c) => c.links.length > 0)

  // Strict RBAC synchronization for drawer links
  if (role === "KASIR") {
    const allowedKasir = ["/shift-closing"]
    menuCategories = menuCategories
      .map((cat) => ({
        ...cat,
        links: cat.links.filter((l) => allowedKasir.includes(l.href)),
      }))
      .filter((cat) => cat.links.length > 0)
  } else if (role === "MANAGER") {
    const restrictedManager = [
      "/laporan",
      "/pengeluaran",
      "/performa-produk",
      "/performa-aov",
      "/pengaturan/target",
      "/pengaturan/whatsapp",
      "/pengaturan/pegawai",
      "/pengaturan/toko",
    ]
    menuCategories = menuCategories
      .map((cat) => ({
        ...cat,
        links: cat.links.filter((l) => !restrictedManager.includes(l.href)),
      }))
      .filter((cat) => cat.links.length > 0)
  }

  return (
    <>
      {/* BOTTOM NAV BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:hidden">
        {/* BERANDA (OWNER ONLY) */}
        {role === "OWNER" && (
          <Link href="/beranda" className={navItemClass("/beranda")}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Beranda</span>
          </Link>
        )}

        {/* KATALOG (Hanya muncul jika cabang spesifik terpilih) */}
        {!isAllBranches && (role === "OWNER" || role === "MANAGER") && (
          <Link href="/katalog" className={navItemClass("/katalog")}>
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Katalog</span>
          </Link>
        )}

        {/* AUDIT & FRAUD (Di mode Semua Cabang menggantikan Katalog) */}
        {isAllBranches && role === "OWNER" && (
          <Link href="/audit-fraud" className={navItemClass("/audit-fraud")}>
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Audit</span>
          </Link>
        )}

        {/* TUTUP SHIFT (KASIR direct on bottom nav) */}
        {role === "KASIR" && (
          <Link href="/shift-closing" className={navItemClass("/shift-closing")}>
            <Lock className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Tutup Shift</span>
          </Link>
        )}

        {/* KASIR CENTER BUTTON (HANYA MUNCUL DI CABANG SPESIFIK) */}
        {!isAllBranches ? (
          <div className="flex flex-col items-center justify-center flex-1 h-full relative -top-3">
            <Link
              href="/kasir"
              className="bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white w-[56px] h-[56px] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(16,185,129,0.35)] hover:scale-105 transition-transform active:scale-95 border-[3px] border-white"
            >
              <Plus className="h-6 w-6 stroke-[3]" />
            </Link>
            <span className="text-[10px] font-black text-emerald-600 mt-1 tracking-tight">KASIR</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 h-full relative -top-3">
            <Link
              href="/riwayat"
              className="bg-gradient-to-tr from-slate-900 to-slate-700 text-white w-[56px] h-[56px] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(15,23,42,0.35)] hover:scale-105 transition-transform active:scale-95 border-[3px] border-white"
            >
              <Receipt className="h-6 w-6" />
            </Link>
            <span className="text-[10px] font-black text-slate-800 mt-1 tracking-tight">RIWAYAT</span>
          </div>
        )}

        {/* RIWAYAT (Cabang spesifik) ATAU CRM (Semua cabang) */}
        {!isAllBranches && (role === "OWNER" || role === "MANAGER") && (
          <Link href="/riwayat" className={navItemClass("/riwayat")}>
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Riwayat</span>
          </Link>
        )}

        {isAllBranches && role === "OWNER" && (
          <Link href="/crm" className={navItemClass("/crm")}>
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">CRM</span>
          </Link>
        )}

        {/* LAINNYA (ALL ROLES) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsMoreOpen((prev) => !prev)
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer select-none active:scale-95 transition-all ${
            isMoreOpen ? "text-emerald-600 font-bold" : "text-slate-400 hover:text-slate-700"
          }`}
          aria-label="Menu lainnya"
        >
          <Menu className="w-5 h-5 pointer-events-none" />
          <span className="text-[10px] font-semibold mt-1 pointer-events-none">Lainnya</span>
        </button>
      </div>

      {/* MORE MENU BOTTOM SHEET */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-[70] flex justify-center items-end sm:items-center p-0 lg:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Card */}
          <div
            className="relative z-10 bg-white w-full max-h-[85vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isAllBranches ? "Menu Akumulasi Pusat" : "Menu Outlet"}
                </h2>
                <p className="text-xs text-gray-400">
                  Mode: <span className="font-bold text-emerald-600">{isAllBranches ? "Semua Cabang" : "Cabang Spesifik"}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 font-bold cursor-pointer transition-all"
                aria-label="Tutup menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-5">
              {menuCategories.map((category, catIdx) => (
                <div key={catIdx}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
                    {category.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {category.links.map((link, linkIdx) => {
                      const Icon = link.icon
                      return (
                        <Link
                          key={linkIdx}
                          href={link.href}
                          onClick={() => setIsMoreOpen(false)}
                          className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/30 text-gray-700 text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{link.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* INTEGRASI TAMBAHAN (OWNER ONLY) */}
              {role === "OWNER" && !isAllBranches && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
                    INTEGRASI & SISTEM
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/pengaturan/whatsapp"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-gray-100 hover:border-emerald-300 text-gray-700 text-xs font-semibold shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Blast</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <form action={logoutUser}>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Aplikasi</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
