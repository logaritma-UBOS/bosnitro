import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import StrukClient from "./StrukClient"

export default async function StrukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({
    where: whereClause,
    include: { settings: true }
  })

  if (!business) redirect("/onboarding")

  const sale = await prisma.sale.findFirst({
    where: { 
      clientTransactionId: id,
      businessId: business.id // TENANT ISOLATION
    },
    include: {
      saleItems: {
        include: { product: true }
      }
    }
  })

  if (!sale) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Struk Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Mungkin transaksi sedang diproses atau ID struk salah. Silakan muat ulang halaman ini dalam beberapa detik.</p>
        <a href={`/kasir/struk/${id}`} className="px-6 py-2 bg-blue-600 text-white rounded-lg mb-3 block w-max mx-auto">Muat Ulang</a>
        <a href="/kasir" className="text-blue-600 font-medium">Kembali ke Kasir</a>
      </div>
    )
  }

  return <StrukClient sale={sale} business={business} />
}
