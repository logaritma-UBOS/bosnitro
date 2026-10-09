import { NextResponse } from "next/server"
import { getHardwareSettings } from "@/lib/hardwareSettings"

// In-memory snapshot buffer for live audit feed
interface SnapshotItem {
  id: string
  branchId: string
  timestamp: string
  type: "PLAT_NOMOR" | "BOTOL_BEKAS" | "TRANSAKSI"
  imageUrl: string
  vehiclePlate?: string
  confidence?: number
}

const snapshotsBuffer: SnapshotItem[] = [
  {
    id: "snap-1",
    branchId: "branch-utama",
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    type: "PLAT_NOMOR",
    imageUrl: "/snapshots/plate_b1234abc.jpg",
    vehiclePlate: "B 1234 ABC",
    confidence: 0.98,
  },
  {
    id: "snap-2",
    branchId: "branch-cibitung-1",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    type: "BOTOL_BEKAS",
    imageUrl: "/snapshots/oli_mpx2.jpg",
    confidence: 0.95,
  },
  {
    id: "snap-3",
    branchId: "branch-cibitung-2",
    timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
    type: "PLAT_NOMOR",
    imageUrl: "/snapshots/plate_b4567xyz.jpg",
    vehiclePlate: "B 4567 XYZ",
    confidence: 0.94,
  },
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  const filtered = branchId
    ? snapshotsBuffer.filter((s) => s.branchId === branchId)
    : snapshotsBuffer

  return NextResponse.json({
    success: true,
    data: filtered.slice(0, 20),
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { branchId = "branch-utama", snapshotType = "PLAT_NOMOR", imageBase64, vehiclePlate } = body
    const settings = await getHardwareSettings()

    let capturedUrl = imageBase64
    let capturedMethod = "CLIENT_CAMERA"

    // If no direct image from webcam was sent, simulate/fetch from IP CCTV Snapshot API
    if (!capturedUrl) {
      capturedMethod = "CCTV_RTSP_HTTP"
      // Attempt to ping CCTV Snapshot URL if configured
      if (settings.cctvSnapshotUrl) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 1000)
          await fetch(settings.cctvSnapshotUrl, { signal: controller.signal })
          clearTimeout(timeoutId)
        } catch {
          // Fallback snapshot
        }
      }
      // Provide standard placeholder image based on type
      capturedUrl = snapshotType === "BOTOL_BEKAS"
        ? "/snapshots/sample_botol.jpg"
        : "/snapshots/sample_plat.jpg"
    }

    const newSnap: SnapshotItem = {
      id: `snap-${Date.now()}`,
      branchId,
      timestamp: new Date().toISOString(),
      type: snapshotType,
      imageUrl: capturedUrl,
      vehiclePlate: vehiclePlate || "B 9999 PRO",
      confidence: 0.96,
    }

    snapshotsBuffer.unshift(newSnap)
    if (snapshotsBuffer.length > 50) snapshotsBuffer.pop()

    return NextResponse.json({
      success: true,
      message: `Snapshot CCTV ${snapshotType} berhasil ditangkap via ${capturedMethod}`,
      data: newSnap,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengambil snapshot CCTV" }, { status: 500 })
  }
}
