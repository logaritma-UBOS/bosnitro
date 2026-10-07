import { NextRequest, NextResponse } from "next/server"
import { saveRetailProduct } from "@/lib/interlockingDb"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role === "KASIR") {
      return NextResponse.json({ error: "Hanya Manager atau Owner yang boleh mengelola barang ritel" }, { status: 403 })
    }

    const body = await req.json()
    const { id, name, barcode, price, costPrice, stock, branchId } = body

    if (!name || price === undefined || costPrice === undefined) {
      return NextResponse.json({ error: "Nama produk, harga jual, dan HPP wajib diisi" }, { status: 400 })
    }

    const saved = await saveRetailProduct({
      id,
      name,
      barcode,
      price: Number(price),
      costPrice: Number(costPrice),
      stock: Number(stock || 0),
      branchId
    })

    return NextResponse.json({ success: true, product: saved })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menyimpan barang ritel" }, { status: 500 })
  }
}
