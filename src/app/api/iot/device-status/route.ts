import { NextResponse } from "next/server"
import { getBranches } from "@/lib/interlockingDb"

export async function GET() {
  const branches = await getBranches()
  const devices = branches.map(b => ({
    branchId: b.id,
    branchName: b.name,
    location: b.location,
    deviceId: b.deviceId || `ESP32-${b.id.toUpperCase()}`,
    status: b.status || "ONLINE",
    flowSensorPressure: "115 PSI",
    solenoidValveStatus: "STANDBY",
    lastHeartbeat: new Date().toISOString()
  }))

  return NextResponse.json(devices)
}
