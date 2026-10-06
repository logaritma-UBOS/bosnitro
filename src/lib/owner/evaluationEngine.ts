import { prisma } from "../prisma";

/**
 * Runs a background evaluation for EXECUTED actions to check their result.
 */
export async function evaluateActions() {
  // Find all actions that were executed but not yet evaluated
  const pendingActions = await prisma.ownerAction.findMany({
    where: { 
      status: "EXECUTED"
    }
  });

  for (const action of pendingActions) {
    // 1. We need the campaign associated with this action
    const campaign = await prisma.ownerCampaign.findFirst({
      where: { actionId: action.id }
    });

    if (!campaign || !campaign.startAt) continue;

    // The evaluation window is 7 days from campaign start
    const now = new Date();
    const daysSinceStart = (now.getTime() - campaign.startAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // We can evaluate early, or wait for the full 7 days. We'll evaluate continuously.
    
    // Find eligible users from the notifications tied to this campaign
    const notifications = await prisma.ownerNotification.findMany({
      where: { campaignId: campaign.id }
    });
    const targetUserIds = Array.from(new Set(notifications.map(n => n.recipientId).filter(Boolean))) as string[];

    if (targetUserIds.length === 0) {
      await prisma.ownerAction.update({
        where: { id: action.id },
        data: {
          status: "EVALUATED",
          evaluation: "Tidak ada target user",
          learningResult: "INCONCLUSIVE"
        }
      });
      continue;
    }

    // Find the relevant target event based on the Action's metric or source opportunity
    let targetEventName = "";
    if (action.source === "opp_act_hpp_tx") {
      targetEventName = "pos_transaction_completed";
    } else if (action.source === "opp_ret_dormant") {
      // Any event counts as reactivation
      targetEventName = "ANY";
    }

    let convertedUsers = new Set<string>();

    if (targetEventName) {
      // Find businesses belonging to these users
      const targetBiz = await prisma.business.findMany({
        where: { userId: { in: targetUserIds } },
        select: { id: true, userId: true }
      });
      const bizIdToUserId = new Map<string, string>();
      targetBiz.forEach(b => bizIdToUserId.set(b.id, b.userId));
      const targetBizIds = Array.from(bizIdToUserId.keys());

      // Count sales AFTER campaign start
      const salesAfter = await prisma.sale.findMany({
        where: {
          businessId: { in: targetBizIds },
          createdAt: { gte: campaign.startAt }
        },
        select: { businessId: true }
      });

      salesAfter.forEach(s => {
        const uid = bizIdToUserId.get(s.businessId);
        if (uid) convertedUsers.add(uid);
      });
    }

    const conversionRate = (convertedUsers.size / targetUserIds.length) * 100;

    const deliveryRate = campaign.queued > 0 ? (campaign.delivered / campaign.queued) * 100 : 0;
    const openRate = campaign.delivered > 0 ? (campaign.opened / campaign.delivered) * 100 : 0;
    const clickRate = campaign.opened > 0 ? (campaign.clicked / campaign.opened) * 100 : 0;
    const absConversionRate = targetUserIds.length > 0 ? (convertedUsers.size / targetUserIds.length) * 100 : 0;

    // Determine success
    let learningResult = "INCONCLUSIVE";
    if (daysSinceStart > 3) {
      if (absConversionRate >= 10) learningResult = "SUCCESS";
      else if (absConversionRate > 0) learningResult = "NO_CHANGE";
      else learningResult = "FAILED";
    }

    // Update Action
    await prisma.ownerAction.update({
      where: { id: action.id },
      data: {
        actualAfter: convertedUsers.size,
        actualResult: `Delivered: ${deliveryRate.toFixed(1)}% | Opened: ${openRate.toFixed(1)}% | Clicked: ${clickRate.toFixed(1)}% | Converted: ${absConversionRate.toFixed(1)}%`,
        evaluation: `Conversion Rate: ${absConversionRate.toFixed(1)}% (${convertedUsers.size} users)`,
        learningResult: learningResult,
        status: daysSinceStart >= 7 ? "EVALUATED" : "EXECUTED"
      }
    });

    // Update Campaign with conversions
    await prisma.ownerCampaign.update({
      where: { id: campaign.id },
      data: {
        converted: convertedUsers.size,
        status: daysSinceStart >= 7 ? "COMPLETED" : "ACTIVE"
      }
    });
  }
}
