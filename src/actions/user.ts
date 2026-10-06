"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { uploadImage } from "@/lib/cloudinary"
import { revalidatePath } from "next/cache"

export async function updateUserImage(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const file = formData.get("image") as File
  if (!file) throw new Error("No file provided")

  const uploaded = await uploadImage(file)
  if (!uploaded) throw new Error("Gagal upload ke Cloudinary")

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: uploaded.secure_url }
  })

  revalidatePath("/")
  return { success: true, imageUrl: uploaded.secure_url }
}


export async function getUserProfile() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { businesses: true }
  })
  
  if (!user) return null
  
  return {
    name: user.name || "",
    phone: user.phone || "",
    businessName: user.businesses?.[0]?.name || ""
  }
}

export async function updateUserProfile(data: { name: string, phone: string, businessName: string }) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        name: data.name,
        phone: data.phone 
      },
      include: { businesses: true }
    })
    
    if (user.businesses && user.businesses.length > 0) {
      await prisma.business.update({
        where: { id: user.businesses[0].id },
        data: { name: data.businessName }
      })
    }
    
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data" }
  }
}
