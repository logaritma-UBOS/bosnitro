const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

code = code.replace(
  'role          String    @default("OWNER")',
  'role          String    @default("OWNER")\n  staffBusinessId String?\n  staffBusiness   Business? @relation("BusinessStaffs", fields: [staffBusinessId], references: [id], onDelete: SetNull)'
);

code = code.replace(
  'settings        BusinessSetting?',
  'settings        BusinessSetting?\n  staffs          User[]    @relation("BusinessStaffs")'
);

fs.writeFileSync('prisma/schema.prisma', code);
