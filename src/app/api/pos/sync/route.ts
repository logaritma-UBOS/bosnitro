import { NextRequest, NextResponse } from "next/server"
import { saveTransactionsBatch, getTransactions, getTenantBusinessId } from "@/lib/interlockingDb"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businessId = await getTenantBusinessId(session)
    const body = await req.json()
    const { transactions, branchId } = body

    if (Array.isArray(transactions) && transactions.length > 0) {
      await saveTransactionsBatch(transactions, businessId)
    }

    const all = await getTransactions(branchId && branchId !== "ALL" ? branchId : undefined, businessId)

    return NextResponse.json({
      success: true,
      transactions: all,
    })
  } catch (error: any) {
    console.error("Error in pos sync API:", error)
    return NextResponse.json({ error: error.message || "Gagal sinkronisasi transaksi" }, { status: 500 })
  }
}
