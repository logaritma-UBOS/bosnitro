export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getStoreSettings } from "@/lib/interlockingDb"
import { DEFAULT_TELEGRAM_RECIPIENT, setActiveTelegramRecipient, setActiveTelegramChatId } from "@/lib/telegram"
import StoreSettingsClient from "./StoreSettingsClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pengaturan Toko & Profil - UBOS",
  description: "Kelola nama toko, foto profil, nomor Telegram, dan cabang gerai",
}

export default async function StoreSettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.role !== "OWNER") {
    redirect("/kasir")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, image: true }
  })

  const whereClause = (session.user as any).staffBusinessId 
    ? { id: (session.user as any).staffBusinessId } 
    : { userId: session.user.id }
  
  const business = await prisma.business.findFirst({ where: whereClause })

  const runtime = await getStoreSettings()

  const sysSettings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: ["store_name", "store_telegram_phone", "store_telegram_chat_id", "store_telegram_bot_token", "store_profile_image"]
      }
    }
  }).catch(() => [])
  const sysMap = Object.fromEntries(sysSettings.map(s => [s.key, s.value]))

  const storeName = sysMap["store_name"] || business?.name || runtime.storeName || "MERUVIN"
  const profileImage = user?.image || sysMap["store_profile_image"] || runtime.profileImage || null
  const telegramPhone = sysMap["store_telegram_phone"] || user?.phone?.trim() || runtime.telegramPhone || DEFAULT_TELEGRAM_RECIPIENT
  const telegramChatId = sysMap["store_telegram_chat_id"] || runtime.telegramChatId || "-5332437584"
  const telegramBotToken = sysMap["store_telegram_bot_token"] || runtime.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || null

  if (telegramPhone) {
    setActiveTelegramRecipient(telegramPhone)
  }
  if (telegramChatId) {
    setActiveTelegramChatId(telegramChatId)
  }

  const initialSettings = {
    storeName,
    profileImage,
    telegramPhone,
    telegramChatId,
    telegramBotToken,
    userEmail: user?.email || "",
    userName: user?.name || "",
  }

  return <StoreSettingsClient initialSettings={initialSettings} />
}
