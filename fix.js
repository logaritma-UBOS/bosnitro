const fs = require('fs');
let page = fs.readFileSync('src/app/admin/pilot/(dashboard)/page.tsx', 'utf8');
page = page.replace(/<span className="text-2xl">.*?<\/span>\s*Prioritas/g, '<span className="text-2xl">🎯</span> Prioritas');
fs.writeFileSync('src/app/admin/pilot/(dashboard)/page.tsx', page, 'utf8');
