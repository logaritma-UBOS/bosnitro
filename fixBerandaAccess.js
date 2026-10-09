const fs = require('fs');

// DesktopSidebar
let ds = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');
ds = ds.replace(
  'const restrictedManager = ["/laporan", "/pengeluaran", "/wawasan-bisnis", "/performa-produk", "/performa-aov", "/pengaturan/target", "/pengaturan/whatsapp", "/pengaturan/pegawai"];',
  'const restrictedManager = ["/beranda", "/laporan", "/pengeluaran", "/wawasan-bisnis", "/performa-produk", "/performa-aov", "/pengaturan/target", "/pengaturan/whatsapp", "/pengaturan/pegawai"];'
);
fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', ds);

// MobileBottomNav
let mb = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');
mb = mb.replace(
  /<Link href="\/beranda" className=\{navItemClass\("\/beranda"\)\}>([\s\S]*?)<\/Link>/m,
  '{role === "OWNER" && (<Link href="/beranda" className={navItemClass("/beranda")}>$1</Link>)}'
);
fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', mb);

// page.tsx (RootPage)
let rp = fs.readFileSync('src/app/page.tsx', 'utf8');
rp = rp.replace(
  /if \(session\?\.user\?\.id\) \{\s+redirect\("\/beranda"\)\s+\}/m,
  `if (session?.user?.id) {
    if (session.user.role === 'KASIR' || session.user.role === 'MANAGER') {
      redirect("/kasir")
    } else {
      redirect("/beranda")
    }
  }`
);
fs.writeFileSync('src/app/page.tsx', rp);

// beranda/page.tsx
let bp = fs.readFileSync('src/app/(dashboard)/beranda/page.tsx', 'utf8');
bp = bp.replace(
  /export default async function Home\(\) \{\s+const session = await auth\(\)/m,
  `export default async function Home() {
  const session = await auth()
  
  if (session?.user?.role === 'KASIR' || session?.user?.role === 'MANAGER') {
    redirect("/kasir")
  }`
);
fs.writeFileSync('src/app/(dashboard)/beranda/page.tsx', bp);

console.log('All changes applied');
