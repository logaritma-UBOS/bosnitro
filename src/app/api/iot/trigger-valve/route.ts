import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { branch_id, timer_seconds, transaction_id } = body

    if (!branch_id || !timer_seconds) {
      return NextResponse.json({ error: "Parameter branch_id dan timer_seconds wajib diisi" }, { status: 400 })
    }

    // Broadcast through Supabase Realtime channel for ESP32 hardware listener
    const channelName = `iot-branch-${branch_id}`
    const channel = supabase.channel(channelName)
    
    await channel.send({
      type: "broadcast",
      event: "trigger-solenoid",
      payload: {
        branch_id,
        timer_seconds,
        transaction_id,
        triggered_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Katup Solenoid Cabang ${branch_id} Berhasil Diaktifkan selama ${timer_seconds} detik`,
      branch_id,
      timer_seconds,
      transaction_id
    })
  } catch (error: any) {
    console.error("Error triggering solenoid valve:", error)
    return NextResponse.json({ error: error.message || "Gagal mengaktifkan katup" }, { status: 500 })
  }
}
