import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const deleted = await prisma.ubosRevenue.deleteMany({
    where: {
      mayarTrxId: {
        startsWith: 'trx_direct_'
      }
    }
  })
  console.log(`Deleted ${deleted.count} dummy records`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
