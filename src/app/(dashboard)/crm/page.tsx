import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getCustomers } from "@/lib/crmDb"
import { getTenantBusinessId } from "@/lib/interlockingDb"
import CrmClient from "./CrmClient"

export const metadata = {
  title: "Customer Retention & CRM | POS UBOS",
  description: "Manajemen retensi pelanggan dan pengingat servis berkala WhatsApp",
}

export default async function CrmPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const businessId = await getTenantBusinessId(session)

  const initialCustomers = await getCustomers({ businessId })
  return <CrmClient initialCustomers={initialCustomers} />
}
