import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import EditIngredientClient from "./EditIngredientClient"

export default async function EditIngredientPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const id = (await params).id
  const [ingredient, suppliers] = await Promise.all([
    prisma.ingredient.findUnique({ 
      where: { id },
      include: { business: true }
    }),
    prisma.supplier.findMany({
      where: (session.user as any).staffBusinessId ? { businessId: (session.user as any).staffBusinessId } : { business: { userId: session.user.id } },
      orderBy: { name: 'asc' }
    })
  ])
  
  if (!ingredient || ingredient.business.userId !== session.user.id) redirect("/katalog")
  
  return <EditIngredientClient ingredient={ingredient} suppliers={suppliers} />
}
