import { getTransactions, getFraudAlerts } from "@/lib/interlockingDb"
import AuditFraudClient from "./AuditFraudClient"

export const metadata = {
  title: "Audit & Deteksi Fraud (Anti-Loss) | POS UBOS",
  description: "Pusat audit visual plat nomor, botol oli bekas, dan log sensor anomali Telegram",
}

export default async function AuditFraudPage() {
  const transactions = await getTransactions()
  const alerts = await getFraudAlerts()

  return (
    <AuditFraudClient
      initialTransactions={transactions}
      initialAlerts={alerts}
    />
  )
}
