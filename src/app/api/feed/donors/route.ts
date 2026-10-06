import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rawDonors = await prisma.ubosRevenue.findMany({
      where: { status: "PAID" },
      orderBy: { createdAt: "desc" },
      select: {
        userId: true,
        amount: true
      }
    });
    
    // Group and sum amounts by user
    const userDonations = new Map<string, number>();
    for (const d of rawDonors) {
      const current = userDonations.get(d.userId) || 0;
      userDonations.set(d.userId, current + d.amount);
    }
    
    // Convert back to array
    const uniqueDonors = Array.from(userDonations.entries()).map(([userId, amount]) => ({ userId, amount }));
    
    const donors = await Promise.all(uniqueDonors.map(async (d) => {
      const user = await prisma.user.findUnique({ where: { id: d.userId } });
      return {
        name: user?.name || user?.email?.split('@')[0] || "Hamba Allah",
        amount: d.amount
      };
    }));

    return NextResponse.json(donors);
  } catch (error) {
    return NextResponse.json([]);
  }
}
