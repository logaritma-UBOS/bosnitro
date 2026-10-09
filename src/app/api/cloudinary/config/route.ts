import { NextResponse } from "next/server"
import { getCloudinaryConfig, setDynamicCloudinaryConfig, uploadImage } from "@/lib/cloudinary"

export async function GET() {
  const config = getCloudinaryConfig()
  return NextResponse.json({
    success: true,
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    hasSecret: !!config.apiSecret,
    hasPreset: !!config.uploadPreset,
    isConfigured: config.isConfigured,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { apiSecret, uploadPreset } = body

    if (apiSecret !== undefined || uploadPreset !== undefined) {
      setDynamicCloudinaryConfig(apiSecret, uploadPreset)
    }

    const config = getCloudinaryConfig()
    return NextResponse.json({
      success: true,
      message: "Konfigurasi Cloudinary berhasil diperbarui",
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      hasSecret: !!config.apiSecret,
      hasPreset: !!config.uploadPreset,
      isConfigured: config.isConfigured,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memperbarui konfigurasi" }, { status: 500 })
  }
}
