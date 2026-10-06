import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import StokClient from "./StokClient"

import { Suspense } from "react"

export default async function StokPage() {
  const session = await auth()
  const plan = "Pro"
  if (!session?.user?.id) redirect("/login")
  if (session.user.role === "KASIR") redirect("/kasir")

  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) redirect("/")

  const [products, ingredients, suppliers, movements] = await Promise.all([
    prisma.product.findMany({ 
      where: { businessId: business.id, trackInventory: true, hasBOM: false },
      orderBy: { name: 'asc' } 
    }),
    prisma.ingredient.findMany({ 
      where: { businessId: business.id },
      orderBy: { name: 'asc' }
    }),
    prisma.supplier.findMany({ 
      where: { businessId: business.id },
      orderBy: { name: 'asc' }
    }),
    prisma.stockMovement.findMany({
      where: { businessId: business.id },
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        product: { select: { name: true } },
        ingredient: { select: { name: true, unit: true } },
        supplier: { select: { name: true } }
      }
    })
  ])

  return (
          <Suspense fallback={<div className="p-8 text-center">Memuat data...</div>}>
        <StokClient 
          products={products}
          ingredients={ingredients}
          suppliers={suppliers}
          movements={movements}
        />
      </Suspense>
      )
}
