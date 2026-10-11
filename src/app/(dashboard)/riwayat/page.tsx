import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTenantBusinessId } from "@/lib/interlockingDb"
import RiwayatClient from "./RiwayatClient"

export const dynamic = "force-dynamic"

export default async function RiwayatPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role === "KASIR") redirect("/kasir")
  
  const businessId = await getTenantBusinessId(session)
  return <RiwayatClient businessId={businessId} />
}
