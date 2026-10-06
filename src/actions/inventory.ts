"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addSupplier(data: { name: string; phone?: string; address?: string }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    
    if (!business) return { error: "Business not found" }

    const supplier = await prisma.supplier.create({
      data: {
        businessId: business.id,
        name: data.name,
        phone: data.phone,
        address: data.address
      }
    })

    revalidatePath("/stok", "layout")
    return { success: true, supplier }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function getSuppliers() {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized", data: [] }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    
    if (!business) return { error: "Business not found", data: [] }

    const suppliers = await prisma.supplier.findMany({
      where: { businessId: business.id },
      orderBy: { name: 'asc' }
    })

    return { success: true, data: suppliers }
  } catch (e: any) {
    return { error: e.message, data: [] }
  }
}

export async function recordStockMovement(data: {
  type: "IN" | "OUT" | "RETURN" | "WASTE";
  productId?: string;
  ingredientId?: string;
  quantity: number;
  supplierId?: string;
  notes?: string;
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    
    if (!business) return { error: "Business not found" }

    if (!data.productId && !data.ingredientId) {
      return { error: "Harus memilih Produk atau Bahan" }
    }

    if (data.quantity <= 0) {
      return { error: "Kuantitas harus lebih dari 0" }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create movement
      const movement = await tx.stockMovement.create({
        data: {
          businessId: business.id,
          type: data.type,
          quantity: data.quantity,
          productId: data.productId,
          ingredientId: data.ingredientId,
          supplierId: data.supplierId,
          notes: data.notes,
          referenceType: "ADJUSTMENT"
        }
      })

      // 2. Update actual stock
      if (data.ingredientId) {
        const item = await tx.ingredient.findUnique({ where: { id: data.ingredientId } })
        if (!item) throw new Error("Bahan tidak ditemukan")

        let newStock = item.currentStock
        if (data.type === "IN") {
          newStock += data.quantity
        } else if (data.type === "OUT" || data.type === "RETURN" || data.type === "WASTE") {
          newStock -= data.quantity
          if (newStock < 0) newStock = 0
        }

        await tx.ingredient.update({
          where: { id: data.ingredientId },
          data: { 
             currentStock: newStock,
             ...(data.supplierId && data.type === "IN" ? { supplierId: data.supplierId } : {})
          }
        })
      } else if (data.productId) {
        const item = await tx.product.findUnique({ where: { id: data.productId } })
        if (!item) throw new Error("Barang tidak ditemukan")

        let newStock = item.currentStock
        if (data.type === "IN") {
          newStock += data.quantity
        } else if (data.type === "OUT" || data.type === "RETURN" || data.type === "WASTE") {
          newStock -= data.quantity
          if (newStock < 0) newStock = 0
        }

        await tx.product.update({
          where: { id: data.productId },
          data: { 
             currentStock: newStock,
             ...(data.supplierId && data.type === "IN" ? { supplierId: data.supplierId } : {})
          }
        })
      }

      return movement
    })

    revalidatePath("/stok", "layout")
    revalidatePath("/katalog", "layout")
    return { success: true, data: result }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function recordBulkStockMovement(data: {
  type: "IN" | "OUT" | "RETURN" | "WASTE";
  supplierId?: string;
  notes?: string;
  items: Array<{
    productId?: string;
    ingredientId?: string;
    quantity: number;
  }>
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    
    if (!business) return { error: "Business not found" }
    
    if (!data.items || data.items.length === 0) return { error: "Tidak ada barang yang dipilih" }

    const result = await prisma.$transaction(async (tx) => {
      const movements = []
      
      for (const itemData of data.items) {
        if (itemData.quantity <= 0) continue;
        
        // 1. Create movement
        const movement = await tx.stockMovement.create({
          data: {
            businessId: business.id,
            type: data.type,
            quantity: itemData.quantity,
            productId: itemData.productId,
            ingredientId: itemData.ingredientId,
            supplierId: data.supplierId,
            notes: data.notes,
            referenceType: "ADJUSTMENT"
          }
        })
        movements.push(movement)

        // 2. Update actual stock
        if (itemData.ingredientId) {
          const item = await tx.ingredient.findUnique({ where: { id: itemData.ingredientId } })
          if (!item) throw new Error("Bahan tidak ditemukan")

          let newStock = item.currentStock
          if (data.type === "IN") {
            newStock += itemData.quantity
          } else {
            newStock -= itemData.quantity
          }

          if (newStock < 0) newStock = 0

          await tx.ingredient.update({
            where: { id: item.id },
            data: { 
               currentStock: newStock,
               ...(data.supplierId && data.type === "IN" ? { supplierId: data.supplierId } : {})
            }
          })
        } else if (itemData.productId) {
          const item = await tx.product.findUnique({ where: { id: itemData.productId } })
          if (!item) throw new Error("Barang tidak ditemukan")

          let newStock = item.currentStock
          if (data.type === "IN") {
            newStock += itemData.quantity
          } else {
            newStock -= itemData.quantity
          }

          if (newStock < 0) newStock = 0

          await tx.product.update({
            where: { id: item.id },
            data: { 
               currentStock: newStock,
               ...(data.supplierId && data.type === "IN" ? { supplierId: data.supplierId } : {})
            }
          })
        }
      }
      return movements
    })

    revalidatePath("/stok", "layout")
    revalidatePath("/katalog", "layout")
    return { success: true, result }
  } catch (e: any) {
    return { error: e.message }
  }
}
