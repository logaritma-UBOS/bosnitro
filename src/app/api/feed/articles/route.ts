import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    let isVip = false;
    
    if (userEmail) {
        const user = await prisma.user.findUnique({ where: { email: userEmail }});
        if (user) {
            const userRole = user.role;
            const revenues = await prisma.ubosRevenue.findMany({
              where: { 
                userId: user.id, 
                status: "PAID"
              }
            });
            isVip = true;
        }
    }
    
    const audienceFilter = isVip 
        ? { in: ["ALL", "VIP_ONLY"] }
        : { in: ["ALL", "FREE_ONLY"] };

    const articles = await prisma.ubosFeedContent.findMany({
      where: { 
          status: "PUBLISHED",
          audience: audienceFilter
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    if (articles.length === 0) {
      return NextResponse.json([{
        id: "default",
        title: "Panduan Penggunaan UBOS",
        content: "Selamat datang di ekosistem UBOS. Tingkatkan penjualan Anda menggunakan fitur-fitur yang tersedia.",
        category: "TIPS"
      }]);
    }

    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json([]);
  }
}
