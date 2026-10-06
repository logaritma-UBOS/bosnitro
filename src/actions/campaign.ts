"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { calculateCustomerSegment } from "@/lib/marketing"
import { trackEvent } from "@/actions/analytics"
import { calculateTierFromRevenues } from "@/lib/mayarSync"

export async function getCampaigns() {
  const session = await auth()
  if (!session?.user?.id) return []

  const business = await prisma.business.findFirst({
    where: { userId: session.user.id }
  })
  if (!business) return []

  const campaigns = await prisma.campaign.findMany({
    where: { businessId: business.id },
    include: {
      contentPlan: true,
      promo: true,
      sales: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const customers = await prisma.customer.findMany({
    where: { businessId: business.id },
    include: { sales: true }
  })
  
  // Calculate segments for all customers to determine campaign target sizes
  const customerSegments = customers.map(c => {
    return {
      id: c.id,
      segment: calculateCustomerSegment(c.sales).marketingSegment
    }
  })

  return campaigns.map(c => {
    // 1. Target Customer size
    const targetCustomers = c.targetSegment === "SEMUA" 
      ? customerSegments.length 
      : customerSegments.filter(cs => cs.segment === c.targetSegment).length;

    // 2. Metrics
    const transactions = c.sales.length;
    const omzet = c.sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const uniqueCustomers = new Set(c.sales.filter(s => s.customerId).map(s => s.customerId)).size;
    
    return {
      ...c,
      metrics: {
        targetCustomers,
        transactions,
        omzet,
        promoUsed: c.sales.filter(s => s.promoId === c.promoId).length,
        uniqueCustomers
      }
    }
  })
}

export async function createCampaign(data: any) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    if (!business) return { error: "Business not found" }

    const campaign = await prisma.campaign.create({
      data: {
        businessId: business.id,
        name: data.name,
        contentPlanId: data.contentPlanId || null,
        targetSegment: data.targetSegment || "SEMUA",
        message: data.message || "",
        cta: data.cta || "",
        promoId: data.promoId || null,
        linkUrl: data.linkUrl || "",
        status: data.status || "DRAFT"
      }
    })

    await trackEvent(business.id, "CAMPAIGN_CREATED", { campaignId: campaign.id })
    revalidatePath("/marketing")
    return { success: true }
  } catch (e: any) {
    console.error(e)
    return { error: "Gagal membuat campaign" }
  }
}

export async function updateCampaignStatus(id: string, status: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    
    // If sending blast, try to use WA integration
    if (status === "TERKIRIM") {
      const revenues = await prisma.ubosRevenue.findMany({ where: { userId: session.user.id, status: "PAID" } });
      const tierStatus = calculateTierFromRevenues(session.user.email, revenues);
      const isVip = tierStatus.tier === "Lifetime" || tierStatus.tier === "Pro Tahunan";

      if (!isVip) return { error: "Fitur Kirim WA Blast otomatis ini eksklusif untuk pengguna paket Pro Tahunan & Lifetime." }

      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: { business: { include: { settings: true } } }
      })
      
      if (!campaign) return { error: "Campaign tidak ditemukan" }
      
      const hasWa = campaign.business?.settings?.fonnteToken && campaign.business.settings.waStatus === "CONNECTED";
      if (!hasWa) {
        return { error: "WhatsApp belum terhubung. Silakan integrasi WA di pengaturan terlebih dahulu." }
      }
      
      let customers = await prisma.customer.findMany({
        where: { businessId: campaign.businessId },
        include: { sales: true }
      })
      
      if (campaign.targetSegment !== "SEMUA") {
        customers = customers.filter(c => calculateCustomerSegment(c.sales).marketingSegment === campaign.targetSegment)
      }
      
      const phones = customers.map(c => c.phone).filter(p => p && p.length > 5).join(",")
      
      if (!phones) {
        return { error: `Tidak ada nomor WA valid untuk segmen ${campaign.targetSegment.replace(/_/g, " ")}` }
      }

      try {
        const res = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: { 
            "Authorization": campaign.business.settings?.fonnteToken || "",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: phones,
            message: campaign.message + "\n\n- Dikirim otomatis oleh UBOS"
          })
        })
        const result = await res.json()
        if (!result.status) {
          return { error: "Gagal mengirim via API WA: " + (result.reason || "Token tidak valid") }
        }
      } catch(err) {
        console.error("Fonnte Blast Error:", err)
        return { error: "Terjadi kesalahan jaringan saat mengirim WA Blast." }
      }
    }
    
    await prisma.campaign.update({
      where: { id },
      data: { status, sentAt: status === "TERKIRIM" ? new Date() : undefined }
    })
    revalidatePath("/marketing")
    return { success: true }
  } catch (e: any) {
    console.error(e)
    return { error: "Gagal update status" }
  }
}

