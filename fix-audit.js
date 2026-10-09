const fs = require('fs');

let content = fs.readFileSync('src/lib/pilotAudit.ts', 'utf8');

const targetStr = `    message = \`🚨 *[LOGARITMA AUDIT]*\\n\\n👤 @\${userName} sedang login ke https://ubos.logaritma.id/admin/pilot hari ini jam \${jamOnly}.\\n\\n💡 *Pesan untuk tim:*\\nBagi yang belum check-in hari ini, segera login dan pantau aktivitas UBOS atau catat kontribusi Anda untuk memajukan UBOS hari ini! 🔥\`;`;

const newCode = `    const nameLower = userName.toLowerCase();
    let displayName = userName;
    let icon = '👤';
    let title = '';
    let customMessage = 'Satu amunisi kita sudah siap di posnya! Bagi tim yang belum check-in, yuk segera merapat, gas bereskan Checklist Harian, dan mari cetak rekor konversi baru hari ini! 🔥🚀';

    if (nameLower.includes('baim')) {
      icon = '👑';
      title = ' (Super Admin)';
      customMessage = 'Kapten sedang inspeksi *dashboard* utama nih! Pastikan *Checklist Harian* kalian sudah mulai dikerjakan dan progresnya hijau semua. Let\\'s go! 🔥';
    } else if (nameLower.includes('tony')) {
      icon = '🦅';
      displayName = 'Pak Tony';
      title = ' (Investor & Advisor)';
      customMessage = 'Mata elang kita sedang mengevaluasi konversi dan strategi bisnis hari ini. Siap-siap untuk diskusi *insight* dan ide segar di Linimasa Tim! 📈';
    } else if (nameLower.includes('reza')) {
      icon = '💻';
      title = ' (Developer)';
      customMessage = 'Keamanan dan stabilitas sistem sedang dijaga. Kalau ada *error* atau ide fitur baru hari ini, pastikan sudah kalian catat dan delegasikan sebagai Tiket Bug! 🛠️';
    } else if (nameLower.includes('bana')) {
      icon = '🚀';
      title = ' (Operations & QA)';
      customMessage = 'Ujung tombak operasional kita sudah *standby* untuk *follow-up* Lead dan QA sistem! Bagi yang belum login, yuk segera merapat dan tuntaskan *Checklist Harian* masing-masing! 🎯';
    }

    message = \`🟢 *[UBOS TEAM RADAR]*\\n\\n\${icon} *\${displayName}*\${title} baru saja merapat ke markas UBOS! [Jam \${jamOnly}]\\n🔗 https://ubos.logaritma.id/admin/pilot\\n\\n💡 *Pesan untuk Tim:*\\n\${customMessage}\`;`;

if (content.includes("Bagi yang belum check-in hari ini")) {
    content = content.replace(targetStr, newCode);
    fs.writeFileSync('src/lib/pilotAudit.ts', content, 'utf8');
    console.log("Success replacing.");
} else {
    console.log("String not found. Check exact match.");
}
