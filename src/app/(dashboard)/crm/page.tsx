import { getCustomers } from "@/lib/crmDb"
import CrmClient from "./CrmClient"

export const metadata = {
  title: "Customer Retention & CRM | POS UBOS",
  description: "Manajemen retensi pelanggan dan pengingat servis berkala WhatsApp",
}

export default async function CrmPage() {
  const initialCustomers = await getCustomers()
  return <CrmClient initialCustomers={initialCustomers} />
}
