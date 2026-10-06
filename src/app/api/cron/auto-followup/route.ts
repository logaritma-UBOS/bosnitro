import { NextRequest, NextResponse } from "next/server";
import { processAutoFollowUp } from "@/lib/owner/autoFollowUpEngine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[CRON] Auto Follow Up Engine Triggered");
    const result = await processAutoFollowUp();

    return NextResponse.json({ success: true, message: `Auto follow up evaluated. Queued ${result.queued} messages.` });
  } catch (error: any) {
    console.error("Cron Error (Auto Follow Up):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
