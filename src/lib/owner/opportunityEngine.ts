import { prisma } from "../prisma";
import { getStartOfDayUTC } from "../engines/timeEngine";

const OWNER_TZ = "Asia/Jakarta";

export interface Opportunity {
  id: string;
  category: "ACTIVATION" | "RETENTION" | "FEATURE_ADOPTION" | "USER_GROWTH" | "REACTIVATION" | "UPGRADE" | "EDUCATION";
  targetSegment: string;
  affectedUsers: number;
  evidence: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  impactScore: number;
  urgency: "IMMEDIATE" | "THIS_WEEK" | "THIS_MONTH" | "MONITOR";
  recommendedAction: string;
  recommendedMessage: string;
  channel: "IN_APP" | "WHATSAPP" | "EMAIL";
  expectedResult: string;
  
  // Legacy fields kept for compatibility with UI
  type: string;
  priority: string;
  current: number;
  target: number;
  gap: number;
  diagnosis: string;
  audience: string;
  numberOfAffectedUsers: number;
}

function calculatePriority(gapPercentage: number, affectedUsers: number): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  const impact = gapPercentage * affectedUsers;
  if (impact > 1000) return "CRITICAL";
  if (impact > 500) return "HIGH";
  if (impact > 100) return "MEDIUM";
  return "LOW";
}

