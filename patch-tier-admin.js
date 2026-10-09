const fs = require("fs");

let file = fs.readFileSync(
  "C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/admin/pilot/(dashboard)/page.tsx",
  "utf8"
);

// Replace the old complex tier breakdown with the new simple logic
const oldLogic = `  const paidUserIds = Object.keys(maxAmountByUser);
  const countStarter = totalUsers - paidUserIds.length;
  const countProBulanan = paidUserIds.filter(id => maxAmountByUser[id] >= 49000 && maxAmountByUser[id] < 349000).length;
  const countProTahunan = paidUserIds.filter(id => maxAmountByUser[id] >= 349000 && maxAmountByUser[id] < 499000).length;
  const countLifetime = paidUserIds.filter(id => maxAmountByUser[id] >= 499000).length;`;

const newLogic = `  const paidUserIds = Object.keys(maxAmountByUser);
  // Aturan Final: warunkarsi = LIFETIME, ada pembayaran berapapun = PRO_BULANAN, sisanya = STARTER
  const LIFETIME_EMAILS = ["warunkarsi23@gmail.com"];
  const lifetimeUsers = await prisma.user.findMany({
    where: { email: { in: LIFETIME_EMAILS } },
    select: { id: true }
  });
  const lifetimeIds = new Set(lifetimeUsers.map(u => u.id));
  const countLifetime = lifetimeIds.size;
  const countProBulanan = paidUserIds.filter(id => !lifetimeIds.has(id)).length;
  const countStarter = totalUsers - countLifetime - countProBulanan;
  const countProTahunan = 0; // Belum ada tier ini aktif`;

file = file.replace(oldLogic, newLogic);
fs.writeFileSync(
  "C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/admin/pilot/(dashboard)/page.tsx",
  file,
  "utf8"
);
console.log("admin dashboard page.tsx tier breakdown ✓");
