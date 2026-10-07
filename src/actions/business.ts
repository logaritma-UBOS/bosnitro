"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function createBusiness(prevState: any, formData: FormData): Promise<{ error?: string } | void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const defaultName = user?.name ? `Toko ${user.name}` : "Bisnis Saya"

  const name = (formData.get("name") as string)?.trim() || defaultName
  const businessType = (formData.get("businessType") as string)?.trim() || "RETAIL"
  const operatingDays = parseInt(formData.get("operatingDays") as string) || 7
  const targetOmzet = parseFloat(formData.get("targetOmzet") as string) || 0

  try {
    await prisma.$transaction(async (tx) => {
      const existingBusiness = await tx.business.findFirst({
        where: { userId: session.user.id }
      })

      if (existingBusiness) {
        await tx.business.update({
          where: { id: existingBusiness.id },
          data: {
            operatingDays
          }
        })

        const existingGoal = await tx.goal.findFirst({
          where: { businessId: existingBusiness.id, period: "MONTHLY" }
        })

        if (existingGoal) {
          await tx.goal.update({
            where: { id: existingGoal.id },
            data: { targetOmzet }
          })
        } else {
          await tx.goal.create({
            data: {
              businessId: existingBusiness.id,
              targetOmzet,
              period: "MONTHLY"
            }
          })
        }
      } else {
        await tx.business.create({
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
      }
    })
  } catch (err: any) {
    return { error: err?.message || "Gagal menyimpan data target usaha." }
  }

  redirect("/")
}
