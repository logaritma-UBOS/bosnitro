const fs = require('fs');

function replaceInputs(file, mappings) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const map of mappings) {
        if (content.includes(map.from)) {
            content = content.replace(new RegExp(map.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), map.to);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
    }
}

replaceInputs('src/app/katalog/bahan/[id]/edit/EditIngredientClient.tsx', [
    {from: '<input name="purchasePrice" type="number"', to: '<FormattedNumberInput name="purchasePrice"'},
    {from: '<input name="purchaseQuantity" type="number"', to: '<FormattedNumberInput name="purchaseQuantity"'},
    {from: '<input name="currentStock" type="number"', to: '<FormattedNumberInput name="currentStock"'},
    {from: '<input name="manualCostPerUnit" type="number"', to: '<FormattedNumberInput name="manualCostPerUnit"'}
]);
replaceInputs('src/app/katalog/bahan/tambah/page.tsx', [
    {from: '<input name="purchasePrice" type="number"', to: '<FormattedNumberInput name="purchasePrice"'},
    {from: '<input name="purchaseQuantity" type="number"', to: '<FormattedNumberInput name="purchaseQuantity"'},
    {from: '<input name="currentStock" type="number"', to: '<FormattedNumberInput name="currentStock"'},
    {from: '<input name="manualCostPerUnit" type="number"', to: '<FormattedNumberInput name="manualCostPerUnit"'}
]);
replaceInputs('src/app/katalog/produk/tambah/TambahProdukClient.tsx', [
    {from: '<input name="sellPrice" type="number"', to: '<FormattedNumberInput name="sellPrice"'},
    {from: '<input name="purchaseCost" type="number"', to: '<FormattedNumberInput name="purchaseCost"'},
    {from: '<input name="initialStock" type="number"', to: '<FormattedNumberInput name="initialStock"'}
]);
replaceInputs('src/app/katalog/produk/[id]/edit/EditProductClient.tsx', [
    {from: '<input name="sellPrice" type="number"', to: '<FormattedNumberInput name="sellPrice"'},
    {from: '<input name="purchaseCost" type="number"', to: '<FormattedNumberInput name="purchaseCost"'}
]);
replaceInputs('src/app/pengeluaran/tambah/page.tsx', [
    {from: '<input name="amount" type="number"', to: '<FormattedNumberInput name="amount"'}
]);
