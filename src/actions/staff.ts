"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function getStaffList() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) throw new Error("Business not found")

  // Hanya owner yang boleh melihat list pegawai
  if (session.user.role !== "OWNER") {
    throw new Error("Hanya Pemilik yang bisa mengakses menu ini")
  }

  const staffs = await prisma.user.findMany({
    where: { staffBusinessId: business.id }
  })

  return staffs
}

export async function createStaff(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  if (session.user.role !== "OWNER") {
    throw new Error("Hanya Pemilik yang bisa menambah pegawai")
  }

  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) throw new Error("Business not found")

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string

  if (!name || !email || !password || !role) {
    throw new Error("Semua field wajib diisi")
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new Error("Email sudah terdaftar. Gunakan email lain.")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
      role,
      staffBusinessId: business.id, emailVerified: new Date()
    }
  })

  return { success: true }
}

export async function deleteStaff(staffId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "OWNER") throw new Error("Unauthorized")

  const business = await prisma.business.findFirst({ where: { userId: session.user.id } })
  if (!business) throw new Error("Business not found")

  // Pastikan staff yang mau dihapus benar-benar milik business ini
  const staff = await prisma.user.findUnique({ where: { id: staffId } })
  if (!staff || staff.staffBusinessId !== business.id) {
    throw new Error("Pegawai tidak ditemukan atau tidak valid")
  }

  await prisma.user.delete({ where: { id: staffId } })
  return { success: true }
}
