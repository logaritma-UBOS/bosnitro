import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AOVMarginClient from "./AOVMarginClient"

export const dynamic = "force-dynamic"

export default async function AOVMarginPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  return <AOVMarginClient />}
