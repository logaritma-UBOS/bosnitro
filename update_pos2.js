const fs = require('fs');
let content = fs.readFileSync('src/actions/pos.ts', 'utf8');

content = content.replace('paidAmount: number = 0, customerId?: string, promoCode?: string) {', 'paidAmount: number = 0, customerId?: string, promoCode?: string, campaignId?: string) {');
content = content.replace('promoId: promoId || null,', 'promoId: promoId || null,\n          campaignId: campaignId || null,');

fs.writeFileSync('src/actions/pos.ts', content, 'utf8');