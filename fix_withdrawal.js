const fs = require('fs');
const path = 'C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/actions/teamOs.ts';
let code = fs.readFileSync(path, 'utf8');

// Add import
if (!code.includes('disburseMayar')) {
    code = code.replace(/import { prisma } from "@\/lib\/prisma"/, 'import { prisma } from "@/lib/prisma"\nimport { disburseMayar } from "@/lib/mayar"');
}

const replacement = `
    // SAFETY RULE 80% CHECKLIST
    const isMasterAdmin = member.role === "SUPER_ADMIN";
    const totalTasks = member.tasks.length;
    
    if (totalTasks === 0 && !isMasterAdmin) {
      throw new Error("Anda belum memiliki aktivitas checklist bulan ini. Selesaikan tugas harian terlebih dahulu.");
    }

    const completedTasks = member.tasks.filter(t => t.isCompleted).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;

    if (completionRate < 0.8 && !isMasterAdmin) {
      throw new Error(\`Syarat pencairan gagal: Progres checklist Anda bulan ini baru \${Math.round(completionRate * 100)}%. Minimal syarat adalah 80%.\`);
    }

    // CHECK BANK DETAILS
    if (!member.bankName || !member.bankAccount || !member.bankAccountName) {
      throw new Error("Data rekening bank Anda belum lengkap. Silakan lengkapi profil terlebih dahulu.");
    }

    // HIT MAYAR API FIRST
    const disburseRes = await disburseMayar(amount, member.bankName, member.bankAccount, member.bankAccountName, \`Payout UBOS OS untuk \${member.name}\`);
    if (!disburseRes.success) {
      throw new Error("Sistem Mayar menolak transfer. Hubungi Super Admin.");
    }

    // PROCESS WITHDRAWAL IN DB
`;

code = code.replace(
    /\/\/ SAFETY RULE 80% CHECKLIST[\s\S]*?\/\/ PROCESS WITHDRAWAL/,
    replacement + "    // PROCESS WITHDRAWAL"
);

fs.writeFileSync(path, code, 'utf8');
console.log('requestWithdrawal updated with Mayar Disbursement API!');
