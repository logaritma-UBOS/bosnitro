const fs = require("fs");

// ============================================================
// 3. UPDATE superAdminActions.ts — tier-aware sendNotification
// ============================================================

const content = fs.readFileSync(
  "C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/actions/superAdminActions.ts",
  "utf8"
);

const oldSendNotif = `    let userQuery = {};
    if (segment === "VIP_ONLY") {
        userQuery = { role: { in: ["VIP", "PREMIUM"] } };
    } else if (segment === "FREE_ONLY") {
        userQuery = { role: { in: ["FREE", "OWNER"] } };
    }

    const users = await prisma.user.findMany({ where: userQuery });`;

const newSendNotif = `    // Build tier-based user list
    let userIds: string[] | null = null;

    if (segment !== "ALL") {
        const allRevenues = await prisma.ubosRevenue.findMany({
            where: { status: "PAID" },
            select: { userId: true, amount: true }
        });

        // Group revenues by userId, find max amount
        const maxAmountByUser: Record<string, number> = {};
        for (const r of allRevenues) {
            if (!maxAmountByUser[r.userId] || r.amount > maxAmountByUser[r.userId]) {
                maxAmountByUser[r.userId] = r.amount;
            }
        }

        const paidUserIds = Object.keys(maxAmountByUser);
        const allUserIds = (await prisma.user.findMany({ select: { id: true } })).map(u => u.id);

        if (segment === "STARTER_ONLY") {
            // Users who never paid
            userIds = allUserIds.filter(id => !paidUserIds.includes(id));
        } else if (segment === "PRO_BULANAN") {
            userIds = paidUserIds.filter(id => maxAmountByUser[id] >= 49000 && maxAmountByUser[id] < 349000);
        } else if (segment === "PRO_TAHUNAN") {
            userIds = paidUserIds.filter(id => maxAmountByUser[id] >= 349000 && maxAmountByUser[id] < 499000);
        } else if (segment === "LIFETIME") {
            userIds = paidUserIds.filter(id => maxAmountByUser[id] >= 499000);
        } else if (segment === "VIP_ONLY") {
            // Pro Tahunan + Lifetime
            userIds = paidUserIds.filter(id => maxAmountByUser[id] >= 349000);
        } else if (segment === "PAID_ONLY") {
            userIds = paidUserIds;
        }
    }

    const userWhere = userIds ? { id: { in: userIds } } : {};
    const users = await prisma.user.findMany({ where: userWhere });`;

const newContent = content.replace(oldSendNotif, newSendNotif);
if (newContent === content) {
  console.log("WARN: sendNotification pattern not matched, skipping");
} else {
  fs.writeFileSync(
    "C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/actions/superAdminActions.ts",
    newContent,
    "utf8"
  );
  console.log("superAdminActions.ts updated");
}
