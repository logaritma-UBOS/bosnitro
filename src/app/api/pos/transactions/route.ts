import { NextRequest, NextResponse } from "next/server"
import { getTransactions } from "@/lib/interlockingDb"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get("branchId") || undefined

    const transactions = await getTransactions(branchId && branchId !== "ALL" ? branchId : undefined)

    return NextResponse.json({
      success: true,
      transactions,
    })
  } catch (error: any) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: error.message || "Gagal memuat riwayat transaksi" }, { status: 500 })
  }
}
