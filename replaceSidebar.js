const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');

code = code.replace(
  'export default function DesktopSidebar({ businessName }: { businessName?: string }) {',
  'export default function DesktopSidebar({ businessName, role = "OWNER" }: { businessName?: string, role?: string }) {'
);

// We need to filter menus based on role
// Let's find the `const menuGroups = [` and wrap it or filter it.
// Actually, it's easier to filter it dynamically before rendering.
// Let's replace the `const menuGroups = [` with a function or just filter it inside.

const injectFilter = `
  const menuGroups = [`;
  
const filteredMenuGroups = `
  const rawMenuGroups = [`;

code = code.replace(injectFilter, filteredMenuGroups);

// Now find where menuGroups is used: `{menuGroups.map((group, index) => (`
const mapSearch = `{menuGroups.map((group, index) => (`;
const mapReplace = `
  // Filter menu based on role
  const menuGroups = rawMenuGroups.map(group => {
    let items = group.items;
    
    if (role === "KASIR") {
      // Kasir can only see POS (Kasir), Riwayat, Katalog (without editing), Pelanggan
      const allowedKasir = ["/kasir", "/riwayat", "/katalog", "/pelanggan"];
      items = items.filter(i => allowedKasir.includes(i.href));
    } else if (role === "MANAGER") {
      // Manager can't see reports or settings
      const restrictedManager = ["/laporan", "/pengeluaran", "/wawasan-bisnis", "/performa-produk", "/performa-aov", "/pengaturan/target", "/pengaturan/whatsapp"];
      items = items.filter(i => !restrictedManager.includes(i.href));
    }
    
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  {menuGroups.map((group, index) => (`;

code = code.replace(mapSearch, mapReplace);

fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', code);
