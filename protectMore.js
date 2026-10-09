const fs = require('fs');

function protectFile(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  if (!code.includes('if (session.user.role === "KASIR"')) {
    code = code.replace(
      'if (!session?.user?.id) redirect("/login")',
      'if (!session?.user?.id) redirect("/login")\n  if (session.user.role === "KASIR") redirect("/kasir")'
    );
    // some files might just have redirect("/") or similar, let's catch standard pattern
    if (!code.includes('session.user.role === "KASIR"')) {
        code = code.replace(
          'const session = await auth()',
          'const session = await auth()\n  if (session?.user?.role === "KASIR") redirect("/kasir")'
        );
    }
    fs.writeFileSync(path, code);
    console.log(path + " protected");
  }
}

protectFile('src/app/(dashboard)/stok/page.tsx');
protectFile('src/app/(dashboard)/pelanggan/page.tsx');
protectFile('src/app/(dashboard)/pengeluaran/page.tsx');
protectFile('src/app/(dashboard)/laporan/page.tsx');
