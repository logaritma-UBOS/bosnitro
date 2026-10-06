"use server"
import { formatNumber, formatRupiah } from '@/lib/format';

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { calculateCustomerSegment } from "@/lib/marketing"

export async function getPromos() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) return { error: "Business not found" }

  const promos = await prisma.promo.findMany({
    where: { businessId: business.id },
    orderBy: { startAt: "desc" }
  })

  return { success: true, promos }
}

export async function createPromo(data: any) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    
    const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
    if (!business) return { error: "Business not found" }

    const existing = await prisma.promo.findUnique({
      where: { businessId_code: { businessId: business.id, code: data.code } }
    })
    
    if (existing) return { error: "Kode promo sudah digunakan" }

    const promo = await prisma.promo.create({
      data: {
        businessId: business.id,
        name: data.name,
        code: data.code,
        discountType: data.discountType,
        discountValue: parseFloat(data.discountValue),
        minimumPurchase: data.minimumPurchase ? parseFloat(data.minimumPurchase) : null,
        startAt: data.startAt ? new Date(data.startAt) : null,
        endAt: data.endAt ? new Date(data.endAt) : null,
        maxUsage: data.maxUsage ? parseInt(data.maxUsage, 10) : null,
        targetSegment: data.targetSegment || null,
        isActive: true
      }
    })

    return { success: true, promo }
  } catch (e: any) {
    console.error(e)
    return { error: "Terjadi kesalahan saat menyimpan promo" }
  }
}

export async function togglePromoActive(promoId: string, isActive: boolean) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    
    const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
    if (!business) return { error: "Business not found" }

    // SECURITY: Verify ownership before update
    const promo = await prisma.promo.findFirst({
      where: { id: promoId, businessId: business.id }
    })
    if (!promo) return { error: "Promo tidak ditemukan" }

    await prisma.promo.update({
      where: { id: promoId },
      data: { isActive }
    })

    return { success: true }
  } catch (e) {
    return { error: "Gagal mengubah status promo" }
  }
}

export async function validatePromoCode(promoCode: string, serverTotal: number, customerId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    
    const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
    if (!business) return { error: "Business not found" }

    const promo = await prisma.promo.findUnique({
      where: { businessId_code: { businessId: business.id, code: promoCode } }
    })

    if (!promo) return { error: "Kode promo tidak ditemukan" }
    if (!promo.isActive) return { error: "Promo sudah tidak aktif" }
    
    const now = new Date()
    if (promo.startAt && promo.startAt > now) return { error: "Periode promo belum dimulai" }
    if (promo.endAt && promo.endAt < now) return { error: "Periode promo sudah berakhir" }
    
    if (promo.minimumPurchase && serverTotal < promo.minimumPurchase) {
      return { error: "Minimum belanja untuk promo ini adalah " + formatRupiah(promo.minimumPurchase) }
    }
    if (promo.maxUsage && promo.usageCount >= promo.maxUsage) {
      return { error: "Batas penggunaan promo sudah habis" }
    }

    if (promo.targetSegment) {
      if (!customerId) return { error: "Promo ini khusus untuk pelanggan " + promo.targetSegment }
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, businessId: business.id },
        include: { sales: { orderBy: { createdAt: "asc" } } }
      })
      if (!customer) return { error: "Pelanggan tidak valid" }
      
      const segmentInfo = calculateCustomerSegment(customer.sales)
      if (segmentInfo.marketingSegment !== promo.targetSegment) {
        return { error: `Promo ini khusus untuk segment ${promo.targetSegment}` }
      }
    }

    // Hitung diskon promo
    let promoDiscount = 0;
    if (promo.discountType === "PERCENTAGE") {
      promoDiscount = serverTotal * (promo.discountValue / 100);
    } else {
      promoDiscount = promo.discountValue;
    }
    
    if (promoDiscount > serverTotal) promoDiscount = serverTotal;

    return { success: true, discountAmount: promoDiscount, promo }
  } catch (e: any) {
    console.error("validatePromoCode error:", e?.message)
    return { error: "Gagal memvalidasi promo" }
  }
}