const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

content = content.replace('SyncQueue              SyncQueue[]\n}', 'SyncQueue              SyncQueue[]\n  Campaign               Campaign[]\n}');

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');