const fs = require('fs');
let content = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');
content = content.replace(/href: "\/"/g, 'href: "/beranda"');
fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', content);

content = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');
content = content.replace(/href="\/"/g, 'href="/beranda"');
fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', content);

content = fs.readFileSync('src/components/layout/AppShell.tsx', 'utf8');
content = content.replace(/href="\/"/g, 'href="/beranda"');
fs.writeFileSync('src/components/layout/AppShell.tsx', content);

content = fs.readFileSync('src/app/login/page.tsx', 'utf8');
content = content.replace(/callbackUrl: "\/"/g, 'callbackUrl: "/beranda"');
fs.writeFileSync('src/app/login/page.tsx', content);
