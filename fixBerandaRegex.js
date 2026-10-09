const fs = require('fs');
let page = fs.readFileSync('src/app/(dashboard)/beranda/page.tsx', 'utf8');

page = page.replace(
  /const business = await prisma\.business\.findFirst\(\{\s+where: \{ userId: session\?\.user\?\.id as string \},/,
  `const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user?.id as string };
  const business = await prisma.business.findFirst({
    where: whereClause,`
);

fs.writeFileSync('src/app/(dashboard)/beranda/page.tsx', page);
console.log('Fixed beranda whereClause for real');
