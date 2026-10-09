const fs = require('fs');

const path = 'src/app/marketing/MarketingClient.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("Kirim Blast (Mock)", "Kirim Blast WA");

fs.writeFileSync(path, content, 'utf8');