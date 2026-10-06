"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getEquivalentPreviousPeriod, getStartOfDayUTC } from "@/lib/engines/timeEngine"

export type SalesTimePeriodFilter = "TODAY" | "7_DAYS" | "30_DAYS"

export async function fetchSalesTimeData(period: SalesTimePeriodFilter) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const businessSetting = await prisma.businessSetting.findFirst({ where: { business: { userId: session.user.id } } })
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  
  if (!business) return { error: "Business not found" }

  const tz = businessSetting?.timezone || "Asia/Jakarta"

  const nowUTC = new Date()
  let currentStartUTC = new Date()

  if (period === "TODAY") {
    currentStartUTC = getStartOfDayUTC(tz, nowUTC)
  } else if (period === "7_DAYS") {
    currentStartUTC = getStartOfDayUTC(tz, nowUTC)
    currentStartUTC.setUTCDate(currentStartUTC.getUTCDate() - 6)
  } else if (period === "30_DAYS") {
    currentStartUTC = getStartOfDayUTC(tz, nowUTC)
    currentStartUTC.setUTCDate(currentStartUTC.getUTCDate() - 29) 
  }

  const { prevStartUTC, prevEndUTC } = getEquivalentPreviousPeriod(tz, currentStartUTC, nowUTC, period)

  // Tenant-isolated Query, only selecting required fields for Time Analysis
  const currentSales = await prisma.sale.findMany({
    where: { 
      businessId: business.id, 
      createdAt: { gte: currentStartUTC, lte: nowUTC } 
    },
    select: { createdAt: true, totalAmount: true }
  })

  const previousSales = await prisma.sale.findMany({
    where: { 
      businessId: business.id, 
      createdAt: { gte: prevStartUTC, lte: prevEndUTC } 
    },
    select: { createdAt: true, totalAmount: true }
  })

  const { calculateSalesTimeAnalysis } = await import("@/lib/engines/salesTimeEngine")
  const result = calculateSalesTimeAnalysis(tz, currentSales as any, previousSales as any)

  return { success: true, result }
}
