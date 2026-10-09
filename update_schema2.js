const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

content = content.replace('promos         Promo[]', 'promos         Promo[]\n  contentPlans   ContentPlan[]\n  campaigns      Campaign[]');

content = content.replace('category          String?  // BARU, AKTIF, LAMA\n  sales             Sale[]\n}', 'category          String?  // BARU, AKTIF, LAMA\n  sales             Sale[]\n  campaigns         Campaign[]\n}');

content = content.replace('isActive        Boolean   @default(true)\n  sales           Sale[]', 'isActive        Boolean   @default(true)\n  sales           Sale[]\n  campaigns       Campaign[]');

content = content.replace('syncedAt            DateTime?\n  saleItems           SaleItem[]\n}', 'syncedAt            DateTime?\n  saleItems           SaleItem[]\n  campaignId          String?\n  campaign            Campaign?  @relation(fields: [campaignId], references: [id])\n}');

content += `

// 7. Content Planner
model ContentPlan {
  id              String    @id @default(uuid())
  businessId      String
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  title           String
  platform        String    // TIKTOK, INSTAGRAM, FACEBOOK, WHATSAPP_STATUS
  status          String    // DRAFT, SIAP_POSTING, SUDAH_POSTING
  cta             String?
  targetUrl       String?
  postDate        DateTime?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  campaigns       Campaign[]
}

// 8. Marketing Campaigns (WhatsApp Blast layer)
model Campaign {
  id            String       @id @default(uuid())
  businessId    String
  business      Business     @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name          String
  contentPlanId String?
  contentPlan   ContentPlan? @relation(fields: [contentPlanId], references: [id])
  targetSegment String       // BARU, AKTIF, LOYAL, BERISIKO, TIDAK_AKTIF, SEMUA
  message       String?
  cta           String?
  promoId       String?
  promo         Promo?       @relation(fields: [promoId], references: [id])
  linkUrl       String?
  status        String       @default("DRAFT") // DRAFT, SIAP_DIKIRIM, TERKIRIM, SELESAI
  sentAt        DateTime?
  
  sales         Sale[]
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}
`;

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');