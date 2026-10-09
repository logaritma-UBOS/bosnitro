const fs = require("fs");

// ============================================================
// 1. UPDATE users/page.tsx — inject tier data
// ============================================================

const usersPageContent = `import { prisma } from "@/lib/prisma"
import UsersClient from "./UsersClient"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic";

// Helper: determine tier from UbosRevenue records
function getTier(revenues: { amount: number }[]): string {
  if (revenues.length === 0) return "STARTER";
  const topAmount = Math.max(...revenues.map(r => r.amount));
  if (topAmount >= 499000) return "LIFETIME";
  if (topAmount >= 349000) return "PRO_TAHUNAN";
  if (topAmount >= 49000) return "PRO_BULANAN";
  return "STARTER";
}

export default async function UsersPage() {
    const session = await auth();
    const teamMember = await prisma.teamMember.findUnique({
        where: { email: session?.user?.email || "" }
    });

    if (!teamMember || teamMember.role !== "SUPER_ADMIN") redirect("/admin/pilot");

    const users = await prisma.user.findMany({
        include: {
            businesses: true
        },
        orderBy: { createdAt: "desc" }
    });

    const allRevenues = await prisma.ubosRevenue.findMany({
        where: { status: "PAID" },
        select: { userId: true, amount: true }
    });

    // Group revenues by userId
    const revenueMap: Record<string, { amount: number }[]> = {};
    for (const r of allRevenues) {
        if (!revenueMap[r.userId]) revenueMap[r.userId] = [];
        revenueMap[r.userId].push({ amount: r.amount });
    }

    // inject tier flag
    const usersWithTier = users.map(u => ({
        ...u,
        tier: getTier(revenueMap[u.id] || [])
    }));

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-black text-gray-900">Manajemen User (CRM)</h2>
                <p className="text-gray-500">Filter, pantau, dan delegasikan eksekusi harian ke tim Operations.</p>
            </div>
            
            <UsersClient users={usersWithTier} />
        </div>
    )
}
`;

fs.writeFileSync(
  "C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/admin/pilot/(dashboard)/users/page.tsx",
  usersPageContent,
  "utf8"
);
console.log("users/page.tsx updated");
