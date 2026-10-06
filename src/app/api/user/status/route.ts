import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculateTierFromRevenues, syncUserMayarPayment } from "@/lib/mayarSync";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ isAuthenticated: false, isVIP: false, tier: "Starter", hasPhone: false });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ isAuthenticated: true, isVIP: false, tier: "Starter", hasPhone: false });
    }

    let targetUserId = user.id;
    let targetEmail = user.email;

    if ((session.user as any).staffBusinessId) {
      const business = await prisma.business.findUnique({
        where: { id: (session.user as any).staffBusinessId },
        include: { user: true }
      });
      if (business && business.user) {
        targetUserId = business.user.id;
        targetEmail = business.user.email;
      }
    }

    // Ambil seluruh riwayat transaksi user dari database
    let revenues = await prisma.ubosRevenue.findMany({
      where: { userId: targetUserId, status: "PAID" },
      orderBy: { createdAt: "desc" }
    });

    let tierStatus = calculateTierFromRevenues(targetEmail, revenues);

    // Jika masih berstatus Starter, lakukan verifikasi cadangan ke Mayar API
    // untuk mengantisipasi webhook yang belum sampai
    if (tierStatus.tier === "Starter") {
      const syncResult = await syncUserMayarPayment(targetEmail, targetUserId);
      if (syncResult?.tierStatus && syncResult.tierStatus.tier !== "Starter") {
        tierStatus = syncResult.tierStatus;
      }
    }

    return NextResponse.json({
      isAuthenticated: true,
      isVIP: tierStatus.isVIP,
      tier: tierStatus.tier,
      expiresAt: tierStatus.expiresAt,
      daysRemaining: tierStatus.daysRemaining,
      planName: tierStatus.planName,
      hasPhone: !!user.phone || user.role === "KASIR" || user.role === "MANAGER"
    });
  } catch (error) {
    console.error("[USER STATUS API ERROR]:", error);
    return NextResponse.json({ isAuthenticated: false, isVIP: false, tier: "Starter", hasPhone: false });
  }
}