const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const match = content.match(/<span className="group-open:rotate-180 transition-transform inline-block">([^<]+)<\/span>/);
if (match) {
    console.log("Found:", match[1]);
    for (let i = 0; i < match[1].length; i++) {
        console.log(match[1].charCodeAt(i).toString(16));
    }
}