
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const f = await prisma.pilotFeedback.count();
  const c = await prisma.ubosFeedContent.count();
  const p = await prisma.promo.count();
  const o = await prisma.ownerCampaign.count();
  console.log({f, c, p, o});
}
test().finally(()=>prisma.\());

