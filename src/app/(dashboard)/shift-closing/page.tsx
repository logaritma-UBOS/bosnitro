export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getShiftClosings } from "@/lib/interlockingDb"
import ShiftClosingClient from "./ShiftClosingClient"

export default async function ShiftClosingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const closings = await getShiftClosings()

  return (
    <ShiftClosingClient
      initialClosings={closings}
      user={{
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      }}
    />
  )
}
