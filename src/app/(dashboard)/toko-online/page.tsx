import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import TokoClient from "./TokoClient"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function TokoOnlineSettings() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({
    where: whereClause,
    include: { settings: true }
  })
  if (!business) redirect("/onboarding")

  return (
        <main className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20 lg:static lg:bg-transparent lg:border-none lg:pt-8 lg:px-8">
        <div className="max-w-xl lg:max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 active:scale-95 transition-transform lg:hidden border border-gray-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="font-black text-gray-900 leading-none lg:text-2xl">Toko Online</h1>
              <p className="text-[11px] lg:text-sm font-semibold text-gray-500 mt-0.5 lg:mt-1">Etalase Publik Anda</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-xl lg:max-w-5xl mx-auto p-4 lg:px-8 lg:py-6">
        <TokoClient 
          initialSlug={business.settings?.storeSlug || ""}
          initialDesc={business.settings?.storeDescription || ""}
          initialActive={business.settings?.storeActive ?? false}
          phone={business.settings?.storePhone || ""}
        />
      </div>
    </main>
      )
}
