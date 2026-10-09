import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateStoreSettings, getStoreSettings } from "@/lib/interlockingDb"
import { setActiveTelegramRecipient, setActiveTelegramChatId, DEFAULT_TELEGRAM_RECIPIENT } from "@/lib/telegram"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Query Prisma SystemSetting scoped specifically for this business/user
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
    const telegramPhone = sysMap[`${scopeId}_store_telegram_phone`] || user?.phone?.trim() || (isMeruvinLegacy ? (sysMap["store_telegram_phone"] || "083153598697") : (user?.phone?.trim() || ""))
    const telegramChatId = sysMap[`${scopeId}_store_telegram_chat_id`] || (isMeruvinLegacy ? (sysMap["store_telegram_chat_id"] || "-5332437584") : null)
    const telegramBotToken = sysMap[`${scopeId}_store_telegram_bot_token`] || (isMeruvinLegacy ? (sysMap["store_telegram_bot_token"] || process.env.TELEGRAM_BOT_TOKEN) : null) || null

    if (telegramPhone) {
      setActiveTelegramRecipient(telegramPhone)
    }
    if (telegramChatId) {
      setActiveTelegramChatId(telegramChatId)
    }

    return NextResponse.json({
      storeName,
      profileImage,
      telegramPhone,
      telegramChatId,
      telegramBotToken,
      userId: session.user.id,
      businessId: scopeId,
      userEmail: user?.email || "",
      userName: user?.name || "",
    })
  } catch (error: any) {
    console.error("Error fetching store settings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { storeName, profileImage, telegramPhone, telegramChatId, telegramBotToken } = body

    if (!storeName || !storeName.trim()) {
      return NextResponse.json({ error: "Nama toko wajib diisi" }, { status: 400 })
    }

    const cleanStoreName = storeName.trim()
    const cleanTelegramPhone = (telegramPhone || "").trim()
    const cleanTelegramChatId = (telegramChatId || "").trim() || null
    const cleanTelegramBotToken = (telegramBotToken || "").trim() || null

    // 1. Update User (phone & image) strictly for THIS logged-in user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(profileImage !== undefined ? { image: profileImage } : {}),
        ...(cleanTelegramPhone ? { phone: cleanTelegramPhone } : {})
      }
    }).catch(e => console.warn("Failed updating user in prisma:", e))

    // 2. Update Business (name) strictly for THIS user's business
    const whereClause = (session.user as any).staffBusinessId 
      ? { id: (session.user as any).staffBusinessId } 
      : { userId: session.user.id }
    
    const business = await prisma.business.findFirst({ where: whereClause })
    const scopeId = business?.id || session.user.id

    if (business) {
      await prisma.business.update({
        where: { id: business.id },
        data: { name: cleanStoreName }
      }).catch(e => console.warn("Failed updating business name:", e))
    }

    // 3. Update runtime store settings & Prisma SystemSetting scoped to THIS account
    await updateStoreSettings({
      storeName: cleanStoreName,
      profileImage: profileImage !== undefined ? profileImage : undefined,
      telegramPhone: cleanTelegramPhone || undefined,
      telegramChatId: cleanTelegramChatId,
      telegramBotToken: cleanTelegramBotToken,
    }, scopeId)

    // 4. Sinkronisasi active telegram recipient & chat id
    if (cleanTelegramPhone) {
      setActiveTelegramRecipient(cleanTelegramPhone)
    }
    setActiveTelegramChatId(cleanTelegramChatId)

    return NextResponse.json({
      success: true,
      message: "Pengaturan profil toko dan integrasi Telegram berhasil disimpan & disinkronkan!",
      data: {
        storeName: cleanStoreName,
        profileImage,
        telegramPhone: cleanTelegramPhone,
        telegramChatId: cleanTelegramChatId,
        telegramBotToken: cleanTelegramBotToken,
        userId: session.user.id,
        businessId: scopeId,
      }
    })
  } catch (error: any) {
    console.error("Error updating store settings:", error)
    return NextResponse.json({ error: error.message || "Gagal menyimpan pengaturan" }, { status: 500 })
  }
}
