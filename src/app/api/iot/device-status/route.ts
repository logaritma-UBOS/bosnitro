import { NextRequest, NextResponse } from "next/server"
import { getBranches, getTenantBusinessId, recordFraudAlert } from "@/lib/interlockingDb"
import { sendIoTAnomalyAlert } from "@/lib/telegram"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const businessId = await getTenantBusinessId(session)
    const branches = await getBranches(businessId)

    const devices = branches.map((b) => ({
      branchId: b.id,
      branchName: b.name,
      location: b.location,
      deviceId: b.deviceId || `ESP32-${b.name.toUpperCase().replace(/\s+/g, "-")}`,
      status: b.status || "ONLINE",
      flowSensorPressure: b.status === "OFFLINE" ? "0 PSI (OFFLINE)" : "115 PSI",
      solenoidValveStatus: b.status === "OFFLINE" ? "DISCONNECTED" : "STANDBY",
      lastHeartbeat: new Date().toISOString(),
    }))

    return NextResponse.json({ success: true, devices })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const sessionBizId = await getTenantBusinessId(session)
    const body = await req.json().catch(() => ({}))
    const { branchId, deviceId, status, reason, businessId: bodyBizId } = body
    const businessId = sessionBizId || bodyBizId

    const branches = await getBranches(businessId)
    const targetBranch = branches.find((b) => b.id === branchId) || branches[0] || {
      id: branchId || "branch-utama",
      name: "Cabang Outlet",
      location: "Outlet Fisik",
      deviceId: deviceId || "ESP32-CONTROLLER",
    }

    const currentDeviceId = deviceId || targetBranch.deviceId || "ESP32-CONTROLLER"
    const currentStatus = status || "OFFLINE"
    const currentReason =
      reason || "Perangkat ESP32 katup solenoid tidak merespons (Offline / Daya Terputus)"

    if (currentStatus === "OFFLINE" || currentStatus === "ANOMALY") {
      // Dispatch emergency anomaly alert automatically to Telegram group
      await sendIoTAnomalyAlert({
        branchId: targetBranch.id,
        branchName: targetBranch.name,
        deviceId: currentDeviceId,
        status: currentStatus,
        reason: currentReason,
        businessId,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Status IoT cabang "${targetBranch.name}" diproses. Notifikasi anomali terkirim ke Telegram jika offline.`,
      branch: targetBranch.name,
      status: currentStatus,
    })
  } catch (error: any) {
    console.error("Error updating IoT device status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
