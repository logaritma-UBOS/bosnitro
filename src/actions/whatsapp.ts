"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getWaStatus() {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    if (!business) return { success: false, error: "Business not found" }

    const setting = await prisma.businessSetting.findUnique({
      where: { businessId: business.id }
    })

    if (!setting || !setting.fonnteToken) {
      return { success: true, status: "DISCONNECTED_NO_TOKEN" }
    }

    const cleanToken = setting.fonnteToken.replace(/[\r\n\s]+/g, "");

    const res = await fetch("https://api.fonnte.com/device", {
      method: "POST",
      headers: {
        "Authorization": cleanToken
      }
    })

    const data = await res.json()


    if (data.status) {
      if (data.device_status === "connect") {
        if (setting.waStatus !== "CONNECTED") {
          await prisma.businessSetting.update({
            where: { businessId: business.id },
            data: { waStatus: "CONNECTED" }
          })
        }
        return { success: true, status: "CONNECTED", device: data.device || data.name }
      } else {
        if (setting.waStatus !== "DISCONNECTED") {
          await prisma.businessSetting.update({
            where: { businessId: business.id },
            data: { waStatus: "DISCONNECTED" }
          })
        }
        return { success: true, status: "DISCONNECTED", qr: data.qr_string || data.qr }
      }
    } else {
      return { success: true, status: "INVALID_TOKEN", error: data.reason }
    }
  } catch (error: any) {
      console.error("WA Status Error:", error)
      return { success: false, error: error.message || "Failed to connect to WA gateway" }
    }
}

export async function saveActivationCode(code: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    
    if (!business) return { error: "Business not found" }

    const cleanCode = code.replace(/[\r\n\s]+/g, "");

    await prisma.businessSetting.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        fonnteToken: cleanCode,
        waStatus: "DISCONNECTED"
      },
      update: {
        fonnteToken: cleanCode,
        waStatus: "DISCONNECTED"
      }
    })
    
    revalidatePath("/pengaturan/whatsapp")
    return { success: true }
  } catch (e) {
    return { error: "Gagal menyimpan kode aktivasi" }
  }
}

export async function disconnectWa() {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    if (!business) return { error: "Business not found" }
    
    const setting = await prisma.businessSetting.findUnique({
      where: { businessId: business.id }
    })
    
    if (setting?.fonnteToken) {
      try {
         await fetch("https://api.fonnte.com/disconnect", {
           method: "POST",
           headers: { "Authorization": setting.fonnteToken }
         })
      } catch (e) {
         console.error("Fonnte disconnect API error", e)
      }
    }

    await prisma.businessSetting.update({
      where: { businessId: business.id },
      data: { waStatus: "DISCONNECTED", fonnteToken: null }
    })

    revalidatePath("/pengaturan/whatsapp")
    return { success: true }
  } catch (e) {
    return { error: "Gagal memutuskan koneksi" }
  }
}


