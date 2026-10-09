const fs = require('fs');
let content = fs.readFileSync('src/actions/pos.ts', 'utf8');

const autoCampaignStr = `
      if (promoCode) {
        const promo = await prisma.promo.findUnique({
          where: { businessId_code: { businessId: business.id, code: promoCode } }
        })
  
        if (!promo) return { error: "Kode promo tidak ditemukan" }
        if (!promo.isActive) return { error: "Promo sudah tidak aktif" }
        
        const now = new Date()
        if (promo.startAt && promo.startAt > now) return { error: "Periode promo belum dimulai" }
        if (promo.endAt && promo.endAt < now) return { error: "Periode promo sudah berakhir" }
        
        if (promo.minimumPurchase && serverTotal < promo.minimumPurchase) {
          return { error: \`Minimal pembelian Rp \${promo.minimumPurchase.toLocaleString('id-ID')} untuk menggunakan promo ini\` }
        }
        
        if (promo.maxUsage && promo.usageCount >= promo.maxUsage) {
          return { error: "Kuota promo sudah habis" }
        }
  
        if (promo.discountType === "FIXED") {
          promoDiscount = promo.discountValue;
        } else if (promo.discountType === "PERCENTAGE") {
          promoDiscount = (serverTotal * promo.discountValue) / 100;
        }
        
        // Jangan sampai total minus
        if (promoDiscount > serverTotal) promoDiscount = serverTotal;
        promoId = promo.id;

        // Auto-assign campaignId if not provided, but promo belongs to an active campaign
        if (!campaignId) {
            const activeCampaign = await prisma.campaign.findFirst({
                where: { promoId: promo.id, businessId: business.id, status: { in: ['SIAP_DIKIRIM', 'TERKIRIM'] } },
                orderBy: { createdAt: 'desc' }
            });
            if (activeCampaign) {
                campaignId = activeCampaign.id;
            }
        }
      }
`;

const oldPromoCodeBlock = content.substring(content.indexOf('if (promoCode) {'), content.indexOf('const finalTotal = serverTotal - promoDiscount;'));

content = content.replace(oldPromoCodeBlock, autoCampaignStr + '\n      ');

fs.writeFileSync('src/actions/pos.ts', content, 'utf8');