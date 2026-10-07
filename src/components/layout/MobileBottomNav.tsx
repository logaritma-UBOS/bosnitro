"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
    `flex flex-col items-center justify-center flex-1 h-full ${isActive(path) ? "text-emerald-600 font-bold" : "text-slate-400 hover:text-slate-700"}`

  let menuCategories = [
    {
      title: "KELOLA",
      links: [
        { label: "Tutup Shift", href: "/shift-closing", icon: "🔒" },
        { label: "Pengeluaran", href: "/pengeluaran", icon: "💸" },
        { label: "Pegawai", href: "/pengaturan/pegawai", icon: "👥" },
      ],
    },
    {
      title: "PAHAMI BISNIS",
      links: [
        { label: "Performa Produk", href: "/performa-produk", icon: "📈" },
        { label: "Rata-rata Belanja", href: "/performa-aov", icon: "💰" },
        { label: "Laporan Keuangan", href: "/laporan", icon: "📄" },
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-[10px] font-semibold mt-0.5">Beranda</span>
          </Link>
        )}

        {/* KATALOG (OWNER & MANAGER) */}
        {(role === "OWNER" || role === "MANAGER") && (
          <Link href="/katalog" className={navItemClass("/katalog")}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span className="text-[10px] font-semibold mt-0.5">Katalog</span>
          </Link>
        )}

        {/* TUTUP SHIFT (KASIR direct on bottom nav) */}
        {role === "KASIR" && (
          <Link href="/shift-closing" className={navItemClass("/shift-closing")}>
            <span className="text-lg">🔒</span>
            <span className="text-[10px] font-semibold mt-0.5">Tutup Shift</span>
          </Link>
        )}

        {/* KASIR (ALL ROLES - PROMINENT CENTER BUTTON) */}
        <div className="flex flex-col items-center justify-center flex-1 h-full relative -top-3">
          <Link
            href="/kasir"
            className="bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white w-[56px] h-[56px] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(16,185,129,0.35)] hover:scale-105 transition-transform active:scale-95 border-[3px] border-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
          <span className="text-[10px] font-black text-emerald-600 mt-1 tracking-tight">KASIR</span>
        </div>

        {/* RIWAYAT (OWNER & MANAGER) */}
        {(role === "OWNER" || role === "MANAGER") && (
          <Link href="/riwayat" className={navItemClass("/riwayat")}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <span className="text-[10px] font-semibold mt-0.5">Riwayat</span>
          </Link>
        )}

        {/* LAINNYA (ALL ROLES) */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isMoreOpen ? "text-emerald-600 font-bold" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <span className="text-[10px] font-semibold mt-0.5">Lainnya</span>
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
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-safe space-y-5">
              {menuCategories.map((category, catIdx) => (
                <div key={catIdx}>
                  <h3 className="text-[10px] font-bold text-gray-400 mb-2.5 ml-1 tracking-wider uppercase">
                    {category.title}
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {category.links.map((link, i) => (
                      <Link
                        key={i}
                        href={link.href}
                        onClick={() => setIsMoreOpen(false)}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white rounded-2xl border border-gray-100 shadow-xs active:scale-95 transition-all text-center"
                      >
                        <span className="text-2xl">{link.icon}</span>
                        <span className="text-[11px] font-bold text-gray-700 leading-tight">
                          {link.label}
                        </span>
                      </Link>
                    ))}
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
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-xs text-center transition-all"
                  >
                    <span className="text-2xl">💬</span>
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
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
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
