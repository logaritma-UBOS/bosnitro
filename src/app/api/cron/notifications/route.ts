import { NextRequest, NextResponse } from "next/server";
import { NotificationEngine } from "@/lib/owner/notificationEngine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const engine = new NotificationEngine();
    console.log("[SMOKE TEST] Cron Notification Engine Triggered");
    await engine.processQueue();

    return NextResponse.json({ success: true, message: "Queue processed" });
  } catch (error: any) {
    console.error("Cron Error (Notifications):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
