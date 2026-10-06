import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const amount = body.amount;
    const planName = body.planName || "Dukungan VIP UBOS";
    const planDesc = body.planDesc || "Pembayaran seikhlasnya untuk dukungan pengembangan UBOS";

    if (!amount || isNaN(amount) || amount < 10000) {
      return NextResponse.json({ error: "Invalid amount. Minimum Rp 10.000" }, { status: 400 });
    }

    const MAYAR_API_KEY = process.env.MAYAR_API_KEY || "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzExZTAxZi01ZjI4LTQ3MDgtYTc1Yy1iODE2ZjczZjM3YmQiLCJhY2NvdW50SWQiOiJjMTQyNmNkNi1lNTJiLTRmNzktYjlhNS1iMGY4ZmRjMjc2YzMiLCJjcmVhdGVkQXQiOiIxNzg4MDcwMjg2MDAxIiwicm9sZSI6ImRldmVsb3BlciIsInNjb3BlIjp7InJlYWQiOnRydWUsIndyaXRlIjp0cnVlfSwic3ViIjoibG9nYXJpdG1hLnRpbUBnbWFpbC5jb20iLCJuYW1lIjoiTG9nYXJpdG1hIiwibGluayI6ImxvZ2FyaXRtYS1wYXkiLCJpc1NlbGZEb21haW4iOmZhbHNlLCJpYXQiOjE3ODgwNzAyODZ9.i-0x6ok50c2ys7PpkbAEuLESGZHZ6glNpe-OjHnbnnXHjEAYgn2SkrhRxBUcWvDQvOaV8uIs9wo7La4aM0KtDcoHfbiH7jEtrSgEqLPG_50ZbUbhFN-alCT-_CUOUXMhbEbD3Xrh3L-QHOmwwI74-AqhUwius0d762VvF6tfQG8CHvabcn1GJHuYTikAAiKWNpiILDoyReoF2jcGn_vN4zrEoVb8Ma0oed2kBxYZRnEGytnDn45rrMt3TfP96hWBCcQZZO3Yo4UZfbSyiYem3QmT2iNTRw4quUONdcF73Hy7acaUqunIioy52p6PC3gHJVx1eKxsAbzalRZbYjKDLw";

    // Call Mayar API
    const response = await fetch("https://api.mayar.id/hl/v1/invoice/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MAYAR_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: session.user.name || "UBOS User",
        email: session.user.email,
        mobile: "08000000000",
        amount: Number(amount),
        description: planName,
        redirectUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/thank-you` : "https://ubos.logaritma.id/thank-you",
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            name: planName,
            description: planDesc,
            quantity: 1,
            rate: Number(amount)
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.statusCode === 200 && data.data && data.data.link) {
      return NextResponse.json({ link: data.data.link });
    } else {
      console.error("Mayar Error:", data);
      return NextResponse.json({ error: "Gagal membuat tagihan Mayar" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Payment Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
