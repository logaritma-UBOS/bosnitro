import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function RootPage() {
  const session = await auth()
  
  if (session?.user?.id) {
    if (session.user.role === 'KASIR' || session.user.role === 'MANAGER') {
      redirect("/kasir")
    } else {
      redirect("/beranda")
    }
  }
  
  redirect("/login")
}
