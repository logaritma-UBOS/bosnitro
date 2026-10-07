export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getProducts } from "@/lib/interlockingDb"
import KatalogNitrogenRetailClient from "./KatalogNitrogenRetailClient"

export default async function KatalogPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Strict RBAC synchronization: Kasir role is strictly limited to POS transactions
  if (session.user.role === "KASIR") {
    redirect("/kasir")
  }

  const products = await getProducts()

  return (
    <KatalogNitrogenRetailClient
      initialProducts={products}
      userRole={session.user.role}
    />
  )
}
