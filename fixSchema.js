const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

const target = `  // Phase 1: Unified Item Behavior Flags
  isSellable     Boolean   @default(true)`;

const replacement = `  // Phase 1: Unified Item Behavior Flags
  currentStock   Float     @default(0)
  minStock       Float     @default(0)
  isSellable     Boolean   @default(true)`;

code = code.replace(target, replacement);
fs.writeFileSync('prisma/schema.prisma', code);
