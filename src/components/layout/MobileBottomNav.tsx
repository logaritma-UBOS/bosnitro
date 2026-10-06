"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MobileBottomNav({ role = "OWNER" }: { role?: string }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [tier, setTier] = useState<string>("Starter")
  const pathname = usePathname()

  useEffect(() => {
    fetch("/api/user/status").then(r => r.json()).then(d => {
      setTier(d.tier || "Starter")
    }).catch(() => {})
  }, [])
  
  if (pathname === '/login' || pathname === '/register' || pathname === '/reset-sandi') {
    return null
  }

  const isLocked = (_label?: string) => false

  const isActive = (path: string) => {
    if (path === "/" || path === "/beranda") return pathname === "/" || pathname === "/beranda"
    return pathname?.startsWith(path)
  }

  const navItemClass = (path: string) => 
    `flex flex-col items-center justify-center w-[20%] h-full ${isActive(path) ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-700'}`

      let menuCategories = [
    {
      title: "KELOLA",
      links: [
        { label: "Pengeluaran", href: "/pengeluaran", icon: "💸" },
        { label: "Pegawai", href: "/pengaturan/pegawai", icon: "👥" },
      ]
    },
    {
      title: "PAHAMI BISNIS",
      links: [
        { label: "Performa Produk", href: "/performa-produk", icon: "📈" },
        { label: "Rata-rata Belanja", href: "/performa-aov", icon: "💰" },
        { label: "Laporan Keuangan", href: "/laporan", icon: "📄" },
      ]
    }
  ]


  // Filter for role
  if (role === "KASIR") {
    const allowedKasir = ["/katalog"]; // Kasir only sees limited items in "Lainnya"
    menuCategories = menuCategories.map(cat => ({
      ...cat,
      links: cat.links.filter(l => allowedKasir.includes(l.href))
    })).filter(cat => cat.links.length > 0);
  } else if (role === "MANAGER") {
    const restrictedManager = ["/laporan", "/pengeluaran", "/performa-produk", "/performa-aov", "/pengaturan/target", "/pengaturan/whatsapp", "/pengaturan/pegawai"];
    menuCategories = menuCategories.map(cat => ({
      ...cat,
      links: cat.links.filter(l => !restrictedManager.includes(l.href))
    })).filter(cat => cat.links.length > 0);
  }

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200/50 flex justify-around items-center h-[72px] z-[60] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe rounded-t-2xl">
        {role === "OWNER" && (<Link href="/beranda" className={navItemClass("/beranda")}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[10px] font-bold mt-0.5">Beranda</span>
        </Link>)}
        {role !== "KASIR" && (<Link href="/katalog" className={navItemClass("/katalog")}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <span className="text-[10px] font-semibold mt-0.5">Katalog</span>
        </Link>)}

        {/* KASIR */}
        <div className="flex flex-col items-center justify-center w-[20%] h-full relative -top-3">
          <Link href="/kasir" className="bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(16,185,129,0.4)] hover:scale-105 transition-transform active:scale-95 border-[4px] border-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
          <span className="text-[11px] font-black text-emerald-600 mt-1.5 tracking-tight">KASIR</span>
        </div>

        {role !== "KASIR" && (<Link href="/riwayat" className={navItemClass("/riwayat")}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <span className="text-[10px] font-semibold mt-0.5">Riwayat</span>
        </Link>)}
        <button 
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center w-[20%] h-full ${isMoreOpen ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-700'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <span className="text-[10px] font-semibold mt-0.5">Lainnya</span>
        </button>
      </div>

      {/* MORE MENU BOTTOM SHEET */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-[70] flex justify-center items-end bg-slate-900/40 backdrop-blur-sm sm:items-center p-0 lg:hidden" onClick={() => setIsMoreOpen(false)}>
          <div 
            className="bg-white w-full max-h-[85vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Menu Lainnya</h2>
              <button onClick={() => setIsMoreOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-safe">
              <div className="space-y-6">
                {menuCategories.map((category, catIdx) => (
                  <div key={catIdx}>
                    <h3 className="text-[10px] font-bold text-gray-400 mb-3 ml-2 tracking-wider uppercase">{category.title}</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {category.links.map((link, i) => {
                        if (isLocked(link.label)) {
                          return (
                            <div 
                              key={i}
                              className="relative flex flex-col items-center justify-center gap-2 p-3 bg-gray-50/50 rounded-2xl border border-transparent text-center cursor-not-allowed opacity-60"
                            >
                              <span className="text-2xl grayscale">{link.icon}</span>
                              <span className="text-[10px] font-semibold text-gray-400 leading-tight">{link.label}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 absolute top-2 right-2 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                            </div>
                          )
                        }
                        return (
                          <Link 
                            key={i} 
                            href={link.href} 
                            onClick={() => setIsMoreOpen(false)}
                            className="flex flex-col items-center justify-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all text-center"
                          >
                            <span className="text-2xl">{link.icon}</span>
                            <span className="text-[10px] font-semibold text-gray-700 leading-tight">{link.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
                  <div className="mt-6">
                    <h3 className="text-[10px] font-bold text-gray-400 mb-3 ml-2 tracking-wider uppercase">BANTUAN</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => {
                          setIsMoreOpen(false);
                          setTimeout(() => window.dispatchEvent(new Event('open-live-chat')), 300);
                        }}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm text-center transition-all"
                      >
                        <span className="text-2xl">💬</span>
                        <span className="text-[10px] font-bold text-gray-700 leading-tight">Support</span>
                      </button>
                    </div>
                  </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 pb-4">
                <button 
                  onClick={() => {
                    const { signOut } = require("next-auth/react");
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Keluar (Logout)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
