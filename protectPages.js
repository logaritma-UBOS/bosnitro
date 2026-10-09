const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/beranda/page.tsx', 'utf8');

if (!code.includes('if (session.user.role === "KASIR"')) {
  code = code.replace(
    'if (!session?.user?.id) redirect("/login")',
    'if (!session?.user?.id) redirect("/login")\n  if (session.user.role === "KASIR") redirect("/kasir")'
  );
  fs.writeFileSync('src/app/(dashboard)/beranda/page.tsx', code);
  console.log("beranda page protected");
}

let catCode = fs.readFileSync('src/app/(dashboard)/katalog/page.tsx', 'utf8');
if (!catCode.includes('if (session.user.role === "KASIR"')) {
  catCode = catCode.replace(
    'if (!session?.user?.id) redirect("/login")',
    'if (!session?.user?.id) redirect("/login")\n  if (session.user.role === "KASIR") redirect("/kasir")'
  );
  fs.writeFileSync('src/app/(dashboard)/katalog/page.tsx', catCode);
  console.log("katalog page protected");
}

let riwayatCode = fs.readFileSync('src/app/(dashboard)/riwayat/page.tsx', 'utf8');
if (!riwayatCode.includes('if (session.user.role === "KASIR"')) {
  riwayatCode = riwayatCode.replace(
    'if (!session?.user?.id) redirect("/login")',
    'if (!session?.user?.id) redirect("/login")\n  if (session.user.role === "KASIR") redirect("/kasir")'
  );
  fs.writeFileSync('src/app/(dashboard)/riwayat/page.tsx', riwayatCode);
  console.log("riwayat page protected");
}
