"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getEquivalentPreviousPeriod, getStartOfDayUTC } from "@/lib/engines/timeEngine"

export type AOVMarginPeriodFilter = "TODAY" | "7_DAYS" | "30_DAYS"

export async function fetchAOVMarginData(period: AOVMarginPeriodFilter) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const businessSetting = await prisma.businessSetting.findFirst({ where: { business: { userId: session.user.id } } })
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  
  if (!business) return { error: "Business not found" }

  const tz = businessSetting?.timezone || "Asia/Jakarta"
  const nowUTC = new Date()
  let currentStartUTC = new Date()
  let activeDays = 1

  // Max query range limit is implicitly handled by the restricted ENUM types (max 30_DAYS)
  if (period === "TODAY") {
    currentStartUTC = getStartOfDayUTC(tz, nowUTC)
    activeDays = 1
  } else if (period === "7_DAYS") {
    currentStartUTC = getStartOfDayUTC(tz, nowUTC)
    currentStartUTC.setUTCDate(currentStartUTC.getUTCDate() - 6)
    activeDays = 7
  } else if (period === "30_DAYS") {
    currentStartUTC = getStartOfDayUTC(tz, nowUTC)
    currentStartUTC.setUTCDate(currentStartUTC.getUTCDate() - 29) 
    activeDays = 30
  }

  const { prevStartUTC, prevEndUTC } = getEquivalentPreviousPeriod(tz, currentStartUTC, nowUTC, period)

  // Minimal select payload + Tenant isolation via businessId
  const selectQuery = {
    id: true,
    createdAt: true,
    totalAmount: true,
    saleItems: {
      select: {
        productId: true,
        product: { select: { name: true } },
        quantity: true,
        priceAtSale: true,
        hppAtSale: true
      }
    }
  }

  const currentSales = await prisma.sale.findMany({
    where: { 
      businessId: business.id, 
      createdAt: { gte: currentStartUTC, lte: nowUTC } 
    },
    select: selectQuery
  })

  const previousSales = await prisma.sale.findMany({
    where: { 
      businessId: business.id, 
      createdAt: { gte: prevStartUTC, lte: prevEndUTC } 
    },
    select: selectQuery
  })

  const { calculateAOVMarginAnalysis } = await import("@/lib/engines/aovMarginEngine")
  const aovResult = calculateAOVMarginAnalysis(currentSales as any, previousSales as any, activeDays)

  return { 
    success: true, 
    aovResult, 
    activeDays, 
    timezone: tz,
    currentSalesCount: currentSales.length,
    previousSalesCount: previousSales.length
  }
}
