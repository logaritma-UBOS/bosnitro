import { prisma } from "../prisma";

export interface NotificationPayload {
  userId: string;
  campaignId: string;
  actionId?: string;
  title?: string;
  message: string;
  cta?: string;
  ctaUrl?: string;
  channel: "IN_APP" | "WHATSAPP" | "EMAIL" | "PUSH";
  idempotencyKey: string;
}

export abstract class NotificationProvider {
  abstract channel: "IN_APP" | "WHATSAPP" | "EMAIL" | "PUSH";
  abstract send(payload: NotificationPayload): Promise<{ success: boolean; error?: string }>;
}

export class InAppProvider extends NotificationProvider {
  channel = "IN_APP" as const;
  
  async send(payload: NotificationPayload) {
    // In-App is always ready because it just stays in the DB
    return { success: true };
  }
}

export class WhatsappProvider extends NotificationProvider {
  channel = "WHATSAPP" as const;
  async send(payload: NotificationPayload) {
    try {
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) return { success: false, error: "USER_NOT_FOUND" };
      
      // Target penerima MUTLAK adalah nomor pengguna
      const targetPhone = user.phone; 
      if (!targetPhone) {
        return { success: false, error: "USER_HAS_NO_PHONE" };
      }

      // Token Fonnte ini yang menentukan bahwa PENGIRIM-nya adalah 085179660408
      const token = process.env.FONNTE_TOKEN || "yR1HdhH9wfPVVoKu2G4e";
      const params = new URLSearchParams();
      params.append("target", targetPhone);
      params.append("message", payload.message);
      params.append("delay", "3-10"); // Anti-spam delay natively handled by Fonnte

      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": token
        },
        body: params
      });

      const result = await res.json();
      if (result.status) {
        return { success: true };
      } else {
        return { success: false, error: result.reason || "FONNTE_ERROR" };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export class EmailProvider extends NotificationProvider {
  channel = "EMAIL" as const;
  async send(payload: NotificationPayload) {
    return { success: false, error: "NOT_CONFIGURED" };
  }
}

export class PushProvider extends NotificationProvider {
  channel = "PUSH" as const;
  async send(payload: NotificationPayload) {
    return { success: false, error: "NOT_CONFIGURED" };
  }
}

export class NotificationEngine {
  private providers: Record<string, NotificationProvider> = {
    "IN_APP": new InAppProvider(),
    "WHATSAPP": new WhatsappProvider(),
    "EMAIL": new EmailProvider(),
    "PUSH": new PushProvider()
  };

  async processQueue() {
    const readyNotifications = await prisma.ownerNotification.findMany({
      where: { status: "READY" },
      take: 200 // process in larger batches since cron is only daily on Hobby
    });

    for (const notif of readyNotifications) {
      if (!notif.recipientId || !notif.campaignId) {
        await this.markFailed(notif.id, "MISSING_RECIPIENT_OR_CAMPAIGN");
        continue;
      }

      const provider = this.providers[notif.channel];
      if (!provider) {
        await this.markFailed(notif.id, "PROVIDER_NOT_FOUND");
        continue;
      }

      const payload: NotificationPayload = {
        userId: notif.recipientId,
        campaignId: notif.campaignId,
        actionId: notif.actionId || undefined,
        title: notif.title || undefined,
        message: notif.message,
        cta: notif.cta || undefined,
        ctaUrl: notif.ctaUrl || undefined,
        channel: notif.channel as any,
        idempotencyKey: notif.idempotencyKey || notif.id
      };

      try {
        await prisma.ownerNotification.update({
          where: { id: notif.id },
          data: {
            status: "SENDING",
            lastAttemptAt: new Date(),
            retryCount: { increment: 1 }
          }
        });

        const result = await provider.send(payload);

        if (result.success) {
          await prisma.ownerNotification.update({
            where: { id: notif.id },
            data: { 
              status: "SENT", 
              sentAt: new Date(),
              errorMessage: null 
            }
          });

          const userBiz = await prisma.business.findFirst({
            where: { userId: payload.userId }
          });
          const bizId = userBiz ? userBiz.id : "NO_BIZ_" + payload.userId;

          await prisma.ownerCampaign.update({
             where: { id: payload.campaignId },
             data: { delivered: { increment: 1 } }
          });
        } else {
          if (result.error === "NOT_CONFIGURED") {
            await prisma.ownerNotification.update({
              where: { id: notif.id },
              data: { status: "READY", errorMessage: "NOT_CONFIGURED" }
            });
          } else {
            await this.markFailed(notif.id, result.error || "UNKNOWN_ERROR");
          }
        }
      } catch (e: any) {
        await this.markFailed(notif.id, e.message);
      }
    }
  }

  private async markFailed(id: string, error: string) {
    await prisma.ownerNotification.update({
      where: { id },
      data: { status: "FAILED", errorMessage: error, failedAt: new Date() }
    });
  }
}
