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

    const { prisma } = await import("@/lib/prisma")
    const whereClause = (session.user as any).staffBusinessId 
      ? { id: (session.user as any).staffBusinessId } 
      : { userId: session.user.id }
    const business = await prisma.business.findFirst({ where: whereClause })
    const scopeId = business?.id || session.user.id

    let targetRecipient = recipient?.trim()
    let targetChatId = chatId?.trim()
    let targetBotToken = botToken?.trim()

    if (!targetRecipient || !targetChatId || !targetBotToken) {
      const searchKeys = [
        `${scopeId}_store_telegram_phone`,
        `${scopeId}_store_telegram_chat_id`,
        `${scopeId}_store_telegram_bot_token`,
        "store_telegram_phone",
        "store_telegram_chat_id",
        "store_telegram_bot_token",
      ]
      const sysSettings = await prisma.systemSetting.findMany({
        where: { key: { in: searchKeys } }
      }).catch(() => [])
      const sysMap = Object.fromEntries(sysSettings.map(s => [s.key, s.value]))

      if (!targetRecipient) {
        targetRecipient = sysMap[`${scopeId}_store_telegram_phone`] || sysMap["store_telegram_phone"] || getActiveTelegramRecipient()
      }
      if (!targetChatId) {
        targetChatId = sysMap[`${scopeId}_store_telegram_chat_id`] || sysMap["store_telegram_chat_id"] || getActiveTelegramChatId() || undefined
      }
      if (!targetBotToken) {
        targetBotToken = sysMap[`${scopeId}_store_telegram_bot_token`] || sysMap["store_telegram_bot_token"] || process.env.TELEGRAM_BOT_TOKEN
      }
    }

    const result = await sendDailyBranchReportTelegram(branchId, targetRecipient, targetChatId, targetBotToken)

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
