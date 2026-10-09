import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { path, referrer } = await req.json();
    const userAgent = req.headers.get("user-agent") || "unknown";
    
    await prisma.visitorAnalytics.create({
      data: {
        path: path || "/",
        referrer: referrer || null,
        userAgent
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Tracking skipped" }, { status: 200 });
  }
}
