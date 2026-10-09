const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.product.findFirst({ where: { name: 'Bacang Daging' } })
  .then(x => console.log('SUPPLIER:', x?.supplierId))
  .finally(() => p.$disconnect());
