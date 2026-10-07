import { NextRequest, NextResponse } from "next/server"
import { uploadImage } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File foto tidak ditemukan" }, { status: 400 })
    }

    // Try Cloudinary upload
    try {
      const uploaded = await uploadImage(file)
      if (uploaded?.secure_url) {
        return NextResponse.json({ url: uploaded.secure_url })
      }
    } catch (e) {
      console.warn("Cloudinary direct upload failed, fallback to data url:", e)
    }

    // Fallback: Convert to data URL for reliable offline/local testing
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${base64}`

    return NextResponse.json({ url: dataUrl })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Gagal mengunggah foto" }, { status: 500 })
  }
}
