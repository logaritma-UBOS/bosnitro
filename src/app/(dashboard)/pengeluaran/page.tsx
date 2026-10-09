export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import PengeluaranClient from "./PengeluaranClient"

export default async function PengeluaranPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role === "KASIR") redirect("/kasir")

  return <PengeluaranClient />
}
