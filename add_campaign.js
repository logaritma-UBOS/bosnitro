const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Add Campaign model
const campaignModel = `
model Campaign {
  id            String       @id @default(uuid())
  businessId    String
  name          String
  contentPlanId String?
  targetSegment String       
  message       String?
  cta           String?
  promoId       String?
  linkUrl       String?
  status        String       @default("DRAFT")
  sentAt        DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  ContentPlan   ContentPlan? @relation(fields: [contentPlanId], references: [id])
  Promo         Promo?       @relation(fields: [promoId], references: [id])
  Business      Business     @relation(fields: [businessId], references: [id], onDelete: Cascade)
  Sale          Sale[]
}
`;
if (!content.includes('model Campaign {')) {
  content += campaignModel;
}

// 2. Add Campaign relation to Business
content = content.replace('User                   User                     @relation(fields: [userId], references: [id])\n}', 'User                   User                     @relation(fields: [userId], references: [id])\n  Campaign               Campaign[]\n}');

// 3. Add Campaign relation to Promo
content = content.replace('Sale            Sale[]\n\n  @@unique([businessId, code])\n}', 'Sale            Sale[]\n  Campaign        Campaign[]\n\n  @@unique([businessId, code])\n}');

// 4. Add Campaign relation to ContentPlan
content = content.replace('Business   Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)\n}', 'Business   Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)\n  Campaign   Campaign[]\n}');

// 5. Add Campaign relation to Sale
content = content.replace('Promo               Promo?     @relation(fields: [promoId], references: [id])', 'Promo               Promo?     @relation(fields: [promoId], references: [id])\n  campaignId          String?\n  Campaign            Campaign?  @relation(fields: [campaignId], references: [id])');

// Add @default(uuid()) to all @id fields because db pull removed them
content = content.replace(/@id\n/g, '@id @default(uuid())\n');
content = content.replace(/@id$/gm, '@id @default(uuid())');

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');