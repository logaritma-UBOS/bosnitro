import { NextResponse } from "next/server"
import { getHardwareSettings } from "@/lib/hardwareSettings"
import { getTransactions } from "@/lib/interlockingDb"
import { Analytics30Days, InterlockingTransaction } from "@/types/branch"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get("branchId") // optional filter for specific branch or all
    const settings = await getHardwareSettings()

    const targetDailyOmzet = settings.targetDailyOmzet || 2500000
    const rewardBonusPool = settings.rewardBonusPool || 2000000
    const rewardCriteria = settings.rewardCriteria || "DAILY_AVG_TARGET"

    // Retrieve all transactions
    const allTrx: InterlockingTransaction[] = await getTransactions()
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Filter for the last 30 days and optional branch
    const filteredTrx = allTrx.filter((t: InterlockingTransaction) => {
      const trxDate = new Date(t.createdAt)
      const isWithin30Days = trxDate >= thirtyDaysAgo && trxDate <= now
      const matchesBranch = !branchId || branchId === "ALL" || t.branchId === branchId
      return isWithin30Days && matchesBranch
    })

    // Group daily revenue
    const dailyMap: Record<string, { totalOmzet: number; count: number; nitrogenCount: number; oilCount: number }> = {}

    // Pre-populate all 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateKey = d.toISOString().split("T")[0]
      dailyMap[dateKey] = {
        totalOmzet: 0,
        count: 0,
        nitrogenCount: 0,
        oilCount: 0,
      }
    }

    filteredTrx.forEach((t: InterlockingTransaction) => {
      const dateKey = new Date(t.createdAt).toISOString().split("T")[0]
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].totalOmzet += t.totalAmount
        dailyMap[dateKey].count += 1
        t.items.forEach((item: any) => {
          if (item.category === "NITROGEN") {
            dailyMap[dateKey].nitrogenCount += item.quantity || 1
          } else if (item.category === "RETAIL" || item.category === "LAYANAN_LAINNYA") {
            dailyMap[dateKey].oilCount += item.quantity || 1
          }
        })
      }
    })

    const dailyBreakdown = Object.entries(dailyMap).map(([date, val]) => ({
      date,
      totalOmzet: val.totalOmzet,
      transactionCount: val.count,
      nitrogenCount: val.nitrogenCount,
      oilCount: val.oilCount,
      targetReached: val.totalOmzet >= targetDailyOmzet,
    }))

    const totalOmzet30Days = dailyBreakdown.reduce((acc, curr) => acc + curr.totalOmzet, 0)
    const totalTransactions30Days = dailyBreakdown.reduce((acc, curr) => acc + curr.transactionCount, 0)
    const actualDailyAverage = Math.round(totalOmzet30Days / 30)

    const daysTargetAchieved = dailyBreakdown.filter((d) => d.targetReached).length
    const isRewardUnlocked = actualDailyAverage >= targetDailyOmzet
    const achievementPercentage = Math.round((actualDailyAverage / targetDailyOmzet) * 100)

    const analytics: Analytics30Days = {
      period: "30 Hari Terakhir",
      totalRevenue30Days: totalOmzet30Days,
      totalOmzet30Days,
      totalTransactions30Days,
      targetDailyAverage: targetDailyOmzet,
      targetDailyOmzet,
      actualDailyAverage,
      isRewardAchieved: isRewardUnlocked,
      isRewardUnlocked,
      achievementPercentage,
      rewardBonusPool,
      rewardCriteria,
      daysTargetAchieved,
      dailyBreakdown,
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghitung analitik 30 hari" }, { status: 500 })
  }
}
