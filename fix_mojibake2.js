const fs = require('fs');

function fixFile(file, replacements) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const [mojibake, correct] of replacements) {
        if (content.includes(mojibake)) {
            content = content.split(mojibake).join(correct);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed ' + file);
    }
}

fixFile('./src/app/katalog/produk/[id]/page.tsx', [
    ['â–¼', '▼']
]);

fixFile('./src/app/page.tsx', [
    ['â–¼', '▼'],
    ['â†’', '→']
]);