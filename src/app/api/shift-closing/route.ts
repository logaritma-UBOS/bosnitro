import { NextRequest, NextResponse } from "next/server"
import { recordShiftClosing, getShiftClosings } from "@/lib/interlockingDb"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { branchId, physicalCash, notes } = body

    if (!branchId || physicalCash === undefined) {
      return NextResponse.json({ error: "Cabang dan jumlah uang fisik wajib diisi" }, { status: 400 })
    }

    const closing = await recordShiftClosing({
      branchId,
      cashierId: session.user.id,
      cashierName: session.user.name || "Budi Kasir",
      physicalCash: Number(physicalCash),
      notes
    })

    return NextResponse.json({ success: true, closing })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mencatat tutup shift" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get("branchId") || undefined
    const closings = await getShiftClosings(branchId)
    return NextResponse.json(closings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
