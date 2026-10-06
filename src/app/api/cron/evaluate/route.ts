import { NextRequest, NextResponse } from "next/server";
import { evaluateActions } from "@/lib/owner/evaluationEngine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[SMOKE TEST] Cron Evaluation Engine Triggered");
    await evaluateActions();

    return NextResponse.json({ success: true, message: "Actions evaluated" });
  } catch (error: any) {
    console.error("Cron Error (Evaluate):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
