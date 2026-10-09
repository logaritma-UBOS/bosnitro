const fs = require('fs');

function addImport(file, importStr, searchStr) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes(importStr)) {
        if (searchStr && content.includes(searchStr)) {
            content = content.replace(searchStr, importStr + '\n' + searchStr);
        } else {
            // insert after "use client" or "use server" or at top
            if (content.includes('"use client"')) {
                content = content.replace(/"use client"\r?\n/, '"use client"\n' + importStr + '\n');
            } else if (content.includes('"use server"')) {
                content = content.replace(/"use server"\r?\n/, '"use server"\n' + importStr + '\n');
            } else {
                content = importStr + '\n' + content;
            }
        }
        fs.writeFileSync(file, content, 'utf8');
    }
}

// Fix FormattedNumberInput props
let fnInput = fs.readFileSync('src/components/FormattedNumberInput.tsx', 'utf8');
fnInput = fnInput.replace('value !== undefined ? value : defaultValue', 'value !== undefined ? value : (defaultValue as string | number)');
fs.writeFileSync('src/components/FormattedNumberInput.tsx', fnInput, 'utf8');

// Fix imports in files
const formInputImport = "import { FormattedNumberInput } from '@/components/FormattedNumberInput'";
const formatImport = "import { formatNumber, formatRupiah } from '@/lib/format'";

addImport('src/app/katalog/bahan/[id]/edit/EditIngredientClient.tsx', formInputImport);
addImport('src/app/katalog/bahan/tambah/page.tsx', formInputImport);
addImport('src/app/katalog/produk/[id]/edit/EditProductClient.tsx', formInputImport);
addImport('src/app/katalog/produk/tambah/TambahProdukClient.tsx', formInputImport);
addImport('src/app/pengeluaran/tambah/page.tsx', formInputImport);
addImport('src/app/katalog/produk/[id]/page.tsx', formInputImport);
addImport('src/app/pengaturan/target/page.tsx', formInputImport);

addImport('src/app/katalog/produk/[id]/edit/EditProductClient.tsx', formatImport);
addImport('src/app/promo/PromoClient.tsx', formatImport);

// Fix formatRupiah in EditProductClient that was reverted
let edProd = fs.readFileSync('src/app/katalog/produk/[id]/edit/EditProductClient.tsx', 'utf8');
edProd = edProd.replace(/Rp\s*\{([^}]+?)\.toLocaleString\(['"]id-ID['"]\)\}/g, '{formatRupiah($1)}');
edProd = edProd.replace(/Rp\s*([a-zA-Z0-9_.\(\)\*\s\+\-]+?)\.toLocaleString\(['"]id-ID['"]\)/g, '{formatRupiah($1)}');
edProd = edProd.replace(/([a-zA-Z0-9_.\(\)\*\s\+\-]+?)\.toLocaleString\(['"]id-ID['"]\)/g, 'formatNumber($1)');
fs.writeFileSync('src/app/katalog/produk/[id]/edit/EditProductClient.tsx', edProd, 'utf8');
