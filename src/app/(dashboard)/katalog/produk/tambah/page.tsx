import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import TambahProdukClient from "./TambahProdukClient"

export default async function TambahProdukServer() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) redirect("/")

  return <TambahProdukClient businessType={business.businessType} />
}
