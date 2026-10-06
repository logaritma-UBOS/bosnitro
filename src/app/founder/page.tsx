import { auth } from "@/auth"
import { redirect } from "next/navigation"
import FounderClient from "./FounderClient"

export default async function FounderPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/founder")
  }
  
  return <FounderClient userName={session.user.name || "Founder"} />
}
