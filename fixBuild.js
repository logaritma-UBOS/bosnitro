const fs = require('fs');
let client = fs.readFileSync('src/app/(dashboard)/pengaturan/pegawai/PegawaiClient.tsx', 'utf8');
client = client.replace(/\\`/g, '`');
client = client.replace(/\\\$/g, '$');
fs.writeFileSync('src/app/(dashboard)/pengaturan/pegawai/PegawaiClient.tsx', client);

let mob = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');
mob = mob.replace(/const menuCategories = \[/g, 'let menuCategories = [');
fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', mob);
