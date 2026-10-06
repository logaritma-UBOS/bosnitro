export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import KasirClient from "./KasirClient"

export default async function KasirPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) redirect("/")

  const products = await prisma.product.findMany({ where: { businessId: business.id, isActive: true } });

  // Get retail product stocks
  const retailProducts = products.filter(p => !p.hasBOM && p.trackInventory)
  const productStocks: Record<string, number> = {}
  
  if (retailProducts.length > 0) {
    const movements = await prisma.stockMovement.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { businessId: business.id, productId: { in: retailProducts.map(p => p.id) } }
    })
    for (const m of movements) {
      if (m.productId) productStocks[m.productId] = m._sum.quantity || 0
    }
  }

  const productsWithStock = products.map(p => {
    let stock = null;
    if (!p.hasBOM && p.trackInventory) {
      stock = productStocks[p.id] || 0;
    }
    return { ...p, stock }
  })

  return <KasirClient products={productsWithStock as any} />}
