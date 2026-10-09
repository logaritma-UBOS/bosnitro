const fs = require('fs');
let code = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');

code = code.replace(
  'export default function MobileBottomNav() {',
  'export default function MobileBottomNav({ role = "OWNER" }: { role?: string }) {'
);

const catSearch = `
  const menuCategories = [
    {`;
const catReplace = `
  let menuCategories = [
    {`;

code = code.replace(catSearch, catReplace);

const filterInjection = `
  // Filter for role
  if (role === "KASIR") {
    const allowedKasir = ["/katalog", "/pelanggan"]; // Kasir only sees limited items in "Lainnya"
    menuCategories = menuCategories.map(cat => ({
      ...cat,
      links: cat.links.filter(l => allowedKasir.includes(l.href))
    })).filter(cat => cat.links.length > 0);
  } else if (role === "MANAGER") {
    const restrictedManager = ["/laporan", "/pengeluaran", "/wawasan-bisnis", "/performa-produk", "/performa-aov", "/pengaturan/target", "/pengaturan/whatsapp"];
    menuCategories = menuCategories.map(cat => ({
      ...cat,
      links: cat.links.filter(l => !restrictedManager.includes(l.href))
    })).filter(cat => cat.links.length > 0);
  }

  return (`;

code = code.replace('  return (\n    <>', filterInjection + '\n    <>');

fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', code);
