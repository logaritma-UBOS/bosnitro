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
  const scopeId = business?.id || session.user.id

  const runtime = await getStoreSettings(scopeId)

  const searchKeys = [
    `${scopeId}_store_name`,
    `${scopeId}_store_telegram_phone`,
    `${scopeId}_store_telegram_chat_id`,
    `${scopeId}_store_telegram_bot_token`,
    `${scopeId}_store_profile_image`,
    "store_name",
    "store_telegram_phone",
    "store_telegram_chat_id",
    "store_telegram_bot_token",
    "store_profile_image",
  ]

  const sysSettings = await prisma.systemSetting.findMany({
    where: { key: { in: searchKeys } }
  }).catch(() => [])
  const sysMap = Object.fromEntries(sysSettings.map(s => [s.key, s.value]))

  const isMeruvinLegacy = user?.email === "meruvin@gmail.com" || business?.name?.toLowerCase().includes("meruvin")

  const storeName = sysMap[`${scopeId}_store_name`] || business?.name || (isMeruvinLegacy ? (sysMap["store_name"] || "MERUVIN") : "Toko Saya")
  const profileImage = user?.image || sysMap[`${scopeId}_store_profile_image`] || (isMeruvinLegacy ? sysMap["store_profile_image"] : null)
  const telegramPhone = sysMap[`${scopeId}_store_telegram_phone`] || sysMap["store_telegram_phone"] || user?.phone?.trim() || runtime.telegramPhone || (isMeruvinLegacy ? "083153598697" : "")
  const telegramChatId = sysMap[`${scopeId}_store_telegram_chat_id`] || sysMap["store_telegram_chat_id"] || runtime.telegramChatId || (isMeruvinLegacy ? "-5332437584" : null)
  const telegramBotToken = sysMap[`${scopeId}_store_telegram_bot_token`] || sysMap["store_telegram_bot_token"] || runtime.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || null

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
    userId: session.user.id,
    businessId: scopeId,
    userEmail: user?.email || "",
    userName: user?.name || "",
  }

  return <StoreSettingsClient initialSettings={initialSettings} />
}
