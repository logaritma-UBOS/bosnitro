export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTransactions, getFraudAlerts } from "@/lib/interlockingDb"
import OwnerDashboardInterlockingClient from "./OwnerDashboardInterlockingClient"

export default async function BerandaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Strict RBAC synchronization: Kasir & Manager are redirected to POS
  if (session.user.role !== "OWNER") {
    redirect("/kasir")
  }

  const [transactions, alerts] = await Promise.all([
    getTransactions(),
    getFraudAlerts(),
  ])

  return (
    <OwnerDashboardInterlockingClient
      initialTransactions={transactions}
      initialAlerts={alerts}
    />
  )
}
