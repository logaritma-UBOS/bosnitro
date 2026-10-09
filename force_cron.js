
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runCron() {
  console.log("Memulai eksekusi Virtual Baim secara manual...");
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const members = await prisma.teamMember.findMany();
    let generatedCount = 0;

    for (const member of members) {
      const existingTasks = await prisma.teamTask.findMany({
        where: {
          teamMemberId: member.id,
          date: { gte: startOfDay, lt: endOfDay }
        }
      });

      // Hapus tasks hari ini jika ada, khusus untuk test agar kita bisa lihat berhasil masuk
      if (existingTasks.length > 0) {
        console.log(`Menghapus task lama untuk ${member.name} agar bisa dites ulang...`);
        await prisma.teamTask.deleteMany({
          where: { teamMemberId: member.id, date: { gte: startOfDay, lt: endOfDay } }
        });
      }

      let dailyTasks = [];

      if (member.role === "SUPER_ADMIN") {
        dailyTasks = [
          "Review Matriks Performa Tim (Matrix Board)",
          "Update feed motivasi/bisnis harian"
        ];
      } else if (member.role === "METHODOLOGY") {
        dailyTasks = [
          "Riset & Input minimal 1 Studi Kasus / Formula Bisnis ke Repository",
          "Review metrik Conversion Rate dari funnel marketing",
          "Cek Inbox Pengajuan Dana (Approve/Reject jika ada)"
        ];
      } else if (member.role === "DEVELOPER") {
        dailyTasks = [
          "Selesaikan minimal 2 Tiket Bug/Fitur dari kolom In Progress ke Done",
          "Monitor log error server & Pastikan sistem 100% Up",
          "Review performa loading aplikasi (Wajib di bawah 2 detik)"
        ];
      } else if (member.role === "OPERATIONS") {
        dailyTasks = [
          "Update laporan harian Trafik & Lead yang masuk",
          "Filter keluhan dari tim dan ubah jadi Tiket Bug untuk Reza"
        ];
        
        const starters = await prisma.user.findMany({
          where: { role: "LEAD" },
          take: 50,
          orderBy: { createdAt: "desc" }
        });
        
        const validStarters = starters.filter(u => !!u.phone).slice(0, 5);
        
        validStarters.forEach(user => {
            const namaPanggilan = user.name || user.email;
            dailyTasks.push(`Follow up user: ${namaPanggilan}`);
        });
        
        if (validStarters.length === 0) {
            dailyTasks.push("Cari minimal 5 leads baru via cold prospecting hari ini");
        }
      }

      for (const taskName of dailyTasks) {
        await prisma.teamTask.create({
          data: {
            taskName: taskName,
            isCompleted: false,
            date: new Date(),
            teamMemberId: member.id
          }
        });
        generatedCount++;
      }
      console.log(`Berhasil membuat ${dailyTasks.length} task untuk ${member.name} (${member.role})`);
    }

    console.log(`\n✅ SUKSES! Total ${generatedCount} tugas harian berhasil didistribusikan.`);
  } catch (err) {
    console.error("Gagal:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runCron();

