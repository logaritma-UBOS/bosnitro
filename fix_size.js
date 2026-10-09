const fs = require('fs');

const path = 'src/app/pengaturan/whatsapp/WaSettingsClient.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/ size="sm"/g, '');

fs.writeFileSync(path, content, 'utf8');