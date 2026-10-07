"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"

export default function MobileBottomNav({ role = "OWNER" }: { role?: string }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const pathname = usePathname()

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

  let menuCategories = [
    {
      title: "KELOLA",
      links: [
        { label: "Tutup Shift", href: "/shift-closing", icon: Lock },
        { label: "Pengeluaran", href: "/pengeluaran", icon: DollarSign },
        { label: "Pegawai", href: "/pengaturan/pegawai", icon: Users },
      ],
    },
    {
      title: "PAHAMI BISNIS",
      links: [
        { label: "Performa Produk", href: "/performa-produk", icon: TrendingUp },
        { label: "Rata-rata Belanja", href: "/performa-aov", icon: BarChart3 },
        { label: "Laporan Keuangan", href: "/laporan", icon: ReceiptText },
      ],
    },
  ]

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
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex justify-around items-center h-[72px] z-[60] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pb-safe rounded-t-2xl px-2">
        {/* BERANDA (OWNER ONLY) */}
        {role === "OWNER" && (
          <Link href="/beranda" className={navItemClass("/beranda")}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Beranda</span>
          </Link>
        )}

        {/* KATALOG (OWNER & MANAGER) */}
        {(role === "OWNER" || role === "MANAGER") && (
          <Link href="/katalog" className={navItemClass("/katalog")}>
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Katalog</span>
          </Link>
        )}

        {/* TUTUP SHIFT (KASIR direct on bottom nav) */}
        {role === "KASIR" && (
          <Link href="/shift-closing" className={navItemClass("/shift-closing")}>
            <Lock className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Tutup Shift</span>
          </Link>
        )}

        {/* KASIR (ALL ROLES - PROMINENT CENTER BUTTON) */}
        <div className="flex flex-col items-center justify-center flex-1 h-full relative -top-3">
          <Link
            href="/kasir"
            className="bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white w-[56px] h-[56px] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(16,185,129,0.35)] hover:scale-105 transition-transform active:scale-95 border-[3px] border-white"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </Link>
          <span className="text-[10px] font-black text-emerald-600 mt-1 tracking-tight">KASIR</span>
        </div>

        {/* RIWAYAT (OWNER & MANAGER) */}
        {(role === "OWNER" || role === "MANAGER") && (
          <Link href="/riwayat" className={navItemClass("/riwayat")}>
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Riwayat</span>
          </Link>
        )}

        {/* LAINNYA (ALL ROLES) */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isMoreOpen ? "text-emerald-600 font-bold" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Lainnya</span>
        </button>
      </div>

      {/* MORE MENU BOTTOM SHEET */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-[70] flex justify-center items-end bg-slate-900/40 backdrop-blur-sm sm:items-center p-0 lg:hidden"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="bg-white w-full max-h-[85vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Menu Lainnya</h2>
                <p className="text-xs text-gray-400">Hak Akses: {role}</p>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-safe space-y-5">
              {menuCategories.map((category, catIdx) => (
                <div key={catIdx}>
                  <h3 className="text-[10px] font-bold text-gray-400 mb-2.5 ml-1 tracking-wider uppercase">
                    {category.title}
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {category.links.map((link, i) => {
                      const IconComp = link.icon
                      return (
                        <Link
                          key={i}
                          href={link.href}
                          onClick={() => setIsMoreOpen(false)}
                          className="flex flex-col items-center justify-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-xs active:scale-95 transition-all text-center"
                        >
                          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700">
                            <IconComp className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="text-[11px] font-bold text-gray-700 leading-tight">
                            {link.label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div>
                <h3 className="text-[10px] font-bold text-gray-400 mb-2.5 ml-1 tracking-wider uppercase">
                  BANTUAN
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      setIsMoreOpen(false)
                      setTimeout(() => window.dispatchEvent(new Event("open-live-chat")), 300)
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-xs text-center transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 leading-tight">Support</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    const { signOut } = require("next-auth/react")
                    signOut({ callbackUrl: "/login" })
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar ({role})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
