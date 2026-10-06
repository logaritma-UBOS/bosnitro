"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function getBusinessId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  if ((session.user as any).role === "KASIR") throw new Error("Kasir tidak memiliki akses ke data ini")
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) throw new Error("Business not found")
  return business.id
}

export async function addExpense(prevState: any, formData: FormData) {
  try {
    const businessId = await getBusinessId()
    const category = formData.get("category") as string
    const amount = parseFloat(formData.get("amount") as string) || 0
    const description = formData.get("description") as string
    
    if (!category || amount <= 0) return { error: "Kategori dan nominal wajib diisi dengan benar" }

    await prisma.expense.create({
      data: { businessId, category, amount, description }
    })
  } catch (e: any) {
    return { error: e.message }
  }
  revalidatePath("/pengeluaran")
  redirect("/pengeluaran")
}

export async function deleteExpense(id: string) {
  try {
    const businessId = await getBusinessId()
    await prisma.expense.deleteMany({ where: { id, businessId } })
  } catch (e) {
    console.error("Error deleting expense", e)
  }
  revalidatePath("/pengeluaran")
}
