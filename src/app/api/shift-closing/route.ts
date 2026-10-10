import { NextRequest, NextResponse } from "next/server"
import { recordShiftClosing, getShiftClosings, recordFraudAlert } from "@/lib/interlockingDb"
import { sendDailyBranchReportTelegram, sendTelegramAlert } from "@/lib/telegram"
import { formatRupiah } from "@/lib/format"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { branchId, physicalCash, notes } = body

    if (!branchId || physicalCash === undefined) {
      return NextResponse.json({ error: "Cabang dan jumlah uang fisik wajib diisi" }, { status: 400 })
    }

    const closing = await recordShiftClosing({
      branchId,
      cashierId: session.user.id,
      cashierName: session.user.name || "Budi Kasir",
      physicalCash: Number(physicalCash),
      notes
    })

    // 1. Auto-trigger Telegram report for this branch
    sendDailyBranchReportTelegram(branchId).catch(console.error)

    // 2. Auto-trigger Telegram fraud/discrepancy alert if physical cash doesn't match POS system
    if (closing.discrepancy !== 0) {
      const isDefisit = closing.discrepancy < 0
      const diffFormatted = formatRupiah(Math.abs(closing.discrepancy))
      const alertMsg = `⚠️ <b>PERINGATAN AUDIT KASIR - SELISIH SETORAN UANG (${isDefisit ? "DEFISIT / KURANG SETOR" : "SURPLUS / LEBIH SETOR"})</b>\n\n` +
        `📍 <b>Cabang:</b> ${closing.branchName}\n` +
        `👤 <b>Kasir:</b> ${closing.cashierName}\n` +
        `💵 <b>Uang Fisik Dihitung:</b> ${formatRupiah(closing.physicalCash)}\n` +
        `💻 <b>Total Transaksi POS:</b> ${formatRupiah(closing.systemRevenue)}\n` +
        `🚨 <b>Selisih Kasir:</b> ${isDefisit ? `- ${diffFormatted} (Uang Fisik Kurang!)` : `+ ${diffFormatted} (Uang Fisik Lebih!)`}\n` +
        (closing.notes ? `📝 <b>Catatan Kasir:</b> ${closing.notes}\n` : "") +
        `⏰ <b>Waktu:</b> ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}\n\n` +
        `<i>Peringatan audit otomatis oleh BOSNITRO Anti-Loss System.</i>`

      sendTelegramAlert(alertMsg).catch(console.error)

      // Automatically register in Fraud Alert list for executive monitoring
      recordFraudAlert({
        branchId,
        deviceId: `POS-${closing.cashierId || "CASHIER"}`,
        alertType: "DISCREPANCY",
        message: `Selisih setoran kasir ${closing.cashierName} sebesar ${isDefisit ? "-" : "+"}${diffFormatted}. Fisik: ${formatRupiah(closing.physicalCash)}, Sistem: ${formatRupiah(closing.systemRevenue)}${closing.notes ? ` (Ket: ${closing.notes})` : ""}`
      }).catch(console.error)
    }

    return NextResponse.json({ success: true, closing })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mencatat tutup shift" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get("branchId") || undefined
    const closings = await getShiftClosings(branchId)
    return NextResponse.json(closings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
