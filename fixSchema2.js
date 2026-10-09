const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

const regex = /showInStore      Boolean          @default\(true\) \/\/ TOKO ONLINE VISIBILITY\s*\/\/\s*Phase 1: Unified Item Behavior Flags\s*isSellable     Boolean   @default\(true\)/;
const replacement = `showInStore      Boolean          @default(true) // TOKO ONLINE VISIBILITY

  // Phase 1: Unified Item Behavior Flags
  currentStock   Float     @default(0)
  minStock       Float     @default(0)
  isSellable     Boolean   @default(true)`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('prisma/schema.prisma', code);
  console.log("Success");
} else {
  console.log("Regex not matched");
}
