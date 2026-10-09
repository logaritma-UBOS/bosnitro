const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/(dashboard)/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Pattern 1: findFirst with where: { userId: session.user.id }
  if (content.includes('where: { userId: session.user.id }') && !content.includes('staffBusinessId')) {
    content = content.replace(
      /const business = await prisma\.business\.findFirst\(\{\s*where: \{ userId: session\.user\.id \},/g,
      `const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({
    where: whereClause,`
    );
    changed = true;
  }

  // Pattern 2: edit product
  if (content.includes('where: { business: { userId: session.user.id } }') && !content.includes('staffBusinessId')) {
    content = content.replace(
      /where: \{ business: \{ userId: session\.user\.id \} \}/g,
      `where: (session.user as any).staffBusinessId ? { businessId: (session.user as any).staffBusinessId } : { business: { userId: session.user.id } }`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
