import { prisma } from "../prisma";

export async function processAutoFollowUp() {
  const internalEmails = ["logaritma.tim@gmail.com", "tony@logaritma.id", "reza@logaritma.id", "bana@logaritma.id"];

  // 1. Ambil semua premium user untuk dieksklusikan (kita hanya follow up Free users)
  const allRevenues = await prisma.ubosRevenue.findMany({
    where: { status: "PAID" },
    select: { userId: true }
  });
  const allPremiumUserIds = new Set(allRevenues.map(r => r.userId));

  // 2. Ambil semua OWNER (Tenant) beserta metrik aktivitas mereka
  const allOwners = await prisma.user.findMany({
    where: { 
      role: "OWNER",
      email: { notIn: internalEmails }
    },
    include: {
      businesses: {
        include: {
          _count: {
            select: { products: true, sales: true }
          }
        }
      }
    }
  });

  const targetFreeUsers = allOwners.filter(u => !allPremiumUserIds.has(u.id));

  const queuedMessages = [];
  const todayDateString = new Date().toISOString().split('T')[0];

  for (const user of targetFreeUsers) {
    if (!user.phone) continue;

    // Hitung aktivitas / GAP
    let totalSales = 0;
    let totalProducts = 0;
    
    user.businesses.forEach((b: any) => {
      if (b._count) {
        totalSales += b._count.sales || 0;
        totalProducts += b._count.products || 0;
      }
    });

    let status = "";
    let message = "";

    if (!user.businesses || user.businesses.length === 0) {
      status = "Baru Daftar (Pasif)";
      message = `Halo Kak ${user.name || 'Pebisnis'}! 👋\n\nSelamat datang di *UBOS* (UMKM Business Operation System). Kami perhatikan Kakak belum membuat toko/bisnis di aplikasi.\n\nYuk mulai set-up toko pertama Kakak agar bisa langsung akses fitur Kasir dan Katalog GRATIS!\nBuka aplikasi sekarang: https://ubos.logaritma.id`;
    } else if (totalSales > 0) {
      status = "Aktif Berjualan";
      // Kita tidak perlu memborbardir user yang sudah aktif berjualan, kecuali promosi VIP.
      continue;
    } else if (totalProducts > 0) {
      status = "Sedang Setup Katalog";
      message = `Halo Kak ${user.name || 'Pebisnis'}! Keren banget, katalog produk Kakak di *UBOS* sudah mulai terisi! 🤩\n\nTips: Pastikan foto produk menarik dan HPP diisi dengan benar agar sistem kami bisa menghitung profit margin otomatis ya Kak.\n\nKalo butuh bantuan, tim UBOS siap membantu! Lanjut setup katalog di: https://ubos.logaritma.id/katalog`;
    } else {
      status = "Toko Dibuat (Belum Ada Produk)";
      message = `Halo Kak ${user.name || 'Pebisnis'}! Toko Kakak sudah berhasil dibuat di *UBOS* 🎉\n\nNamun sepertinya Kakak belum menambahkan produk pertama. Ayo masukkan 1 produk andalan Kakak sekarang, cuma butuh waktu 1 menit kok!\n\nMasuk ke sini untuk tambah produk: https://ubos.logaritma.id/katalog`;
    }

    // 3. Frequency Capping: Jangan follow-up user yang sama dengan status yang sama dalam 3 hari terakhir.
    // Kita gunakan idempotencyKey format: AUTO_FOLLOWUP_${userId}_${status}_${todayDateString}
    // Tapi karena kita ingin mencegah spam selama 3 hari, kita cukup query database apakah ada notifikasi untuk userId ini dalam 3 hari terakhir.

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentFollowUp = await prisma.ownerNotification.findFirst({
      where: {
        recipientId: user.id,
        trigger: "AUTO_FOLLOWUP",
        createdAt: { gte: threeDaysAgo }
      }
    });

    if (recentFollowUp) {
      // User ini sudah menerima follow up otomatis dalam 3 hari terakhir. Skip.
      continue;
    }

    const idempotencyKey = `AUTO_FOLLOWUP_${user.id}_${todayDateString}`;

    try {
      const notif = await prisma.ownerNotification.create({
        data: {
          recipientId: user.id,
          trigger: "AUTO_FOLLOWUP",
          reason: `GAP: ${status}`,
          message: message,
          channel: "WHATSAPP",
          status: "READY",
          priority: "MEDIUM",
          idempotencyKey: idempotencyKey
        }
      });
      queuedMessages.push(notif.id);
    } catch (e) {
      // Idempotency key conflict (sudah pernah masuk queue hari ini)
      console.log("Idempotency conflict for user", user.id);
    }
  }

  return { success: true, queued: queuedMessages.length };
}
