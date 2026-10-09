import { NextResponse } from "next/server"
import { getHardwareSettings, updateHardwareSettings } from "@/lib/hardwareSettings"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  const settings = await getHardwareSettings(branchId)
  return NextResponse.json(settings)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { branchId, ...restSettings } = body
    const updated = await updateHardwareSettings(restSettings, branchId)
    return NextResponse.json({ success: true, settings: updated, branchId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan pengaturan hardware" }, { status: 500 })
  }
}
