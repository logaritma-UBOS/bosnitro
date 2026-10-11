import AppShellClient from "@/components/layout/AppShellClient"
import { BranchProvider } from "@/context/BranchContext"
import { auth } from "@/auth"
import { getTenantBusinessId } from "@/lib/interlockingDb"

/**
 * AppShell — Wrapper for all authenticated app pages with BranchContext.
 * Automatically delegates full-screen presentation for dedicated cashier POS.
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
  const businessId = await getTenantBusinessId(session)
  const assignedBranchId = (session?.user as any)?.assignedBranchId || null

  return (
    <BranchProvider businessId={businessId} assignedBranchId={assignedBranchId} userRole={role}>
      <AppShellClient businessName={businessName} role={role}>
        {children}
      </AppShellClient>
    </BranchProvider>
  )
}
