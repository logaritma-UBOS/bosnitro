import { NextResponse } from "next/server"
import { DEFAULT_BRANCHES } from "@/types/branch"

export async function GET() {
  const devices = DEFAULT_BRANCHES.map(b => ({
    branchId: b.id,
    branchName: b.name,
    location: b.location,
    status: "ONLINE",
    flowSensorPressure: "115 PSI",
    solenoidValveStatus: "STANDBY",
    lastHeartbeat: new Date().toISOString()
  }))

  return NextResponse.json(devices)
}
