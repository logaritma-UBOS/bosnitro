import { prisma } from "@/lib/prisma";

export interface UserTierStatus {
  tier: "Starter" | "Pro Bulanan" | "Pro Tahunan" | "Lifetime";
  isVIP: boolean;
  expiresAt: Date | null;
  daysRemaining: number | null;
  planName: string;
}

/**
 * Menghitung status tier dan masa aktif paket berdasarkan riwayat transaksi di UbosRevenue.
 * - Lifetime: >= 499.000 atau email khusus (Permanen tanpa batas waktu).
 * - Pro Tahunan: >= 349.000 (Berlaku 365 hari sejak transaksi).
 * - Pro Bulanan: >= 49.000 atau pembayaran lainnya (Berlaku 30 hari sejak transaksi).
 * - Jika masa aktif habis: Otomatis kembali ke "Starter".
 */
export function calculateTierFromRevenues(
  email: string | null | undefined,
  revenues: Array<{ amount: number; status: string; createdAt: Date | string }>
): UserTierStatus {
  const normalizedEmail = (email || "").trim().toLowerCase();

  // 1. Akun Permanent VIP khusus
  const PERMANENT_VIPS = ["warunkarsi23@gmail.com"];
  if (normalizedEmail && PERMANENT_VIPS.includes(normalizedEmail)) {
    return {
      tier: "Lifetime",
      isVIP: true,
      expiresAt: null,
      daysRemaining: null,
      planName: "Lifetime Founder Pass"
    };
  }

  // Filter hanya transaksi yang berstatus PAID
  const paidRevenues = (revenues || []).filter(r => {
    const s = (r.status || "").trim().toUpperCase();
    return s === "PAID" || s === "SETTLED" || s === "SUCCESS" || s === "COMPLETED";
  });

  if (paidRevenues.length === 0) {
    return {
      tier: "Starter",
      isVIP: false,
      expiresAt: null,
      daysRemaining: null,
      planName: "Starter (Gratis)"
    };
  }

  // 2. Prioritas 1: Lifetime Founder Pass (Nominal >= Rp 499.000)
  const lifetime = paidRevenues.find(r => Number(r.amount) >= 499000);
  if (lifetime) {
    return {
      tier: "Lifetime",
      isVIP: true,
      expiresAt: null,
      daysRemaining: null,
      planName: "Lifetime Founder Pass"
    };
  }

  const now = new Date();

  // 3. Prioritas 2: Pro Tahunan (Nominal >= Rp 349.000 & < Rp 499.000)
  // Masa aktif: 365 hari (1 tahun)
  const tahunanList = paidRevenues
    .filter(r => Number(r.amount) >= 349000 && Number(r.amount) < 499000)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  for (const t of tahunanList) {
    const created = new Date(t.createdAt);
    const expiresAt = new Date(created.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (expiresAt > now) {
      const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24)));
      return {
        tier: "Pro Tahunan",
        isVIP: true,
        expiresAt,
        daysRemaining,
        planName: "Pro Tahunan"
      };
    }
  }

  // 4. Prioritas 3: Pro Bulanan (Nominal >= Rp 10.000 & < Rp 349.000)
  // Masa aktif: 30 hari (1 bulan)
  const bulananList = paidRevenues
    .filter(r => Number(r.amount) < 349000)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  for (const b of bulananList) {
    const created = new Date(b.createdAt);
    const expiresAt = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (expiresAt > now) {
      const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24)));
      return {
        tier: "Pro Bulanan",
        isVIP: true,
        expiresAt,
        daysRemaining,
        planName: "Pro Bulanan"
      };
    }
  }

  // 5. Jika seluruh transaksi sudah melewati masa aktif -> Otomatis kembali ke Starter
  return {
    tier: "Starter",
    isVIP: false,
    expiresAt: null,
    daysRemaining: 0,
    planName: "Starter (Masa Aktif Habis)"
  };
}

/**
 * Mengambil transaksi dari API Mayar dan mencocokkan ke user UBOS.
 * Dapat dipanggil secara real-time pada halaman /thank-you atau status checker.
 */
