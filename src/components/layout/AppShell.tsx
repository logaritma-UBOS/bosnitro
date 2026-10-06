import DesktopSidebar from "@/components/layout/DesktopSidebar"
import MobileBottomNav from "@/components/layout/MobileBottomNav"
import FeatureGuard from "@/components/layout/FeatureGuard"
import { auth } from "@/auth"

/**
 * AppShell — Wrapper for all authenticated app pages.
 */
export default async function AppShell({
  children,
  businessName,
}: {
  children: React.ReactNode
  businessName?: string
}) {
  const session = await auth()
  const role = session?.user?.role || "OWNER"

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Persistent Desktop Sidebar */}
      <DesktopSidebar businessName={businessName} role={role} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden pb-16 lg:pb-0">
        <FeatureGuard>
          {children}
        </FeatureGuard>
      </main>
      
      {/* Global Mobile Bottom Navigation */}
      <MobileBottomNav role={role} />
    </div>
  )
}
