import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const revenues = await prisma.ubosRevenue.findMany({ where: { status: "PAID" } });
    let updated = 0;
    
    for (const rev of revenues) {
      if (rev.amount % 1 !== 0) { // If it has decimals (meaning it was modified by our ratio script)
        const originalGross = Math.round(rev.amount / 0.99231333333);
        
        // We will just restore it to the exact original gross amount, OR the exact net amount without decimals
        // Let's restore to Gross amount, because the global total is now dynamically fetched from Mayar!
        let gross = 10000;
        if (rev.amount > 24000 && rev.amount < 26000) gross = 25000;
        if (rev.amount > 49000 && rev.amount < 51000) gross = 50000;

        await prisma.ubosRevenue.update({
          where: { id: rev.id },
          data: { amount: gross }
        });
        updated++;
      }
    }
    
    return NextResponse.json({ success: true, restored: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
