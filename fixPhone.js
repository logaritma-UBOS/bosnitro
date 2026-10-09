const fs = require('fs');
let code = fs.readFileSync('src/app/api/user/status/route.ts', 'utf8');
code = code.replace(
  /hasPhone: !!user\.phone/g,
  'hasPhone: !!user.phone || user.role === "KASIR" || user.role === "MANAGER"'
);
fs.writeFileSync('src/app/api/user/status/route.ts', code);
