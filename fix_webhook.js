const fs = require('fs');
const path = 'C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/api/webhooks/mayar/route.ts';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
             if (!existingRev && amount > 0) {
               // FASE 5: FINTECH AUTO-SPLIT PAYROLL
               const netProfit = amount; // Asumsi net amount Mayar adalah netProfit
               const reserveAmount = netProfit * 0.2;
               const poolAmount = netProfit * 0.8;
               
               await prisma.$transaction(async (tx) => {
                 // 1. Catat ke Ledger Kas Cadangan
                 await tx.teamLedger.create({
                   data: {
                     type: "RESERVE_ALLOCATION",
                     amount: reserveAmount,
                     description: \`Otomatis (Mayar) - Alokasi 20% dari Trx \${trxId}\`
                   }
                 });

                 // 2. Bagi ke anggota
                 const members = await tx.teamMember.findMany();
                 for (const m of members) {
                   const share = (m.sharePercentage / 100) * poolAmount;
                   
                   await tx.teamMember.update({
                     where: { id: m.id },
                     data: {
                       walletBalance: { increment: share },
                       totalEarned: { increment: share }
                     }
                   });
           
                   await tx.teamLedger.create({
                     data: {
                       teamMemberId: m.id,
                       type: "ROYALTY",
                       amount: share,
                       description: \`Otomatis (Mayar) - Royalti \${m.sharePercentage}% dari Trx \${trxId}\`
                     }
                   });
                 }
               });
             }
`;

code = code.replace(
    /if \(!existingRev && amount > 0\) \{[\s\S]*?\}\s*\}/,
    replacement
);

fs.writeFileSync(path, code, 'utf8');
console.log('Mayar webhook updated with Auto-Split Payroll!');
