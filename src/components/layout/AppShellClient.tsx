"use client"

import { usePathname } from "next/navigation"
import DesktopSidebar from "@/components/layout/DesktopSidebar"
import MobileBottomNav from "@/components/layout/MobileBottomNav"
import FeatureGuard from "@/components/layout/FeatureGuard"

export default function AppShellClient({
  children,
  businessName,
  role = "OWNER",
}: {
  children: React.ReactNode
  businessName?: string
  role?: string
}) {
  const pathname = usePathname()
  const isPosPage = pathname === "/kasir" || pathname?.startsWith("/kasir")

  // Pada halaman Kasir POS, sembunyikan seluruh sidebar dan bottom nav
  // agar menjadi layar kerja POS kasir murni full-screen
  if (isPosPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col w-full">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Persistent Desktop Sidebar */}
      <DesktopSidebar businessName={businessName} role={role} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden pb-20 lg:pb-6">
        <FeatureGuard>
          {children}
        </FeatureGuard>
      </main>
      
      {/* Global Mobile Bottom Navigation */}
      <MobileBottomNav role={role} />
    </div>
  )
}
