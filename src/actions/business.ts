"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { uploadImage } from "@/lib/cloudinary"

export async function createBusiness(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const businessType = formData.get("businessType") as string
  const operatingDays = parseInt(formData.get("operatingDays") as string) || 7
  const targetOmzet = parseFloat(formData.get("targetOmzet") as string) || 0
  
  const productName = formData.get("productName") as string
  const sellPrice = parseFloat(formData.get("sellPrice") as string) || 0
  const purchaseCost = parseFloat(formData.get("purchaseCost") as string) || 0

  if (!name || !businessType) return { error: "Nama dan Jenis Usaha wajib diisi" }

  // Process image
  const image = formData.get("image") as File | null
  let imageUrl = null
  let imagePublicId = null
  
  if (image && image.size > 0) {
    if (image.size > 5 * 1024 * 1024) return { error: "Ukuran foto maksimal 5MB" }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
      return { error: "Format foto harus JPG, PNG, atau WebP" }
    }
    
    const uploaded = await uploadImage(image)
    if (uploaded) {
      imageUrl = uploaded.secure_url
      imagePublicId = uploaded.public_id
    }
  }

  await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        userId: session.user.id,
        name,
        businessType,
        operatingDays,
        settings: {
          create: { baseCurrency: "IDR" }
        },
        goals: {
          create: {
            targetOmzet,
            period: "MONTHLY"
          }
        }
      }
    })

    if (productName && sellPrice) {
      const calculatedMargin = sellPrice > 0 ? ((sellPrice - purchaseCost) / sellPrice) * 100 : 0
      
      await tx.product.create({
        data: {
          businessId: business.id,
          name: productName,
          sellPrice,
          calculatedHpp: purchaseCost,
          calculatedMargin,
          imageUrl,
          imagePublicId,
          trackInventory: true,
          isPurchasable: true
        }
      })
    }
  })

  redirect("/")
}
