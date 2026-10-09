export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getShiftClosings, getUserAssignedBranch } from "@/lib/interlockingDb"
import ShiftClosingClient from "./ShiftClosingClient"

export default async function ShiftClosingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [closings, assignedBranch] = await Promise.all([
    getShiftClosings(),
    getUserAssignedBranch(session.user.id, session.user.email || undefined),
  ])

  return (
    <ShiftClosingClient
      initialClosings={closings}
      assignedBranch={assignedBranch}
      user={{
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      }}
    />
  )
}
