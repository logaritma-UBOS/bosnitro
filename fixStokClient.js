const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/stok/StokClient.tsx', 'utf8');

const target = `{stockItemType === "PRODUCT" ? \`Rp \${item.sellPrice.toLocaleString('id-ID')}\` : \`Stok: \${item.currentStock} \${item.unit}\`}`;
const replacement = `{stockItemType === "PRODUCT" ? \`Stok: \${item.currentStock || 0} • Rp \${item.sellPrice.toLocaleString('id-ID')}\` : \`Stok: \${item.currentStock} \${item.unit}\`}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/app/(dashboard)/stok/StokClient.tsx', code);
console.log("Updated StokClient");
