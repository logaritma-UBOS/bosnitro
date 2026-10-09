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

  // Tarik data transaksi masuk dari seluruh cabang di interlockingDb
  const { getTransactions } = await import("@/lib/interlockingDb")
  const allTransactions = await getTransactions("ALL")

  const liveCurrentSales = allTransactions
    .filter(t => {
      const d = new Date(t.createdAt)
      return d >= currentStartUTC && d <= nowUTC && t.status === "COMPLETED"
    })
    .map(t => ({
      id: t.id,
      createdAt: new Date(t.createdAt),
      totalAmount: t.totalAmount,
      saleItems: t.items.map(it => ({
        productId: it.productId,
        product: { name: it.productName },
        quantity: it.quantity,
        priceAtSale: it.price,
        hppAtSale: it.costPrice || 0
      }))
    }))

  const livePrevSales = allTransactions
    .filter(t => {
      const d = new Date(t.createdAt)
      return d >= prevStartUTC && d <= prevEndUTC && t.status === "COMPLETED"
    })
    .map(t => ({
      id: t.id,
      createdAt: new Date(t.createdAt),
      totalAmount: t.totalAmount,
      saleItems: t.items.map(it => ({
        productId: it.productId,
        product: { name: it.productName },
        quantity: it.quantity,
        priceAtSale: it.price,
        hppAtSale: it.costPrice || 0
      }))
    }))

  let dbCurrentSales: any[] = []
  let dbPrevSales: any[] = []
  try {
    dbCurrentSales = await prisma.sale.findMany({
      where: { 
        businessId: business.id, 
        createdAt: { gte: currentStartUTC, lte: nowUTC } 
      },
      select: selectQuery
    })
    dbPrevSales = await prisma.sale.findMany({
      where: { 
        businessId: business.id, 
        createdAt: { gte: prevStartUTC, lte: prevEndUTC } 
      },
      select: selectQuery
    })
  } catch (e) {}

  const mergedCurrentSales = [...dbCurrentSales, ...liveCurrentSales]
  const mergedPreviousSales = [...dbPrevSales, ...livePrevSales]

  const { calculateAOVMarginAnalysis } = await import("@/lib/engines/aovMarginEngine")
  const aovResult = calculateAOVMarginAnalysis(mergedCurrentSales as any, mergedPreviousSales as any, activeDays)

  return { 
    success: true, 
    aovResult, 
    activeDays, 
    timezone: tz,
    currentSalesCount: mergedCurrentSales.length,
    previousSalesCount: mergedPreviousSales.length
  }
}
