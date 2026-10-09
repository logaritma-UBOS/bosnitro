import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import AppShell from "@/components/layout/AppShell"
import LiveChatWidget from "@/components/chat/LiveChatWidget"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  let businessName = "BOSNITRO"
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  
  if (business) {
    businessName = business.name
  }

  return (
    <AppShell businessName={businessName}>
      {children}
      <LiveChatWidget userId={session.user.id} />
    </AppShell>
  )
}
