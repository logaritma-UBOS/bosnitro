import { NextResponse } from "next/server"
import { getHardwareSettings, updateHardwareSettings } from "@/lib/hardwareSettings"

export async function GET() {
  const settings = await getHardwareSettings()
  return NextResponse.json(settings)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const updated = await updateHardwareSettings(body)
    return NextResponse.json({ success: true, settings: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan pengaturan hardware" }, { status: 500 })
  }
}
