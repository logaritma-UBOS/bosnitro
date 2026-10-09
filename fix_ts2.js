const fs = require('fs');
const path = 'src/app/pengaturan/whatsapp/WaSettingsClient.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/variant="default"/g, '');
fs.writeFileSync(path, content, 'utf8');