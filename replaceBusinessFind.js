const fs = require('fs');
const path = require('path');

const searchStr = 'const business = await prisma.business.findFirst({ where: { userId: session.user.id } })';
const replaceStr = 'const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };\n  const business = await prisma.business.findFirst({ where: whereClause })';

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(searchStr)) {
        content = content.replace(new RegExp(searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceStr);
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceInDir('src');
