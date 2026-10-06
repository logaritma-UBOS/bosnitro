"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { calculateCustomerSegment } from "@/lib/marketing"

export async function quickAddCustomer(name: string, phone: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
    if (!business) return { error: "Business not found" }

    if (phone) {
      const existing = await prisma.customer.findFirst({
        where: { businessId: business.id, phone }
      })
      if (existing) {
        return { error: "Nomor WhatsApp sudah digunakan oleh pelanggan lain" }
      }
    }

    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name,
        phone: phone || null,
        category: "BARU"
      }
    })

    return { success: true, customer }
  } catch (e: any) {
    console.error(e)
    return { error: "Terjadi kesalahan sistem" }
  }
}

export async function getCustomerIntelligence() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
  
    const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause });
    if (!business) return { error: "Business not found" };
  
    const customers = await prisma.customer.findMany({
      where: { businessId: business.id },
      include: {
        sales: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
  
    const intelligence = customers.map(c => {
      const metrics = calculateCustomerSegment(c.sales);
  
      return {
        id: c.id,
        name: c.name,
        phone: c.phone, // TODO: mask for non-owners if needed
        ...metrics
      }
    });
  
    return { success: true, intelligence };
  } catch (e: any) {
    console.error("getCustomerIntelligence error:", e?.message);
    return { error: "Gagal mengambil data pelanggan" };
  }
}
