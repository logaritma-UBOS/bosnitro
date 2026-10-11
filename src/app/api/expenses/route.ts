import { NextRequest, NextResponse } from "next/server"
import { getExpenses, recordExpense, deleteBranchExpense, getTenantBusinessId } from "@/lib/interlockingDb"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const businessId = await getTenantBusinessId(session)
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get("branchId") || undefined

    const expenses = await getExpenses(branchId && branchId !== "ALL" ? branchId : undefined, businessId)

    return NextResponse.json({
      success: true,
      expenses,
    })
  } catch (error: any) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: error.message || "Gagal memuat catatan pengeluaran" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const businessId = await getTenantBusinessId(session)
    const body = await req.json()
    const { branchId, category, amount, description } = body

    if (!branchId || !category || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Cabang, kategori, dan nominal wajib diisi" }, { status: 400 })
    }

    const expense = await recordExpense({
      businessId,
      branchId,
      category,
      amount: Number(amount),
      description: description || "",
    })

    return NextResponse.json({
      success: true,
      expense,
    })
  } catch (error: any) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: error.message || "Gagal mencatat pengeluaran" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID pengeluaran diperlukan" }, { status: 400 })
    }

    await deleteBranchExpense(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: error.message || "Gagal menghapus pengeluaran" }, { status: 500 })
  }
}
