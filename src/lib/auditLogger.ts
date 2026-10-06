import { prisma } from "@/lib/prisma"

export async function logAudit(businessId: string, action: string, resource: string, details?: any) {
  try {
    await prisma.auditLog.create({
      data: {
        businessId,
        action,
        resource,
        detailsJson: details ? JSON.stringify(details) : null
      }
    })
  } catch (e) {
    console.error("Failed to write audit log", e)
  }
}
