import { NextRequest, NextResponse } from "next/server"
import { getBranches, createBranch, updateBranch, deleteBranch, saveBranchesBatch, getTenantBusinessId } from "@/lib/interlockingDb"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    const businessId = await getTenantBusinessId(session)
    const branches = await getBranches(businessId)
    return NextResponse.json(branches)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Hanya Owner yang dapat mengubah data cabang" }, { status: 403 })
    }

    const businessId = await getTenantBusinessId(session)
    const body = await req.json()
    const { id, name, location, deviceId } = body

    if (!id) {
      return NextResponse.json({ error: "ID Cabang wajib disertakan" }, { status: 400 })
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama cabang wajib diisi" }, { status: 400 })
    }

    const updated = await updateBranch(
      id,
      {
        name: name.trim(),
        location: (location || "").trim(),
        deviceId: deviceId?.trim(),
      },
      businessId
    )

    if (!updated) {
      return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ success: true, branch: updated })
  } catch (error: any) {
    console.error("Error updating branch:", error)
    return NextResponse.json({ error: error.message || "Gagal memperbarui cabang" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businessId = await getTenantBusinessId(session)
    const body = await req.json()

    // Support batch branches auto-heal / sync
    if (Array.isArray(body.branches)) {
      const synced = await saveBranchesBatch(body.branches, businessId)
      return NextResponse.json({ success: true, branches: synced })
    }

    const { id, name, location, deviceId } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama cabang wajib diisi" }, { status: 400 })
    }

    const branch = await createBranch({
      id: id?.trim(),
      businessId,
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

    const businessId = await getTenantBusinessId(session)
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID Cabang wajib disertakan" }, { status: 400 })
    }

    const success = await deleteBranch(id, businessId)
    if (!success) {
      return NextResponse.json({ error: "Cabang utama tidak dapat dihapus jika hanya tersisa 1 cabang" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Cabang berhasil dihapus" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
