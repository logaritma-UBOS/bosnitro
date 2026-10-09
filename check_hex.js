const fs = require('fs');
const content = fs.readFileSync('src/app/katalog/produk/tambah/TambahProdukClient.tsx', 'utf8');
const match = content.match(/<span className="text-2xl text-gray-400">([^<]+)<\/span>/);
if (match) {
    console.log("Found:", match[1]);
    for (let i = 0; i < match[1].length; i++) {
        console.log(match[1].charCodeAt(i).toString(16));
    }
}