const fs = require('fs');
let ds = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');

const filterCode = `
              {group.items.map((item) => {
                const restrictedManager = ["/laporan", "/pengeluaran", "/wawasan-bisnis", "/performa-produk", "/performa-aov", "/pengaturan/target", "/pengaturan/whatsapp", "/pengaturan/pegawai"];
                if ((role === 'KASIR' || role === 'MANAGER') && restrictedManager.includes(item.href)) return null;
`;

ds = ds.replace(
  '              {group.items.map((item) => {',
  filterCode
);

fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', ds);
console.log('Fixed DesktopSidebar Role');
