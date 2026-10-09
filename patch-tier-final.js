const fs = require("fs");

// ============================================================
// ATURAN BARU (FINAL, disetujui Bos):
// - warunkarsi23@gmail.com = LIFETIME (hardcode tetap)
// - Ada UbosRevenue PAID dengan amount BERAPAPUN = PRO_BULANAN
// - Tidak ada UbosRevenue = STARTER
// Hapus filter "createdAt gte firstDayOfMonth" & "amount gt 100000"
// ============================================================

// 1. marketing/page.tsx
let file1 = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/(dashboard)/marketing/page.tsx", "utf8");
file1 = file1.replace(
  `    const payment = await prisma.ubosRevenue.findFirst({
      where: { userId: session.user.id, status: "PAID", amount: { gt: 100000 } }
    });`,
  `    const payment = await prisma.ubosRevenue.findFirst({
      where: { userId: session.user.id, status: "PAID" }
    });`
);
fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/(dashboard)/marketing/page.tsx", file1, "utf8");
console.log("1. marketing/page.tsx ✓");

// 2. campaign.ts
let file2 = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/actions/campaign.ts", "utf8");
file2 = file2.replace(
  `          const payment = await prisma.ubosRevenue.findFirst({
            where: { userId: session.user.id, status: "PAID", amount: { gt: 100000 } }
          });`,
  `          const payment = await prisma.ubosRevenue.findFirst({
            where: { userId: session.user.id, status: "PAID" }
          });`
);
fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/actions/campaign.ts", file2, "utf8");
console.log("2. campaign.ts ✓");

// 3. beranda/page.tsx — hapus filter firstDayOfMonth
let file3 = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/(dashboard)/beranda/page.tsx", "utf8");
file3 = file3.replace(
  `      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const payment = await prisma.ubosRevenue.findFirst({
        where: { 
          userId: business.userId, 
          status: "PAID",
          createdAt: { gte: firstDayOfMonth }
        }
      })`,
  `      const payment = await prisma.ubosRevenue.findFirst({
        where: { 
          userId: business.userId, 
          status: "PAID"
        }
      })`
);
fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/(dashboard)/beranda/page.tsx", file3, "utf8");
console.log("3. beranda/page.tsx ✓");

// 4. /api/user/status/route.ts — hapus filter firstDayOfMonth, return tier akurat
let file4 = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/api/user/status/route.ts", "utf8");
file4 = file4.replace(
  `    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const payment = await prisma.ubosRevenue.findFirst({
      where: { 
        userId: user.id, 
        status: "PAID",
        createdAt: {
          gte: firstDayOfMonth
        }
      }
    });

    const isVIP = !!payment;
    const tier = isVIP ? "Pro" : "Starter";`,
  `    const payment = await prisma.ubosRevenue.findFirst({
      where: { 
        userId: user.id, 
        status: "PAID"
      }
    });

    const isVIP = !!payment;
    const tier = isVIP ? "Pro Bulanan" : "Starter";`
);
fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/api/user/status/route.ts", file4, "utf8");
console.log("4. /api/user/status/route.ts ✓");

// 5. /api/feed/articles/route.ts — hapus filter firstDayOfMonth
let file5 = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/api/feed/articles/route.ts", "utf8");
file5 = file5.replace(
  `            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const payment = await prisma.ubosRevenue.findFirst({
              where: { 
                userId: user.id, 
                status: "PAID",
                createdAt: {
                  gte: firstDayOfMonth
                }
              }
            });`,
  `            const payment = await prisma.ubosRevenue.findFirst({
              where: { 
                userId: user.id, 
                status: "PAID"
              }
            });`
);
fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/api/feed/articles/route.ts", file5, "utf8");
console.log("5. /api/feed/articles/route.ts ✓");

// 6. admin users/page.tsx — getTier: any payment = PRO_BULANAN
let file6 = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/admin/pilot/(dashboard)/users/page.tsx", "utf8");
file6 = file6.replace(
  `function getTier(revenues: { amount: number }[]): string {
  if (revenues.length === 0) return "STARTER";
  const topAmount = Math.max(...revenues.map(r => r.amount));
  if (topAmount >= 499000) return "LIFETIME";
  if (topAmount >= 349000) return "PRO_TAHUNAN";
  if (topAmount >= 49000) return "PRO_BULANAN";
  return "STARTER";
}`,
  `function getTier(email: string, revenues: { amount: number }[]): string {
  if (email === "warunkarsi23@gmail.com") return "LIFETIME";
  if (revenues.length > 0) return "PRO_BULANAN";
  return "STARTER";
}`
);
// Also fix the call site
file6 = file6.replace(
  `        tier: getTier(revenueMap[u.id] || [])`,
  `        tier: getTier(u.email, revenueMap[u.id] || [])`
);
fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/admin/pilot/(dashboard)/users/page.tsx", file6, "utf8");
console.log("6. admin/users/page.tsx ✓");

console.log("\nSemua 6 file berhasil diupdate!");
