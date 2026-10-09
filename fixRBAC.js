const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');

const oldLogic = `                const restrictedManager = ["/beranda", "/laporan", "/pengeluaran", "/wawasan-bisnis", "/performa-produk", "/performa-aov", "/pengaturan/target", "/pengaturan/whatsapp", "/pengaturan/pegawai"];
                if ((role === 'KASIR' || role === 'MANAGER') && restrictedManager.includes(item.href)) return null;`;

const newLogic = `                if (role === 'KASIR') {
                  const allowedKasir = ["/kasir"];
                  if (!allowedKasir.includes(item.href)) return null;
                } else if (role === 'MANAGER') {
                  const allowedManager = ["/kasir", "/stok", "/katalog"];
                  if (!allowedManager.includes(item.href)) return null;
                }`;

if (code.includes(oldLogic)) {
  fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', code.replace(oldLogic, newLogic));
  console.log("DesktopSidebar updated");
} else {
  console.log("Could not find old logic in DesktopSidebar");
}

let mobCode = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');
const oldMobLogic = `    // Filter for role
    if (role === "KASIR") {
      const allowedKasir = ["/katalog", "/pelanggan"]; // Kasir only sees limited items in "Lainnya"
      menuCategories = menuCategories.map(cat => ({
        ...cat,
        links: cat.links.filter(l => allowedKasir.includes(l.href))
      })).filter(cat => cat.links.length > 0);
    } else if (role === "MANAGER") {
      const restrictedManager = ["/laporan", "/pengeluaran", "/wawasan-bisnis", "/performa-produk", "/performa-aov", "/pengaturan/target", "/pengaturan/whatsapp", "/pengaturan/pegawai"];
      menuCategories = menuCategories.map(cat => ({
        ...cat,
        links: cat.links.filter(l => !restrictedManager.includes(l.href))
      })).filter(cat => cat.links.length > 0);
    }`;

const newMobLogic = `    // Filter for role
    if (role === "KASIR") {
      const allowedKasir: string[] = []; // Kasir only sees POS, which is already in main tabs, nothing in Lainnya
      menuCategories = menuCategories.map(cat => ({
        ...cat,
        links: cat.links.filter(l => allowedKasir.includes(l.href))
      })).filter(cat => cat.links.length > 0);
    } else if (role === "MANAGER") {
      const allowedManager = ["/stok", "/katalog"];
      menuCategories = menuCategories.map(cat => ({
        ...cat,
        links: cat.links.filter(l => allowedManager.includes(l.href))
      })).filter(cat => cat.links.length > 0);
    }`;

if (mobCode.includes(oldMobLogic)) {
  fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', mobCode.replace(oldMobLogic, newMobLogic));
  console.log("MobileBottomNav updated");
} else {
  console.log("Could not find old logic in MobileBottomNav");
}
