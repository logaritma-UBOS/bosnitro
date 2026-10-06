"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { logError, trackEvent } from "@/actions/analytics"

export async function createContentPlan(data: any) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    if (!business) return { error: "Business not found" }

    const plan = await prisma.contentPlan.create({
      data: {
        businessId: business.id,
        title: data.title,
        platform: data.platform,
        status: data.status || "DRAFT",
        cta: data.cta,
        targetUrl: data.targetUrl,
        postDate: data.postDate ? new Date(data.postDate) : null,
        notes: data.notes
      }
    })

    await trackEvent(business.id, "CONTENT_PLAN_CREATED", { planId: plan.id, title: plan.title })
    revalidatePath("/konten")
    return { success: true }
  } catch (e: any) {
    console.error(e)
    logError("CONTENT_PLAN_CREATE_ERROR", e.message).catch(() => {})
    return { error: "Gagal menyimpan rencana konten" }
  }
}

export async function updateContentPlan(id: string, data: any) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    if (!business) return { error: "Business not found" }

    const existing = await prisma.contentPlan.findFirst({
      where: { id, businessId: business.id }
    })
    if (!existing) return { error: "Konten tidak ditemukan" }

    await prisma.contentPlan.update({
      where: { id },
      data: {
        title: data.title,
        platform: data.platform,
        status: data.status,
        cta: data.cta,
        targetUrl: data.targetUrl,
        postDate: data.postDate ? new Date(data.postDate) : null,
        notes: data.notes
      }
    })

    revalidatePath("/konten")
    return { success: true }
  } catch (e: any) {
    console.error(e)
    logError("CONTENT_PLAN_UPDATE_ERROR", e.message).catch(() => {})
    return { error: "Gagal mengupdate rencana konten" }
  }
}

export async function deleteContentPlan(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    if (!business) return { error: "Business not found" }

    const existing = await prisma.contentPlan.findFirst({
      where: { id, businessId: business.id }
    })
    if (!existing) return { error: "Konten tidak ditemukan" }

    await prisma.contentPlan.delete({ where: { id } })

    revalidatePath("/konten")
    return { success: true }
  } catch (e: any) {
    console.error(e)
    logError("CONTENT_PLAN_DELETE_ERROR", e.message).catch(() => {})
    return { error: "Gagal menghapus rencana konten" }
  }
}