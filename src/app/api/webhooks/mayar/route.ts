import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncUserMayarPayment } from "@/lib/mayarSync";

export async function POST(req: NextRequest) {
  try {
    const rawPayload = await req.json();
    console.log("[MAYAR WEBHOOK] Received payload:", JSON.stringify(rawPayload));

    const payload = rawPayload.data || rawPayload;
    const status = (payload.status || rawPayload.event || "").toString().trim().toUpperCase();
    const isPaid = status === "PAID" || status === "SETTLED" || status === "SUCCESS" || status === "COMPLETED" || 
                   status.includes("PAYMENT.RECEIVED") || status.includes("PAYMENT_RECEIVED") || status.includes("INVOICE.PAID");

    if (isPaid) {
      const email = (payload.customer?.email || payload.email || "").trim().toLowerCase();
      const customerName = (payload.customer?.name || payload.name || "").trim();

      // Coba cari user berdasarkan email atau nama
      let user = email ? await prisma.user.findFirst({ where: { email: { equals: email } }, include: { businesses: true } }) : null;

      if (!user && customerName) {
        const allUsers = await prisma.user.findMany({ include: { businesses: true } });
        user = allUsers.find(u => {
          const uName = (u.name || "").toLowerCase();
          const cName = customerName.toLowerCase();
          const bMatch = u.businesses.some(b => b.name && (b.name.toLowerCase().includes(cName) || cName.includes(b.name.toLowerCase())));
          return uName.includes(cName) || cName.includes(uName) || bMatch;
        }) || null;
      }

      if (user) {
        const trxId = payload.id || payload.trx_id || payload.reference || payload.invoice_id || Date.now().toString();
        const amount = Number(payload.net_amount || payload.amount || payload.total || payload.total_amount || 0);

        const existingRev = await prisma.ubosRevenue.findUnique({ where: { mayarTrxId: trxId } });

        await prisma.ubosRevenue.upsert({
          where: { mayarTrxId: trxId },
          create: {
            userId: user.id,
            mayarTrxId: trxId,
            amount: amount,
            paymentMethod: payload.payment_method || "MAYAR",
            status: "PAID"
          },
          update: {
            status: "PAID",
            amount: amount > 0 ? amount : undefined
          }
        });

        // Trigger Mayar sync terpadu untuk memastikan konsistensi
        await syncUserMayarPayment(user.email, user.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[MAYAR WEBHOOK ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
