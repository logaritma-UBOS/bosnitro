"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getStaffListByBranch, createStaffForBranch, deleteStaffFromBranch } from "@/lib/interlockingDb"

export async function getStaffList(branchId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Hanya owner yang boleh melihat list pegawai
    if (session.user.role !== "OWNER") {
      throw new Error("Hanya Pemilik yang bisa mengakses menu ini")
    }

    const staffMap = new Map<string, any>()

    // 1. Load from durable systemSetting / runtime
    const systemStaffs = await getStaffListByBranch(branchId)
    for (const s of systemStaffs) {
      if (s && s.id) staffMap.set(s.id, s)
    }

    // 2. Load from prisma User table
    try {
      const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id }
      const business = await prisma.business.findFirst({ where: whereClause })
      if (business) {
        const dbStaffs = await prisma.user.findMany({
          where: { staffBusinessId: business.id }
        })
        for (const s of dbStaffs) {
          const bId = s.phone || "branch-utama"
          if (!branchId || branchId === "ALL" || bId === branchId) {
            staffMap.set(s.id, {
              id: s.id,
              name: s.name,
              email: s.email,
              role: s.role,
              branchId: bId,
            })
          }
        }
      }
    } catch (e) {}

    const all = Array.from(staffMap.values())
    if (!branchId || branchId === "ALL") return all
    return all.filter(s => s.branchId === branchId)
  } catch (err) {
    return await getStaffListByBranch(branchId)
  }
}

export async function createStaff(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string
  const branchId = (formData.get("branchId") as string) || "branch-utama"

  if (!name || !email || !password || !role) {
    throw new Error("Semua field wajib diisi")
  }

  // Record in branch-scoped store
  await createStaffForBranch({
    branchId,
    name,
    email,
    role: role as "KASIR" | "MANAGER",
  })

  // Also persist in Prisma if possible
  try {
    const session = await auth()
    if (session?.user?.id) {
      const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id }
      const business = await prisma.business.findFirst({ where: whereClause })
      if (business) {
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.create({
          data: {
            name,
            email,
            passwordHash: hashedPassword,
            role,
            phone: branchId, // tag with branchId
            staffBusinessId: business.id,
            emailVerified: new Date(),
          }
        })
      }
    }
  } catch (e) {}

  return { success: true }
}

export async function deleteStaff(staffId: string) {
  await deleteStaffFromBranch(staffId)
  try {
    await prisma.user.delete({ where: { id: staffId } })
  } catch (e) {}
  return { success: true }
}
