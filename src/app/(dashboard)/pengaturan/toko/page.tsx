export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getStoreSettings } from "@/lib/interlockingDb"
import { DEFAULT_TELEGRAM_RECIPIENT, setActiveTelegramRecipient } from "@/lib/telegram"
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

  const storeName = business?.name || runtime.storeName || "Toko meruvin"
  const profileImage = user?.image || runtime.profileImage || null
  // Inisialisasi awal nomor telegram dari nomor telepon akun pendaftaran (User.phone)
  const telegramPhone = user?.phone?.trim() || runtime.telegramPhone || DEFAULT_TELEGRAM_RECIPIENT

  if (telegramPhone) {
    setActiveTelegramRecipient(telegramPhone)
  }

  const initialSettings = {
    storeName,
    profileImage,
    telegramPhone,
    userEmail: user?.email || "",
    userName: user?.name || "",
  }

  return <StoreSettingsClient initialSettings={initialSettings} />
}
