const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      emailVerified: null
    },
    data: {
      emailVerified: new Date()
    }
  });
  console.log(`Updated ${result.count} users to have emailVerified.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
