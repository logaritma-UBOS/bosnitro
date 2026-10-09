const fs = require('fs');
const content = fs.readFileSync('src/app/katalog/bahan/[id]/edit/EditIngredientClient.tsx', 'utf8');
const match = content.match(/<Link href="\/katalog".*>([^<]+)<\/Link>/);
if (match) {
    console.log("Found:", match[1]);
    for (let i = 0; i < match[1].length; i++) {
        console.log(match[1].charCodeAt(i).toString(16));
    }
}