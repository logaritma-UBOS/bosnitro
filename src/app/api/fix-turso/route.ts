import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const emailsToDelete = [
      "bintangtory08@gmail.com",
      "logaritma.tim@gmail.com",
      "warunkarsi23@gmail.com"
    ];

    const results = [];
    for (const email of emailsToDelete) {
      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        await prisma.ubosRevenue.deleteMany({
          where: { userId: user.id }
        });
        results.push({ email, action: "deleted_from_vip" });
      }
    }
    
    return NextResponse.json({ success: true, results })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message })
  }
}

