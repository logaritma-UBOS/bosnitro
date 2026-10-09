const fs = require('fs');
let page = fs.readFileSync('src/app/(dashboard)/kasir/struk/[id]/page.tsx', 'utf8');

page = page.replace(
  /const business = await prisma\.business\.findFirst\(\{\s+where: \{ userId: session\.user\.id \},/,
  `const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({
    where: whereClause,`
);

fs.writeFileSync('src/app/(dashboard)/kasir/struk/[id]/page.tsx', page);
console.log('Fixed struk whereClause');
