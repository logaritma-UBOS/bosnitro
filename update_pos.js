const fs = require('fs');
let content = fs.readFileSync('src/actions/pos.ts', 'utf8');

// The createSale function should accept `campaignId?: string` inside the `sale` object, or we can just pluck it from `sale.campaignId`.
// Looking for `promoId: sale.promoId,` inside `prisma.sale.create`
if (!content.includes('campaignId: sale.campaignId,')) {
    content = content.replace('promoId: sale.promoId,', 'promoId: sale.promoId,\n        campaignId: sale.campaignId,');
}

fs.writeFileSync('src/actions/pos.ts', content, 'utf8');