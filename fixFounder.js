const fs = require('fs');
let code = fs.readFileSync('src/app/founder/FounderClient.tsx', 'utf8');
code = code.replace(
  /body: JSON\.stringify\(\{ amount: 399000 \}\)/,
  'body: JSON.stringify({ amount: 399000, planName: "Paket Founder Pass UBOS", planDesc: "Akses seumur hidup (Lifetime) ke seluruh modul UBOS" })'
);
fs.writeFileSync('src/app/founder/FounderClient.tsx', code);
