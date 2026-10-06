"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveTokoSettings(data: { storeSlug: string, storeDescription: string, storeActive: boolean, storePhone?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const business = await prisma.business.findFirst({
    where: { userId: session.user.id }
  })
  
  if (!business) throw new Error("Business not found")

  if (data.storeSlug) {
    const existing = await prisma.businessSetting.findFirst({
      where: { storeSlug: data.storeSlug, businessId: { not: business.id } }
    })
    if (existing) {
      throw new Error("Slug (URL) sudah dipakai toko lain.")
    }
  }

  await prisma.businessSetting.upsert({
    where: { businessId: business.id },
    create: {
      businessId: business.id,
      storeSlug: data.storeSlug,
      storeDescription: data.storeDescription,
      storeActive: data.storeActive,
      storePhone: data.storePhone
    },
    update: {
      storeSlug: data.storeSlug,
      storeDescription: data.storeDescription,
      storeActive: data.storeActive,
      storePhone: data.storePhone
    }
  })

  revalidatePath("/toko-online")
  revalidatePath(`/toko/${data.storeSlug}`, "page")
  
  return { success: true }
}

export async function toggleProductStoreVisibility(productId: string, showInStore: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const business = await prisma.business.findFirst({
    where: { userId: session.user.id }
  })
  if (!business) throw new Error("Business not found")

  await prisma.product.update({
    where: { id: productId, businessId: business.id },
    data: { showInStore }
  })
  
  revalidatePath("/katalog")
  return { success: true }
}
