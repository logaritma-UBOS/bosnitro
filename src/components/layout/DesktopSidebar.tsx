"use client"

import Link from "next/link"
import { logoutUser } from "@/actions/auth"
import Image from "next/image"
import { usePathname } from "next/navigation"
import BranchSelector from "@/components/branch/BranchSelector"
import {
  LayoutDashboard,
  Receipt,
  Lock,
  History,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  ReceiptText,
  LogOut,
  Store,
  Settings,
  ShieldCheck,
} from "lucide-react"

const navGroups = [
  {
    label: null,
    items: [
      { label: "Dashboard", href: "/beranda", icon: LayoutDashboard },
    ]
  },
  {
    label: "Operasional & Jualan",
    items: [
      { label: "Kasir POS", href: "/kasir", icon: Receipt },
      { label: "Tutup Shift", href: "/shift-closing", icon: Lock },
      { label: "Riwayat", href: "/riwayat", icon: History },
      { label: "Audit & Fraud", href: "/audit-fraud", icon: ShieldCheck },
    ]
  },
  {
    label: "Kelola & Stok",
    items: [
      { label: "Katalog & Timer", href: "/katalog", icon: Package },
      { label: "Pelanggan & CRM", href: "/crm", icon: Users },
      { label: "Pengeluaran", href: "/pengeluaran", icon: DollarSign },
      { label: "Pegawai", href: "/pengaturan/pegawai", icon: Users },
      { label: "Pengaturan & IoT", href: "/pengaturan/toko", icon: Store },
    ]
  },
  {
    label: "Pahami Bisnis",
    items: [
      { label: "Performa Produk", href: "/performa-produk", icon: TrendingUp },
      { label: "Rata-rata Belanja", href: "/performa-aov", icon: BarChart3 },
      { label: "Laporan Keuangan", href: "/laporan", icon: ReceiptText },
    ]
  }
]

export default function DesktopSidebar({ businessName, role = "OWNER" }: { businessName?: string, role?: string }) {
  const pathname = usePathname()
  
  // Active check: exact for /, startsWith for others
  const isActive = (href: string) => {
    if (href === "/" || href === "/beranda") return pathname === "/" || pathname === "/beranda"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
      {/* Logo + Business Name */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="space-y-1 min-w-0">
          <Image src="/logo-ubos.png" alt="UBOS" width={90} height={28} className="h-7 w-auto object-contain" />
          {businessName && (
            <p className="text-xs font-bold text-gray-700 truncate">{businessName}</p>
          )}
        </div>
        {role === "OWNER" && (
          <Link
            href="/pengaturan/toko"
            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
            title="Pengaturan Toko & Profil"
          >
            <Settings className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Global Branch Selector Widget */}
      <div className="px-3 pt-3 pb-1 border-b border-gray-100">
        <BranchSelector allowAll={role === "OWNER"} />
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label ?? "home"}>
            {group.label && (
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.14em] px-2 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                // Strict RBAC synchronization
                if (role === 'KASIR') {
                  const allowedKasir = ["/kasir", "/shift-closing"];
                  if (!allowedKasir.includes(item.href)) return null;
                } else if (role === 'MANAGER') {
                  const allowedManager = ["/kasir", "/katalog", "/shift-closing", "/riwayat"];
                  if (!allowedManager.includes(item.href)) return null;
                }

                const active = isActive(item.href)
                const IconComponent = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? "bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 pl-2 shadow-xs"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <IconComponent
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-emerald-600" : "text-gray-400"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile / Logout */}
      <div className="p-3 border-t border-gray-100">
        <form action={logoutUser}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 text-gray-400" />
            <span>Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
