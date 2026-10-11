import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTransactions, getFraudAlerts, getTenantBusinessId } from "@/lib/interlockingDb"
import AuditFraudClient from "./AuditFraudClient"

export const metadata = {
  title: "Audit & Deteksi Fraud (Anti-Loss) | POS UBOS",
  description: "Pusat audit visual plat nomor, botol oli bekas, dan log sensor anomali Telegram",
}

export default async function AuditFraudPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const businessId = await getTenantBusinessId(session)

  const transactions = await getTransactions("ALL", businessId)
  const alerts = await getFraudAlerts("ALL", businessId)

  return (
    <AuditFraudClient
      initialTransactions={transactions}
      initialAlerts={alerts}
    />
  )
}
