const fs = require('fs');
const filesToSecure = ['src/actions/finance.ts', 'src/actions/businessInsights.ts', 'src/actions/history.ts', 'src/actions/aovMargin.ts', 'src/actions/productPerformance.ts', 'src/actions/salesTime.ts', 'src/actions/settings.ts'];

for (const file of filesToSecure) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    'if (!session?.user?.id) throw new Error("Unauthorized")',
    'if (!session?.user?.id) throw new Error("Unauthorized")\n  if ((session.user as any).role === "KASIR") throw new Error("Kasir tidak memiliki akses ke data ini")'
  );
  fs.writeFileSync(file, content);
  console.log('Secured', file);
}
