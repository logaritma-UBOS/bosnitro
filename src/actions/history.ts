"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getTransactionHistory() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized", data: [] }
  
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) return { error: "Business not found", data: [] }

  const sales = await prisma.sale.findMany({
    where: { businessId: business.id },
    include: {
      saleItems: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100 // Limit for MVP
  })

  return { success: true, data: sales }
}
