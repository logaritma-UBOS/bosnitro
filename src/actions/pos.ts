"use server"
import { formatNumber, formatRupiah } from '@/lib/format';

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/auditLogger"
import { trackEvent, logError } from "@/actions/analytics"
import { calculateCustomerSegment } from "@/lib/marketing"

type CartItem = {
  productId: string
  quantity: number
  price: number
}

export async function checkoutSale(cart: CartItem[], clientTransactionId: string, paymentMethod: string = "CASH", paidAmount: number = 0, customerId?: string, promoCode?: string, campaignId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    
    const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
    if (!business) return { error: "Business not found" }

    const validPaymentMethods = ["CASH", "QRIS", "TRANSFER", "DEBIT_CREDIT"]
    if (!validPaymentMethods.includes(paymentMethod)) return { error: "Metode pembayaran tidak valid" }

    // Prevent duplicate via clientTransactionId (Offline-First preparation)
    const existing = await prisma.sale.findUnique({ where: { clientTransactionId } })
    if (existing) return { success: true }

    // SECURITY: Verifikasi kepemilikan produk dalam keranjang
    const productIds = cart.map(c => c.productId)
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, businessId: business.id } })
    if (products.length !== productIds.length) return { error: "Terjadi kesalahan: Produk tidak valid." }
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))

    let serverTotal = 0;
    const itemsToCreate = cart.map(c => {
      const p = productMap[c.productId];
      serverTotal += (p.sellPrice * c.quantity);
      return {
        businessId: business.id,
        productId: c.productId,
        quantity: c.quantity,
        priceAtSale: p.sellPrice, // Zero-trust: ambil dari DB
        hppAtSale: p.calculatedHpp || 0 // Zero-trust: ambil dari DB
      };
    });

    // PROMO VALIDATION
    let promoDiscount = 0;
    let promoId = null;

    
      if (promoCode) {
        const promo = await prisma.promo.findUnique({
          where: { businessId_code: { businessId: business.id, code: promoCode } }
        })
  
        if (!promo) return { error: "Kode promo tidak ditemukan" }
        if (!promo.isActive) return { error: "Promo sudah tidak aktif" }
        
        const now = new Date()
        if (promo.startAt && promo.startAt > now) return { error: "Periode promo belum dimulai" }
        if (promo.endAt && promo.endAt < now) return { error: "Periode promo sudah berakhir" }
        
        if (promo.minimumPurchase && serverTotal < promo.minimumPurchase) {
          return { error: `Minimal pembelian Rp ${promo.minimumPurchase.toLocaleString('id-ID')} untuk menggunakan promo ini` }
        }
        
        if (promo.maxUsage && promo.usageCount >= promo.maxUsage) {
          return { error: "Kuota promo sudah habis" }
        }

        // SEGMENT VALIDATION
        if (promo.targetSegment && promo.targetSegment !== "SEMUA") {
          if (!customerId) {
            return { error: `Promo ini khusus pelanggan segmen: ${promo.targetSegment.replace(/_/g, " ")}. Pilih nama pelanggan.` }
          }
          const cust = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { sales: true }
          })
          if (!cust) return { error: "Pelanggan tidak valid" }
          
          const segment = calculateCustomerSegment(cust.sales).marketingSegment;
          if (segment !== promo.targetSegment) {
            return { error: `Promo ini khusus segmen ${promo.targetSegment.replace(/_/g, " ")}. Status pelanggan ini: ${segment.replace(/_/g, " ")}` }
          }
        }
  
        if (promo.discountType === "FIXED") {
          promoDiscount = promo.discountValue;
        } else if (promo.discountType === "PERCENTAGE") {
          promoDiscount = (serverTotal * promo.discountValue) / 100;
        }
        
        // Jangan sampai total minus
        if (promoDiscount > serverTotal) promoDiscount = serverTotal;
        promoId = promo.id;

        // Auto-assign campaignId if not provided, but promo belongs to an active campaign
        if (!campaignId) {
            const activeCampaign = await prisma.campaign.findFirst({
                where: { promoId: promo.id, businessId: business.id, status: { in: ['SIAP_DIKIRIM', 'TERKIRIM'] } },
                orderBy: { createdAt: 'desc' }
            });
            if (activeCampaign) {
                campaignId = activeCampaign.id;
            }
        }
      }

      const finalTotal = serverTotal - promoDiscount;

    if (paymentMethod === "CASH" && paidAmount < finalTotal) {
      return { error: "Uang tunai kurang dari total belanja" }
    }

    let cashReceived = null;
    let changeAmount = null;
    if (paymentMethod === "CASH") {
      cashReceived = paidAmount;
      changeAmount = paidAmount - finalTotal;
    }

    const d = new Date()
    const dateStr = d.toISOString().split("T")[0].replace(/-/g, "")
    const randomStr = crypto.randomUUID().split("-")[0].toUpperCase()
    const receiptNumber = `INV-${dateStr}-${randomStr}`

    await prisma.$transaction(async (tx) => {
      // 1. Catat Penjualan
      await tx.sale.create({
        data: {
          businessId: business.id,
          clientTransactionId,
          receiptNumber,
          totalAmount: finalTotal, // Zero-trust: kalkulasi server setelah diskon
          discount: promoDiscount,
          paymentMethod,
          cashReceived,
          changeAmount,
          customerId: customerId || null,
          promoId: promoId || null,
          campaignId: campaignId || null,
          saleItems: {
            create: itemsToCreate
          }
        }
      })

      // Jika pakai promo, increment usageCount
      if (promoId) {
        await tx.promo.update({
          where: { id: promoId },
          data: { usageCount: { increment: 1 } }
        })
      }

        // Update Customer Intelligence
        if (customerId) {
          const cust = await tx.customer.findUnique({
            where: { id: customerId },
            include: { sales: true }
          });
          
          if (cust) {
            // Include current sale for calculation
            const allSalesForSegment: { totalAmount: number, createdAt: Date }[] = [...cust.sales, { totalAmount: finalTotal, createdAt: new Date() }];
            const segmentInfo = calculateCustomerSegment(allSalesForSegment);
            
            await tx.customer.update({
              where: { id: customerId },
              data: {
                totalPurchases: { increment: 1 },
                lastPurchaseDate: new Date(),
                category: segmentInfo.marketingSegment
              }
            });
          }
        }


      // 2. Data Chain: Kurangi Stok Berdasarkan Perilaku Item (BOM vs RETAIL)
      for (const item of cart) {
        const p = productMap[item.productId];
        
        // Jika BOM (F&B / Hybrid): Kurangi stok bahan baku (ingredient)
        if (p.hasBOM) {
          const recipes = await tx.recipe.findMany({ where: { productId: item.productId } })
          for (const r of recipes) {
            const qtyToReduce = r.quantityNeeded * item.quantity
            
            // Kurangi saldo tabel Ingredient
            await tx.ingredient.update({
              where: { id: r.ingredientId },
              data: { currentStock: { decrement: qtyToReduce } }
            })
            
            // Catat di StockMovement untuk Ingredient
            await tx.stockMovement.create({
              data: {
                businessId: business.id,
                ingredientId: r.ingredientId,
                type: "OUT",
                quantity: -qtyToReduce,
                referenceType: "SALE",
                referenceId: clientTransactionId
              }
            })
          }
        } 
        
        // Jika RETAIL: Kurangi stok produk jadi itu sendiri via StockMovement
        if (!p.hasBOM && p.trackInventory) {
          await tx.stockMovement.create({
            data: {
              businessId: business.id,
              productId: p.id,
              type: "OUT",
              quantity: -item.quantity,
              referenceType: "SALE",
              referenceId: clientTransactionId
            }
          })
        }
      }
    })
    
    await logAudit(business.id, "SALE_CREATED", "Sale", { clientTransactionId, totalAmount: finalTotal, items: cart.length, paymentMethod })

    // 3. Analytics Tracking (Non-blocking)
    trackEvent(business.id, "pos_transaction_completed", { totalAmount: finalTotal, itemCount: cart.length, offline: false }).catch(() => {})

    revalidatePath("/")
    revalidatePath("/katalog")
    return { success: true, serverTotal: finalTotal, change: paymentMethod === "CASH" ? paidAmount - finalTotal : 0 }
    
  } catch (e: any) {
    console.error(e)
    logError("POS_CHECKOUT_ERROR", e.message, undefined, e.stack, "/kasir").catch(() => {})
    return { error: e.message }
  }
}

