import PegawaiClient from "./PegawaiClient"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function PegawaiPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Hanya owner yang boleh akses halaman pengaturan pegawai
  if (session.user.role !== "OWNER") {
    redirect("/beranda")
  }

  return (
    <PegawaiClient />
  )
}
