const fs = require('fs');

const path = 'src/app/pengaturan/whatsapp/WaSettingsClient.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/&& status !== "LOADING"/g, '');
content = content.replace(/variant="outline"/g, 'variant="secondary"');
content = content.replace(/variant="destructive"/g, 'variant="danger"');
content = content.replace(/variant="default"/g, '');

fs.writeFileSync(path, content, 'utf8');