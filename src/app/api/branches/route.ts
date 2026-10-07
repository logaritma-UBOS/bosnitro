import { NextRequest, NextResponse } from "next/server"
import { getBranches, createBranch, deleteBranch } from "@/lib/interlockingDb"
import { auth } from "@/auth"

export async function GET() {
  try {
    const branches = await getBranches()
    return NextResponse.json(branches)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, location, deviceId } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama cabang wajib diisi" }, { status: 400 })
    }

    const branch = await createBranch({
      name: name.trim(),
      location: (location || "Outlet").trim(),
      deviceId: deviceId?.trim(),
    })

    return NextResponse.json({ success: true, branch })
  } catch (error: any) {
    console.error("Error creating branch:", error)
    return NextResponse.json({ error: error.message || "Gagal membuat cabang" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Hanya Owner yang dapat menghapus cabang" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID Cabang wajib disertakan" }, { status: 400 })
    }

    const success = await deleteBranch(id)
    if (!success) {
      return NextResponse.json({ error: "Cabang utama tidak dapat dihapus jika hanya tersisa 1 cabang" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Cabang berhasil dihapus" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
