const fs = require('fs');

function fixFile(file, replacements) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (let r of replacements) {
        if (content.includes(r.from)) {
            content = content.replace(new RegExp(r.from, 'g'), r.to);
            changed = true;
        }
    }
    if (changed) {
        if (!content.includes('FormattedNumberInput')) {
            content = content.replace(/import \{/, "import { FormattedNumberInput } from '@/components/FormattedNumberInput'\nimport {");
        }
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed ' + file);
    }
}

fixFile('src/app/katalog/bahan/[id]/edit/EditIngredientClient.tsx', [
    {from: '<input name="purchasePrice" type="number"', to: '<FormattedNumberInput name="purchasePrice"'},
    {from: '<input name="purchaseQuantity" type="number"', to: '<FormattedNumberInput name="purchaseQuantity"'},
    {from: '<input name="currentStock" type="number"', to: '<FormattedNumberInput name="currentStock"'},
    {from: '<input name="manualCostPerUnit" type="number"', to: '<FormattedNumberInput name="manualCostPerUnit"'}
]);

fixFile('src/app/katalog/produk/[id]/edit/EditProductClient.tsx', [
    {from: '<input name="sellPrice" type="number"', to: '<FormattedNumberInput name="sellPrice"'},
    {from: '<input name="purchaseCost" type="number"', to: '<FormattedNumberInput name="purchaseCost"'}
]);