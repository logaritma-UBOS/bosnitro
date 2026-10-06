"use server";
import { prisma } from "@/lib/prisma";

export async function sendMessage(userId: string, message: string, senderRole: "USER" | "ADMIN") {
  if (!message.trim()) return;
  await prisma.supportMessage.create({
    data: {
      userId,
      message,
      senderRole
    }
  });
}

export async function getChatHistory(userId: string) {
  return await prisma.supportMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });
}

export async function getUnreadAdminMessages(userId: string) {
  const count = await prisma.supportMessage.count({
    where: {
      userId,
      senderRole: "ADMIN",
      isRead: false
    }
  });
  return count;
}

export async function markMessagesAsRead(userId: string) {
  await prisma.supportMessage.updateMany({
    where: {
      userId,
      senderRole: "ADMIN",
      isRead: false
    },
    data: { isRead: true }
  });
}

export async function getAdminInbox() {
  const users = await prisma.user.findMany({
    where: { supportMessages: { some: {} } },
    include: {
      supportMessages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });
  // Add unread count per user
  const withUnread = await Promise.all(users.map(async (u) => {
    const unreadCount = await prisma.supportMessage.count({
      where: { userId: u.id, senderRole: "USER", isRead: false }
    });
    return { ...u, unreadCount };
  }));
  return withUnread.sort((a, b) => {
    const aTime = a.supportMessages[0]?.createdAt.getTime() || 0;
    const bTime = b.supportMessages[0]?.createdAt.getTime() || 0;
    return bTime - aTime;
  });
}
