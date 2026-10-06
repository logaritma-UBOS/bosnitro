"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getEquivalentPreviousPeriod, getStartOfDayUTC } from "@/lib/engines/timeEngine"

export type PeriodFilter = "TODAY" | "7_DAYS" | "30_DAYS"

export async function fetchProductPerformanceData(period: PeriodFilter) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) return { error: "Business not found" }

  // Fallback to UTC if timezone not defined on business model
  // Note: For MVP, assume business.timezone might not be in DB yet, but architecture requires it.
  // In a real migration we'd add it to schema. For now we use standard UTC or "Asia/Jakarta" as fallback.
  // @ts-ignore - Assuming business has timezone or fallback to Asia/Jakarta
  const tz = business.timezone || "Asia/Jakarta"

  const nowUTC = new Date()
  let currentStartUTC = new Date()

  if (period === "TODAY") {
    currentStartUTC = getStartOfDayUTC(tz, nowUTC)
  } else if (period === "7_DAYS") {
    currentStartUTC = getStartOfDayUTC(tz, nowUTC)
    currentStartUTC.setUTCDate(currentStartUTC.getUTCDate() - 6) // 6 days ago + today = 7 days
  } else if (period === "30_DAYS") {
    currentStartUTC = getStartOfDayUTC(tz, nowUTC)
    currentStartUTC.setUTCDate(currentStartUTC.getUTCDate() - 29) 
  }

  const { prevStartUTC, prevEndUTC } = getEquivalentPreviousPeriod(tz, currentStartUTC, nowUTC, period)

  // Tenant-isolated Query
  const currentSales = await prisma.sale.findMany({
    where: { 
      businessId: business.id, 
      createdAt: { gte: currentStartUTC, lte: nowUTC } 
    },
    include: { saleItems: { include: { product: true } } }
  })

  const previousSales = await prisma.sale.findMany({
    where: { 
      businessId: business.id, 
      createdAt: { gte: prevStartUTC, lte: prevEndUTC } 
    },
    include: { saleItems: { include: { product: true } } }
  })

  // Calculate active days for velocity
  let activeDays = 1
  if (period === "7_DAYS") activeDays = 7
  if (period === "30_DAYS") activeDays = 30

  const { calculateProductPerformance } = await import("@/lib/engines/productPerformanceEngine")
  const result = calculateProductPerformance(currentSales as any, previousSales as any, activeDays)

  return { success: true, result, timezone: tz }
}
