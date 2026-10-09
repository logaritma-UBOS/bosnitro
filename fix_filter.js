const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/UbosFeed.tsx', 'utf8');
code = code.replace(/const filtered = a\.filter.*?setArticles\(filtered\);/s, 'setArticles(a);');
fs.writeFileSync('src/components/dashboard/UbosFeed.tsx', code);
console.log('Fixed');
