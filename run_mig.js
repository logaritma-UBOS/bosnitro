const fs = require('fs');
let env = fs.readFileSync('.env.production.local', 'utf-8');
const lines = env.split('\n');
const dbUrlLine = lines.find(l => l.startsWith('DATABASE_URL='));
if (dbUrlLine) {
    console.log(Buffer.from(dbUrlLine).toString('base64'));
}
