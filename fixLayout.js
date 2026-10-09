const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/layout.tsx', 'utf8');

code = code.replace(
  `const business = await prisma.business.findFirst({ \n    where: { userId: session.user.id } \n  })`,
  `const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })`
);

fs.writeFileSync('src/app/(dashboard)/layout.tsx', code);
