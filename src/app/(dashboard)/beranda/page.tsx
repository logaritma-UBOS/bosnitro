export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTransactions, getFraudAlerts, getStoreSettings, getTenantBusinessId } from "@/lib/interlockingDb"
import OwnerDashboardInterlockingClient from "./OwnerDashboardInterlockingClient"

export default async function BerandaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Strict RBAC synchronization: Kasir & Manager are redirected to POS
  if (session.user.role !== "OWNER") {
    redirect("/kasir")
  }

  const businessId = await getTenantBusinessId(session)
  const storeSettings = await getStoreSettings(businessId)

  const [transactions, alerts] = await Promise.all([
    getTransactions("ALL", businessId),
    getFraudAlerts("ALL", businessId),
  ])

  return (
    <OwnerDashboardInterlockingClient
      businessId={businessId}
      initialTransactions={transactions}
      initialAlerts={alerts}
      initialTelegramPhone={storeSettings.telegramPhone || ""}
      initialTelegramChatId={storeSettings.telegramChatId || null}
    />
  )
}
