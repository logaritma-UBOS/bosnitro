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

    const runtime = await getStoreSettings()

    const storeName = business?.name || runtime.storeName || "Toko meruvin"
    const profileImage = user?.image || runtime.profileImage || null
    // Inisialisasi nomor telegram dari nomor telepon akun saat registrasi, atau fallback
    const telegramPhone = user?.phone?.trim() || runtime.telegramPhone || DEFAULT_TELEGRAM_RECIPIENT
    const telegramChatId = runtime.telegramChatId || null

    // Pastikan sinkronisasi telegram runtime
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
    const { storeName, profileImage, telegramPhone, telegramChatId } = body

    if (!storeName || !storeName.trim()) {
      return NextResponse.json({ error: "Nama toko wajib diisi" }, { status: 400 })
    }

    const cleanStoreName = storeName.trim()
    const cleanTelegramPhone = (telegramPhone || "").trim()
    const cleanTelegramChatId = (telegramChatId || "").trim() || null

    // 1. Update User (phone & image)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(profileImage !== undefined ? { image: profileImage } : {}),
        ...(cleanTelegramPhone ? { phone: cleanTelegramPhone } : {})
      }
    }).catch(e => console.warn("Failed updating user in prisma:", e))

    // 2. Update Business (name)
    const whereClause = (session.user as any).staffBusinessId 
      ? { id: (session.user as any).staffBusinessId } 
      : { userId: session.user.id }
    
    const business = await prisma.business.findFirst({ where: whereClause })
    if (business) {
      await prisma.business.update({
        where: { id: business.id },
        data: { name: cleanStoreName }
      }).catch(e => console.warn("Failed updating business name:", e))
    }

    // 3. Update runtime store settings
    await updateStoreSettings({
      storeName: cleanStoreName,
      profileImage: profileImage !== undefined ? profileImage : undefined,
      telegramPhone: cleanTelegramPhone || undefined,
      telegramChatId: cleanTelegramChatId,
    })

    // 4. Sinkronisasi langsung ke active telegram recipient & chat id
    if (cleanTelegramPhone) {
      setActiveTelegramRecipient(cleanTelegramPhone)
    }
    setActiveTelegramChatId(cleanTelegramChatId)

    return NextResponse.json({
      success: true,
      message: "Pengaturan toko dan integrasi Telegram berhasil diperbarui!",
      data: {
        storeName: cleanStoreName,
        profileImage,
        telegramPhone: cleanTelegramPhone,
        telegramChatId: cleanTelegramChatId,
      }
    })
  } catch (error: any) {
    console.error("Error updating store settings:", error)
    return NextResponse.json({ error: error.message || "Gagal menyimpan pengaturan" }, { status: 500 })
  }
}
