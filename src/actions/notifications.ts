"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getUnreadNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  return await prisma.ownerNotification.findMany({
    where: { 
      recipientId: session.user.id,
      status: "SENT" // Sent from engine perspective means delivered to user
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
}

export async function markAsRead(ids: string[]) {
  const session = await auth();
  if (!session?.user?.id) return;
  
  await prisma.ownerNotification.updateMany({
    where: { 
      id: { in: ids },
      recipientId: session.user.id
    },
    data: { readAt: new Date() }
  });
  
  // Track open for attribution
  for (const id of ids) {
    const notif = await prisma.ownerNotification.findUnique({ where: { id }});
    if (notif && notif.campaignId) {
      await prisma.ownerCampaign.update({
        where: { id: notif.campaignId },
        data: { opened: { increment: 1 } }
      });
    }
  }
}

export async function trackNotificationClick(id: string, campaignId?: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.ownerNotification.update({
    where: { id, recipientId: session.user.id },
    data: { clickedAt: new Date() }
  });
  
  if (campaignId) {
    await prisma.ownerCampaign.update({
      where: { id: campaignId },
      data: { clicked: { increment: 1 } }
    });
  }
}
