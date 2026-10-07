import { NextRequest, NextResponse } from "next/server"
import { recordFraudAlert } from "@/lib/interlockingDb"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { branch_id, device_id, alert_type, message } = body

    if (!branch_id || !device_id || !message) {
      return NextResponse.json({ error: "Parameter branch_id, device_id, dan message wajib diisi" }, { status: 400 })
    }

    const alert = await recordFraudAlert({
      branchId: branch_id,
      deviceId: device_id,
      alertType: alert_type || "UNAUTHORIZED_FLOW",
      message: message
    })

    // Also broadcast over Supabase Realtime channel for live owner dashboard
    const channel = supabase.channel("fraud-alerts-global")
    await channel.send({
      type: "broadcast",
      event: "new-fraud-alert",
      payload: alert
    })

    return NextResponse.json({
      success: true,
      alert
    })
  } catch (error: any) {
    console.error("Error logging fraud alert:", error)
    return NextResponse.json({ error: error.message || "Gagal mencatat alert" }, { status: 500 })
  }
}
