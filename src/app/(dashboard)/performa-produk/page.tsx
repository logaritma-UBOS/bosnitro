import { auth } from "@/auth"
import { redirect } from "next/navigation"
import PerformaProdukClient from "./PerformaProdukClient"

export const dynamic = "force-dynamic"

export default async function PerformaProdukPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  return <PerformaProdukClient />}