export async function syncUserMayarPayment(targetEmail: string, targetUserId?: string) {
  const MAYAR_API_KEY = process.env.MAYAR_API_KEY || "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzExZTAxZi01ZjI4LTQ3MDgtYTc1Yy1iODE2ZjczZjM3YmQiLCJhY2NvdW50SWQiOiJjMTQyNmNkNi1lNTJiLTRmNzktYjlhNS1iMGY4ZmRjMjc2YzMiLCJjcmVhdGVkQXQiOiIxNzg4MDcwMjg2MDAxIiwicm9sZSI6ImRldmVsb3BlciIsInNjb3BlIjp7InJlYWQiOnRydWUsIndyaXRlIjp0cnVlfSwic3ViIjoibG9nYXJpdG1hLnRpbUBnbWFpbC5jb20iLCJuYW1lIjoiTG9nYXJpdG1hIiwibGluayI6ImxvZ2FyaXRtYS1wYXkiLCJpc1NlbGZEb21haW4iOmZhbHNlLCJpYXQiOjE3ODgwNzAyODZ9.i-0x6ok50c2ys7PpkbAEuLESGZHZ6glNpe-OjHnbnnXHjEAYgn2SkrhRxBUcWvDQvOaV8uIs9wo7La4aM0KtDcoHfbiH7jEtrSgEqLPG_50ZbUbhFN-alCT-_CUOUXMhbEbD3Xrh3L-QHOmwwI74-AqhUwius0d762VvF6tfQG8CHvabcn1GJHuYTikAAiKWNpiILDoyReoF2jcGn_vN4zrEoVb8Ma0oed2kBxYZRnEGytnDn45rrMt3TfP96hWBCcQZZO3Yo4UZfbSyiYem3QmT2iNTRw4quUONdcF73Hy7acaUqunIioy52p6PC3gHJVx1eKxsAbzalRZbYjKDLw";

  try {
    const cleanEmail = (targetEmail || "").trim().toLowerCase();
    
    // Cari user di DB jika targetUserId belum disediakan
    let user = targetUserId 
      ? await prisma.user.findUnique({ where: { id: targetUserId }, include: { businesses: true } })
      : await prisma.user.findFirst({ 
          where: { 
            email: { equals: cleanEmail } 
          },
          include: { businesses: true }
        });

    if (!user) {
      return { success: false, message: "User tidak ditemukan" };
    }

    // Ambil daftar invoice dari Mayar (2 halaman pertama untuk mencakup transaksi terkini)
    let invoices: any[] = [];
    for (let p = 1; p <= 2; p++) {
      const res = await fetch(`https://api.mayar.id/hl/v1/invoice?page=${p}&pageSize=20`, {
        headers: { "Authorization": `Bearer ${MAYAR_API_KEY}` }
      });
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        invoices = invoices.concat(data.data);
      }
      if (!data?.hasMore) break;
    }

    // Filter yang statusnya berhasil
    const paidInvoices = invoices.filter(inv => {
      const s = (inv.status || "").trim().toUpperCase();
      return s === "PAID" || s === "SETTLED" || s === "SUCCESS" || s === "COMPLETED";
    });

    const userBusinessNames = (user.businesses || []).map(b => b.name?.toLowerCase().trim()).filter(Boolean);
    const userName = (user.name || "").toLowerCase().trim();

    let matchedCount = 0;

    for (const inv of paidInvoices) {
      const invEmail = (inv.customer?.email || inv.email || "").toLowerCase().trim();
      const invName = (inv.customer?.name || inv.name || "").toLowerCase().trim();

      // Cek kecocokan
      const isEmailMatch = invEmail && (invEmail === cleanEmail || invEmail === user.email.toLowerCase());
      const isNameMatch = invName && (
        invName === userName || 
        userBusinessNames.some(bName => invName.includes(bName) || bName.includes(invName)) ||
        (userName && (invName.includes(userName) || userName.includes(invName)))
      );

      if (isEmailMatch || isNameMatch) {
        const trxId = inv.id || inv.reference || inv.invoice_id;
        const amount = Number(inv.net_amount || inv.amount || inv.total || 0);

        const existing = await prisma.ubosRevenue.findUnique({
          where: { mayarTrxId: trxId }
        });

        if (!existing) {
          await prisma.ubosRevenue.create({
            data: {
              userId: user.id,
              mayarTrxId: trxId,
              amount: amount,
              paymentMethod: inv.payment_method || "MAYAR",
              status: "PAID"
            }
          });

          matchedCount++;
        }
      }
    }

    // Ambil status tier terupdate
    const userRevenues = await prisma.ubosRevenue.findMany({
      where: { userId: user.id, status: "PAID" }
    });

    const tierStatus = calculateTierFromRevenues(user.email, userRevenues);

    return {
      success: true,
      matchedCount,
      tierStatus
    };
  } catch (error: any) {
    console.error("[MAYAR SYNC ERROR]:", error);
    return { success: false, error: error.message };
  }
}
