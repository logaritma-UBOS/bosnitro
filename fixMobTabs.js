const fs = require('fs');
let code = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');

// Replace <Link href="/katalog" ...> with {role !== "KASIR" && (<Link href="/katalog" ...> ... </Link>)}
// Replace <Link href="/riwayat" ...> with {role !== "KASIR" && (<Link href="/riwayat" ...> ... </Link>)}

const katalogRegex = /(<Link href="\/katalog" className=\{navItemClass\("\/katalog"\)\}>[\s\S]*?<span className="text-\[10px\] font-semibold mt-0\.5">Katalog<\/span>\s*<\/Link>)/;
const riwayatRegex = /(<Link href="\/riwayat" className=\{navItemClass\("\/riwayat"\)\}>[\s\S]*?<span className="text-\[10px\] font-semibold mt-0\.5">Riwayat<\/span>\s*<\/Link>)/;

if (katalogRegex.test(code)) {
  code = code.replace(katalogRegex, '{role !== "KASIR" && ($1)}');
  console.log("Katalog gated.");
}

if (riwayatRegex.test(code)) {
  code = code.replace(riwayatRegex, '{role !== "KASIR" && ($1)}');
  console.log("Riwayat gated.");
}

fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', code);
