import { NextRequest, NextResponse } from "next/server"
import { updateNitrogenItem } from "@/lib/interlockingDb"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role === "KASIR") {
      return NextResponse.json({ error: "Hanya Manager atau Owner yang boleh mengubah konfigurasi katalog" }, { status: 403 })
    }

    const { id, price, timerSeconds, branchId } = await req.json()
    if (!id || price === undefined || timerSeconds === undefined) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const updated = await updateNitrogenItem(id, Number(price), Number(timerSeconds), branchId)
    return NextResponse.json({ success: true, item: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mengupdate layanan nitrogen" }, { status: 500 })
  }
}
