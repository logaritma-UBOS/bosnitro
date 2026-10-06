export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import ContentClient from "./ContentClient"
import Link from "next/link"

export default async function ContentPage() {
  const session = await auth()
  const plan = "Pro"
  if (!session?.user?.id) redirect("/login")

  const business = await prisma.business.findFirst({
    where: { userId: session.user.id }
  })

  if (!business) redirect("/onboarding")

  const plans = await prisma.contentPlan.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' }
  })

  return (
        <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-500 hover:text-gray-700">← Kembali</Link>
          <h1 className="text-2xl font-bold text-gray-900">Rencana Konten (MVP)</h1>
        </div>
        <ContentClient initialPlans={plans} />
      </div>
    </div>
      )
}
