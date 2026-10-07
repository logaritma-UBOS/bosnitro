import { NextRequest, NextResponse } from "next/server"
import { getProducts } from "@/lib/interlockingDb"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get("branchId") || undefined
    const products = await getProducts(branchId)
    return NextResponse.json({ success: true, products })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memuat katalog produk" }, { status: 500 })
  }
}
