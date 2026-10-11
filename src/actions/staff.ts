"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getStaffListByBranch, createStaffForBranch, deleteStaffFromBranch, getTenantBusinessId } from "@/lib/interlockingDb"

export async function getStaffList(branchId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Hanya owner yang boleh melihat list pegawai
    if (session.user.role !== "OWNER") {
      throw new Error("Hanya Pemilik yang bisa mengakses menu ini")
    }

    const businessId = await getTenantBusinessId(session)
    const staffMap = new Map<string, any>()

    // 1. Load from durable systemSetting / runtime
    const systemStaffs = await getStaffListByBranch(undefined, businessId)
    for (const s of systemStaffs) {
      if (s && s.email) {
        const emailKey = s.email.toLowerCase().trim()
        staffMap.set(emailKey, {
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          branchId: s.branchId || "branch-utama",
          branchName: s.branchName || "Cabang Outlet",
          createdAt: s.createdAt || new Date().toISOString(),
        })
      }
    }

    // 2. Load from batch setting backup if exists
    if (businessId) {
      try {
        const batchSetting = await prisma.systemSetting.findUnique({
          where: { key: `${businessId}_staff_list` }
        })
        if (batchSetting?.value) {
          const batchStaffs = JSON.parse(batchSetting.value)
          if (Array.isArray(batchStaffs)) {
            for (const s of batchStaffs) {
              if (s && s.email) {
                const emailKey = s.email.toLowerCase().trim()
                if (!staffMap.has(emailKey)) {
                  staffMap.set(emailKey, {
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    role: s.role,
                    branchId: s.branchId || "branch-utama",
                    branchName: s.branchName || "Cabang Outlet",
                    createdAt: s.createdAt || new Date().toISOString(),
                  })
                }
              }
            }
          }
        }
      } catch (e) {}
    }

    // 3. Load from prisma User table & merge (key by email to eliminate duplicates)
    try {
      const whereClause = (session.user as any).staffBusinessId
        ? { id: (session.user as any).staffBusinessId }
        : { userId: session.user.id }
      const business = await prisma.business.findFirst({ where: whereClause })
      if (business) {
        const dbStaffs = await prisma.user.findMany({
          where: { staffBusinessId: business.id }
        })
        for (const s of dbStaffs) {
          const emailKey = s.email.toLowerCase().trim()
          const existing = staffMap.get(emailKey)
          const bId = s.phone || existing?.branchId || "branch-utama"
          staffMap.set(emailKey, {
            id: s.id, // Use Prisma User ID so deleting user works in DB
            name: s.name,
            email: s.email,
            role: s.role,
            branchId: bId,
            branchName: existing?.branchName || "Cabang Outlet",
            createdAt: existing?.createdAt || new Date().toISOString(),
          })
        }
      }
    } catch (e) {}

    const all = Array.from(staffMap.values())
    if (!branchId || branchId === "ALL") return all
    return all.filter(s => s.branchId === branchId)
  } catch (err) {
    const session = await auth()
    const businessId = session?.user?.id ? await getTenantBusinessId(session) : undefined
    const systemStaffs = await getStaffListByBranch(branchId, businessId)
    const map = new Map<string, any>()
    for (const s of systemStaffs) {
      if (s && s.email) {
        map.set(s.email.toLowerCase().trim(), s)
      }
    }
    const all = Array.from(map.values())
    if (!branchId || branchId === "ALL") return all
    return all.filter(s => s.branchId === branchId)
  }
}

export async function createStaff(formData: FormData) {
  const session = await auth()
  const businessId = session?.user?.id ? await getTenantBusinessId(session) : undefined

  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const role = (formData.get("role") as string) || "KASIR"
  const branchId = (formData.get("branchId") as string) || "branch-utama"

  if (!name || !email || !password || !role) {
    throw new Error("Semua field wajib diisi")
  }

  // 1. Record in branch-scoped store
  await createStaffForBranch({
    businessId,
    branchId,
    name,
    email,
    role: role as "KASIR" | "MANAGER",
  })

  // 2. Persist / upsert in Prisma User table
  try {
    if (session?.user?.id) {
      const whereClause = (session.user as any).staffBusinessId
        ? { id: (session.user as any).staffBusinessId }
        : { userId: session.user.id }
      const business = await prisma.business.findFirst({ where: whereClause })
      if (business) {
        const hashedPassword = await bcrypt.hash(password, 10)
        
        // Find existing user by email
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name,
              passwordHash: hashedPassword,
              role,
              phone: branchId, // Assign to this branch!
              staffBusinessId: business.id,
            }
          })
        } else {
          await prisma.user.create({
            data: {
              name,
              email,
              passwordHash: hashedPassword,
              role,
              phone: branchId, // Assign to this branch!
              staffBusinessId: business.id,
              emailVerified: new Date(),
            }
          })
        }
      }
    }
  } catch (e) {
    console.error("Error creating/updating staff in prisma:", e)
  }

  // 3. Update batch backup
  if (businessId) {
    try {
      const currentList = await getStaffList()
      await prisma.systemSetting.upsert({
        where: { key: `${businessId}_staff_list` },
        update: { value: JSON.stringify(currentList) },
        create: {
          id: `sys-staff-list-${businessId}`,
          key: `${businessId}_staff_list`,
          value: JSON.stringify(currentList),
        }
      })
    } catch (e) {}
  }

  return { success: true }
}

export async function deleteStaff(staffId: string) {
  const session = await auth()
  const businessId = session?.user?.id ? await getTenantBusinessId(session) : undefined

  await deleteStaffFromBranch(staffId)
  try {
    // Check if staffId is a prisma User ID or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: staffId },
          { email: staffId }
        ]
      }
    })
    if (user) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
      // Also delete from systemSetting
      const allSettings = await prisma.systemSetting.findMany({
        where: { key: { startsWith: "staff_" } }
      })
      for (const st of allSettings) {
        try {
          const parsed = JSON.parse(st.value)
          if (parsed.email?.toLowerCase() === user.email.toLowerCase() || parsed.id === staffId) {
            await prisma.systemSetting.delete({ where: { id: st.id } }).catch(() => {})
          }
        } catch (e) {}
      }
    } else {
      await prisma.user.delete({ where: { id: staffId } }).catch(() => {})
      await prisma.systemSetting.delete({ where: { key: `staff_${staffId}` } }).catch(() => {})
    }
  } catch (e) {}

  // Update batch backup
  if (businessId) {
    try {
      const currentList = await getStaffList()
      await prisma.systemSetting.upsert({
        where: { key: `${businessId}_staff_list` },
        update: { value: JSON.stringify(currentList) },
        create: {
          id: `sys-staff-list-${businessId}`,
          key: `${businessId}_staff_list`,
          value: JSON.stringify(currentList),
        }
      })
    } catch (e) {}
  }

  return { success: true }
}