export async function getOwnerOpportunities(): Promise<Opportunity[]> {
  const opps: Opportunity[] = [];
  
  // FETCH LEARNING HISTORY
  const pastActions = await prisma.ownerAction.findMany({
    where: { learningResult: { not: null } },
    select: { source: true, learningResult: true }
  });
  
  const historyScore = new Map<string, number>(); // source (opportunity ID) -> net success
  pastActions.forEach(a => {
    let score = historyScore.get(a.source) || 0;
    if (a.learningResult === 'SUCCESS') score += 1;
    if (a.learningResult === 'FAILED') score -= 1;
    if (a.learningResult === 'NO_CHANGE') score -= 0.5;
    historyScore.set(a.source, score);
  });

  // 1. ACTIVATION OPPORTUNITY
  const totalRegistered = await prisma.user.count();
  const totalBusiness = await prisma.business.count();
  
  const businessesWithHpp = await prisma.product.groupBy({
    by: ['businessId'],
    where: { calculatedHpp: { gt: 0 } }
  });
  
  const businessesWithTx = await prisma.sale.groupBy({
    by: ['businessId']
  });

  const hppCount = businessesWithHpp.length;
  const txCount = businessesWithTx.length;
  
  if (totalBusiness > 0) {
    const gapHppTx = hppCount - txCount;
    if (gapHppTx > 0) {
      const gapPerc = (gapHppTx / hppCount) * 100;
      const baseImpactAct = gapPerc * gapHppTx;
      const histAct = historyScore.get("opp_act_hpp_tx") || 0;
      let finalConfAct: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
      if (histAct > 0) finalConfAct = "HIGH";
      else if (histAct < 0) finalConfAct = "LOW";
      else finalConfAct = "MEDIUM";

      opps.push({
        id: "opp_act_hpp_tx",
        category: "ACTIVATION",
        targetSegment: "HPP_NOT_TRANSACTED",
        affectedUsers: gapHppTx,
        evidence: `${gapHppTx} user telah membuat HPP tapi belum memiliki pos_transaction_completed`,
        severity: gapPerc > 50 ? "HIGH" : "MEDIUM",
        confidence: finalConfAct,
        impactScore: baseImpactAct + (histAct * 10),
        urgency: "IMMEDIATE",
        recommendedAction: "Jalankan activation campaign (Edukasi Transaksi Pertama)",
        recommendedMessage: "Mulai transaksi pertamamu menggunakan resep HPP yang sudah kamu buat!",
        channel: "IN_APP",
        expectedResult: "Peningkatan rasio First Transaction (POS USED)",
        // Legacy
        type: "ACTIVATION",
        priority: calculatePriority(gapPerc, gapHppTx),
        current: txCount,
        target: hppCount,
        gap: gapHppTx,
        diagnosis: "HPP -> First Transaction adalah bottleneck utama. Banyak merchant sudah membuat resep tapi belum transaksi.",
        audience: "User yang sudah membuat HPP tetapi belum transaksi",
        numberOfAffectedUsers: gapHppTx
      });
    }
  }

  // 2. RETENTION OPPORTUNITY (Active users inactive for 14 days)
  const now = new Date();
  const startOfToday = getStartOfDayUTC(OWNER_TZ, now);
  const fourteenDaysAgo = new Date(startOfToday.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const allBizIds = await prisma.business.findMany({ select: { id: true } });
  
  const recentEvents = await prisma.sale.groupBy({
    by: ['businessId'],
    where: { 
      createdAt: { gte: fourteenDaysAgo }
    }
  });
  const activeBiz14d = new Set(recentEvents.map(e => e.businessId));
  const dormantBizCount = allBizIds.filter(b => !activeBiz14d.has(b.id)).length;
  
  if (dormantBizCount > 0) {
    const baseImpactRet = (dormantBizCount / allBizIds.length)*100 * dormantBizCount;
    const histRet = historyScore.get("opp_ret_dormant") || 0;
    let finalConfRet: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
    if (histRet > 0) finalConfRet = "HIGH";
    else if (histRet < 0) finalConfRet = "LOW";
    else finalConfRet = "MEDIUM";

    opps.push({
      id: "opp_ret_dormant",
      category: "REACTIVATION",
      targetSegment: "DORMANT_14D",
      affectedUsers: dormantBizCount,
      evidence: `${dormantBizCount} user terdaftar tidak mencatat transaksi dalam 14 hari terakhir`,
      severity: dormantBizCount > (allBizIds.length * 0.3) ? "HIGH" : "MEDIUM",
      confidence: finalConfRet,
      impactScore: baseImpactRet + (histRet * 10),
      urgency: "THIS_WEEK",
      recommendedAction: "Kirim Re-engagement Campaign",
      recommendedMessage: "Kami merindukan Anda di UBOS! Lihat fitur terbaru kami.",
      channel: "IN_APP",
      expectedResult: "User kembali login dan mencatat minimal 1 event",
      // Legacy
      type: "RETENTION",
      priority: calculatePriority((dormantBizCount / allBizIds.length)*100, dormantBizCount),
      current: activeBiz14d.size,
      target: allBizIds.length,
      gap: dormantBizCount,
      diagnosis: "Banyak user tidak aktif selama lebih dari 14 hari (DORMANT).",
      audience: "Dormant users (>14 hari tidak ada aktivitas)",
      numberOfAffectedUsers: dormantBizCount
    });
  }

  // SORT BY IMPACT
  opps.sort((a, b) => b.impactScore - a.impactScore);

  return opps;
}

export async function getDailyBrief(opps: Opportunity[]) {
  if (opps.length === 0) return null;
  const top = opps[0];
  return {
    kondisi: `Ditemukan bottleneck pada ${top.type} (${top.gap} user terdampak).`,
    masalah: top.diagnosis,
    dampak: `${top.numberOfAffectedUsers} user terdampak`,
    penyebab: top.diagnosis,
    action: top.recommendedAction,
    expectedResult: top.expectedResult
  };
}

export async function getDashboardIntelligence() {
  const now = new Date();
  const startOfToday = getStartOfDayUTC(OWNER_TZ, now);
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(startOfToday.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers,
    totalBusinesses,
    totalActions,
    acceptedActions,
    executedActions,
    evaluatedActions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.business.count(),
    prisma.ownerAction.count(),
    prisma.ownerAction.count({ where: { status: "ACCEPTED" } }),
    prisma.ownerAction.count({ where: { status: "EXECUTED" } }),
    prisma.ownerAction.count({ where: { status: "EVALUATED" } }),
  ]);

  // Active Users (any sale in last 7 days)
  const activeEvents7d = await prisma.sale.groupBy({
    by: ['businessId'],
    where: { createdAt: { gte: sevenDaysAgo } }
  });
  const activeUsersCount = activeEvents7d.length;

  // Inactive / Dormant (No sale in 14 days but has business)
  const activeEvents14d = await prisma.sale.groupBy({
    by: ['businessId'],
    where: { createdAt: { gte: fourteenDaysAgo } }
  });
  const active14dSet = new Set(activeEvents14d.map(e => e.businessId));
  const inactiveUsersCount = totalBusinesses - active14dSet.size;

  // Users stuck after register
  const stuckAfterRegister = totalUsers - totalBusinesses;

  // Churn Risk (inactive for 30+ days)
  const activeEvents30d = await prisma.sale.groupBy({
    by: ['businessId'],
    where: { createdAt: { gte: thirtyDaysAgo } }
  });
  const active30dSet = new Set(activeEvents30d.map(e => e.businessId));
  const churnRiskUsersCount = totalBusinesses > 0 ? (totalBusinesses - active30dSet.size) : 0;

  // Feature adoption
  const hppEvents = await prisma.product.groupBy({
    by: ['businessId'],
    where: { calculatedHpp: { gt: 0 } }
  });
  const posEvents = await prisma.sale.groupBy({
    by: ['businessId']
  });
  const catalogEvents = await prisma.product.groupBy({
    by: ['businessId']
  });

  const hppAdoption = totalBusinesses > 0 ? (hppEvents.length / totalBusinesses) * 100 : 0;
  const posAdoption = totalBusinesses > 0 ? (posEvents.length / totalBusinesses) * 100 : 0;
  const catalogAdoption = totalBusinesses > 0 ? (catalogEvents.length / totalBusinesses) * 100 : 0;

  // Activation Rate (Business created -> POS used)
  const activationRate = totalBusinesses > 0 ? (posEvents.length / totalBusinesses) * 100 : 0;
  const retentionRate = totalBusinesses > 0 ? (activeUsersCount / totalBusinesses) * 100 : 0;

  // Notifications and Offers
  const pendingNotifications = await prisma.ownerNotification.count({ where: { status: "PENDING" } });
  const activeOffers = await prisma.ownerOffer.count({ where: { status: "ACTIVE" } });
  const activeCampaigns = await prisma.ownerCampaign.count({ where: { status: "ACTIVE" } });

  return {
    totalUsers,
    newUsers,
    activeUsers: activeUsersCount,
    activatedUsers: totalBusinesses,
    inactiveUsers: inactiveUsersCount,
    churnRiskUsers: churnRiskUsersCount,
    stuckAfterRegister,
    hppAdoption,
    posAdoption,
    catalogAdoption,
    activationRate,
    retentionRate,
    activeActions: acceptedActions + executedActions,
    successfulActions: evaluatedActions, // Simplified proxy for now
    failedActions: 0, 
    pendingNotifications,
    activeOffers,
    activeCampaigns
  };
}
