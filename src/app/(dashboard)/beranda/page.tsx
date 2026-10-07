export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTransactions, getFraudAlerts } from "@/lib/interlockingDb"
import { prisma } from "@/lib/prisma"
import { DEFAULT_TELEGRAM_RECIPIENT } from "@/lib/telegram"
import OwnerDashboardInterlockingClient from "./OwnerDashboardInterlockingClient"

export default async function BerandaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Strict RBAC synchronization: Kasir & Manager are redirected to POS
  if (session.user.role !== "OWNER") {
    redirect("/kasir")
  }

  const [transactions, alerts, user] = await Promise.all([
    getTransactions(),
    getFraudAlerts(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { phone: true } }),
  ])

  const initialTelegramPhone = user?.phone?.trim() || DEFAULT_TELEGRAM_RECIPIENT

  return (
    <OwnerDashboardInterlockingClient
      initialTransactions={transactions}
      initialAlerts={alerts}
      initialTelegramPhone={initialTelegramPhone}
    />
  )
}
