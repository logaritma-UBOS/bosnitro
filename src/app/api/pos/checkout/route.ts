import { NextRequest, NextResponse } from "next/server"
import { recordTransaction } from "@/lib/interlockingDb"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const {
      branchId,
      items,
      totalAmount,
      paymentMethod,
      vehiclePhotoUrl,
      usedBottlePhotoUrl
    } = body

    if (!branchId || !items || items.length === 0) {
      return NextResponse.json({ error: "Data transaksi tidak lengkap" }, { status: 400 })
    }

    const tx = await recordTransaction({
      branchId,
      cashierId: session?.user?.id || null,
      cashierName: session?.user?.name || (session?.user?.role === "KASIR" ? "Budi Kasir" : "Kasir Outlet"),
      items,
      totalAmount,
      paymentMethod: paymentMethod || "CASH",
      vehiclePhotoUrl,
      usedBottlePhotoUrl
    })

    return NextResponse.json({ success: true, transaction: tx })
  } catch (error: any) {
    console.error("Error creating interlocking checkout:", error)
    return NextResponse.json({ error: error.message || "Gagal memproses transaksi" }, { status: 500 })
  }
}
