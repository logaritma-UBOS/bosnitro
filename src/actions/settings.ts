"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateMonthlyTarget(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  if ((session.user as any).role === "KASIR") throw new Error("Kasir tidak memiliki akses ke data ini")

  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) throw new Error("Business not found")

  const targetOmzet = parseFloat(formData.get("targetOmzet") as string) || 0

  const existingGoal = await prisma.goal.findFirst({
    where: { businessId: business.id, period: "MONTHLY" }
  })

  if (existingGoal) {
    await prisma.goal.update({
      where: { id: existingGoal.id },
      data: { targetOmzet }
    })
  } else {
    await prisma.goal.create({
      data: {
        businessId: business.id,
        targetOmzet,
        period: "MONTHLY"
      }
    })
  }

  revalidatePath("/")
  redirect("/")
}
