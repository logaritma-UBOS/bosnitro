"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function authorizeOwner() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized: No session")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  // We are assuming 'ADMIN' or 'OWNER_SUPER' is the owner level.
  // Wait, in schema, role is default 'OWNER'. Maybe Logaritma owner is 'ADMIN'.
  // We'll check if role is 'ADMIN'. Or just assume user id 1 is owner for now, 
  // but let's use 'ADMIN' role to distinguish from merchant 'OWNER'.
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Insufficient permissions for Owner Backend")
  }

  return user;
}
