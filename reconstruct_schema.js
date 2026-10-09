const fs = require('fs');

// Start from clean git state
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Add Promo model
const promoModel = `

// 6. Promo Engine
model Promo {
  id              String    @id @default(uuid())
  businessId      String
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name            String
  code            String
  discountType    String    // PERCENTAGE, FIXED
  discountValue   Float
  minimumPurchase Float?
  startAt         DateTime?
  endAt           DateTime?
  maxUsage        Int?
  usageCount      Int       @default(0)
  targetSegment   String?   // BARU, AKTIF, LOYAL, dll
  isActive        Boolean   @default(true)
  sales           Sale[]
  campaigns       Campaign[]

  @@unique([businessId, code])
}
`;

// 2. Add ContentPlan model
const contentPlanModel = `

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
`;

// 3. Add Campaign model
const campaignModel = `

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

// Append models
if (!content.includes('model Promo')) content += promoModel;
if (!content.includes('model ContentPlan')) content += contentPlanModel;
if (!content.includes('model Campaign')) content += campaignModel;

// 4. Update Business model
content = content.replace('pilotFeedbacks PilotFeedback[]', 'pilotFeedbacks PilotFeedback[]\n  promos         Promo[]\n  contentPlans   ContentPlan[]\n  campaigns      Campaign[]');

// 5. Update Customer model
content = content.replace('category          String?  // BARU, AKTIF, LAMA\n  sales             Sale[]\n}', 'category          String?  // BARU, AKTIF, LAMA\n  sales             Sale[]\n}');

// 6. Update Sale model
// Be careful with replacing exactly.
content = content.replace('syncedAt            DateTime?\n  saleItems           SaleItem[]\n}', 'syncedAt            DateTime?\n  saleItems           SaleItem[]\n  promoId             String?\n  promo               Promo?     @relation(fields: [promoId], references: [id])\n  campaignId          String?\n  campaign            Campaign?  @relation(fields: [campaignId], references: [id])\n}');


fs.writeFileSync('prisma/schema.prisma', content, 'utf8');