"use client"

import Link from "next/link"
import { logoutUser } from "@/actions/auth"
import Image from "next/image"
import { usePathname } from "next/navigation"
import BranchSelector from "@/components/branch/BranchSelector"
import { useBranch } from "@/context/BranchContext"
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
  MapPin,
} from "lucide-react"

type NavItem = {
  label: string
  href: string
  icon: any
  scope: "ALL_ONLY" | "BRANCH_ONLY" | "BOTH"
}

type NavGroup = {
  label: string | null
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { label: "Dashboard", href: "/beranda", icon: LayoutDashboard, scope: "BOTH" },
    ],
  },
  {
    label: "Operasional & Jualan",
    items: [
      // Menu khusus cabang fisik
      //{ label: "Kasir POS", href: "/kasir", icon: Receipt, scope: "BRANCH_ONLY" },
      //{ label: "Tutup Shift", href: "/shift-closing", icon: Lock, scope: "BRANCH_ONLY" },
      { label: "Riwayat", href: "/riwayat", icon: History, scope: "BOTH" },
      // Audit & Fraud hanya ada di Semua Cabang (Level Pusat)
      { label: "Audit & Fraud", href: "/audit-fraud", icon: ShieldCheck, scope: "ALL_ONLY" },
    ],
  },
  {
    label: "Kelola & Stok",
    items: [
      // Katalog, Pegawai, Pengaturan & IoT hanya di masing-masing cabang
      { label: "Katalog & Timer", href: "/katalog", icon: Package, scope: "BRANCH_ONLY" },
      { label: "Pelanggan & CRM", href: "/crm", icon: Users, scope: "BOTH" },
      // Pengeluaran hanya di masing-masing cabang, disembunyikan di Semua Cabang
      { label: "Pengeluaran", href: "/pengeluaran", icon: DollarSign, scope: "BRANCH_ONLY" },
      { label: "Pegawai", href: "/pengaturan/pegawai", icon: Users, scope: "BRANCH_ONLY" },
      { label: "Pengaturan & IoT", href: "/pengaturan/toko", icon: Store, scope: "BOTH" },
    ],
  },
  {
    label: "Pahami Bisnis (Konsolidasi)",
    items: [
      // Analisis performa produk, AOV, dan laporan keuangan hanya di Semua Cabang
      { label: "Performa Produk", href: "/performa-produk", icon: TrendingUp, scope: "ALL_ONLY" },
      { label: "Rata-rata Belanja", href: "/performa-aov", icon: BarChart3, scope: "ALL_ONLY" },
      { label: "Laporan Keuangan", href: "/laporan", icon: ReceiptText, scope: "ALL_ONLY" },
    ],
  },
]

export default function DesktopSidebar({ businessName, role = "OWNER" }: { businessName?: string; role?: string }) {
  const pathname = usePathname()
  const { isAllBranches, selectedBranch } = useBranch()

  // Sembunyikan sidebar pada layar POS kasir
  if (pathname === "/kasir" || pathname?.startsWith("/kasir")) {
    return null
  }

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
          <Image src="/logo-bosnitro.png" alt="BOSNITRO" width={140} height={34} priority className="h-8 w-auto object-contain" />
          {businessName && (
            <p className="text-xs font-bold text-gray-700 truncate">{businessName}</p>
          )}
        </div>
        {role === "OWNER" && (
          <Link
            href="/pengaturan/toko"
            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
            title={isAllBranches ? "Pengaturan Pusat Bisnis (Owner)" : "Pengaturan Hardware & IoT Cabang"}
          >
            <Settings className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Global Branch Selector Widget (Locked for Shift Closing and Kasir) */}
      <div className="px-3 pt-3 pb-1 border-b border-gray-100">
        {pathname === "/shift-closing" || role === "KASIR" ? (
          <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-left">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Cabang Bertugas
              </span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {selectedBranch?.name || "Cabang Outlet"}
              </span>
            </div>
          </div>
        ) : (
          <BranchSelector allowAll={role === "OWNER"} />
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {navGroups.map((group) => {
          // Filter items based on active branch mode (Semua Cabang vs Cabang Spesifik)
          const visibleItems = group.items.filter((item) => {
            // Scope check: ALL_ONLY vs BRANCH_ONLY
            if (isAllBranches && item.scope === "BRANCH_ONLY") return false
            if (!isAllBranches && item.scope === "ALL_ONLY") return false

            // RBAC role check
            if (role === "KASIR") {
              const allowedKasir = ["/kasir", "/shift-closing"]
              if (!allowedKasir.includes(item.href)) return false
            } else if (role === "MANAGER") {
              const allowedManager = ["/kasir", "/katalog", "/shift-closing", "/riwayat"]
              if (!allowedManager.includes(item.href)) return false
            }

            return true
          })

          if (visibleItems.length === 0) return null

          return (
            <div key={group.label ?? "home"}>
              {group.label && (
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.14em] px-2 mb-1.5">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href)
                  const isSettingsItem = item.href === "/pengaturan/toko"
                  const displayLabel = isSettingsItem
                    ? (isAllBranches ? "Pengaturan Bisnis (Owner)" : "Pengaturan Hardware & IoT")
                    : item.label
                  const IconComponent = isSettingsItem && isAllBranches ? Settings : item.icon

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
                      <span className="truncate">{displayLabel}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
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
