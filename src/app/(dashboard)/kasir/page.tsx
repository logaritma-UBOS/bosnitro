export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getProducts, getTenantBusinessId } from "@/lib/interlockingDb"
import KasirInterlockingClient from "./KasirInterlockingClient"

export default async function KasirPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const businessId = await getTenantBusinessId(session)
  const products = await getProducts()

  return (
    <KasirInterlockingClient
      businessId={businessId}
      initialProducts={products}
      user={{
        name: session.user.name,
        role: session.user.role,
      }}
    />
  )
}
