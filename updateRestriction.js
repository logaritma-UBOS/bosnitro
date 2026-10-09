const fs = require('fs');
['src/components/layout/DesktopSidebar.tsx', 'src/components/layout/MobileBottomNav.tsx'].forEach(f => {
  let code = fs.readFileSync(f, 'utf8');
  code = code.replace(
    '"/pengaturan/whatsapp"]',
    '"/pengaturan/whatsapp", "/pengaturan/pegawai"]'
  );
  fs.writeFileSync(f, code);
});
