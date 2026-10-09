const fs = require("fs");
let content = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/components/layout/MobileBottomNav.tsx", "utf8");

const replacement = `  const menuCategories = [
    {
      title: "JUALAN",
      links: [
        { label: "Toko Online", href: "/toko-online", icon: "\uD83C\uDF10" },
      ]
    },
    {
      title: "KELOLA",
      links: [
        { label: "Stok & Supplier", href: "/stok", icon: "\uD83D\uDCE6" },
        { label: "Pelanggan", href: "/pelanggan", icon: "\uD83D\uDC65" },
        { label: "Pengeluaran", href: "/pengeluaran", icon: "\uD83D\uDCB8" },
      ]
    },
    {
      title: "TUMBUH",
      links: [
        { label: "Konten", href: "/konten", icon: "\uD83D\uDCDD" },
        { label: "Promo", href: "/promo", icon: "\uD83C\uDF9F\uFE0F" },
        { label: "Marketing", href: "/marketing", icon: "\uD83D\uDCF1" },
      ]
    },
    {
      title: "PAHAMI BISNIS",
      links: [
        { label: "Analisis Bisnis", href: "/wawasan-bisnis", icon: "\uD83D\uDCCA" },
        { label: "Performa Produk", href: "/performa-produk", icon: "\uD83D\uDCC8" },
        { label: "Rata-rata Belanja", href: "/performa-aov", icon: "\uD83D\uDCB0" },
        { label: "Laporan Keuangan", href: "/laporan", icon: "\uD83D\uDCC4" },
      ]
    }
  ]`;

const start = content.indexOf('const menuCategories = [');
const end = content.indexOf('  return (', start);
if (start > -1 && end > -1) {
  content = content.substring(0, start) + replacement + "\n\n" + content.substring(end);
  fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/components/layout/MobileBottomNav.tsx", content, "utf8");
  console.log("Replaced");
} else {
  console.log("Not found");
}
