import { NextRequest, NextResponse } from "next/server"
import { sendDailyBranchReportTelegram, generateDailyBranchReportText, getActiveTelegramRecipient, getActiveTelegramChatId } from "@/lib/telegram"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { branchId, recipient, chatId, botToken } = body

    const targetRecipient = recipient?.trim() || getActiveTelegramRecipient()
    const targetChatId = chatId?.trim() || getActiveTelegramChatId() || undefined

    const result = await sendDailyBranchReportTelegram(branchId, targetRecipient, targetChatId, botToken?.trim())

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error in telegram daily report API:", error)
    return NextResponse.json({ error: error.message || "Gagal memproses laporan telegram" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get("branchId") || undefined
    const recipient = searchParams.get("recipient") || getActiveTelegramRecipient()
    const data = await generateDailyBranchReportText(branchId, recipient)
    return NextResponse.json({ success: true, ...data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
