const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.count();
  const active = await prisma.ownerCampaign.count({ where: { status: 'ACTIVE' } });
  const nReady = await prisma.ownerNotification.count({ where: { status: 'READY' } });
  const nSent = await prisma.ownerNotification.count({ where: { status: 'SENT' } });
  const nVailed = await prisma.ownerNotification.count({ where: { status: 'FAILED' } });
  const ePend = await prisma.ownerAction.count({ where: { status: 'EXECUTED' } });
  const eComp = await prisma.ownerAction.count({ where: { status: 'EVALUATED' } });
  const lr = await prisma.ownerAction.count({ where: { learningResult: { not: null, not: 'INCONCLUSIVE' } } });
  const ag = await prisma.ownerCampaign.aggregate({ _sum: { converted: true } });
  console.log('Real Users: ' + users);
  console.log('Active Campaigns: ' + active);
  const lr = await prisma.ownerAction.count({ where: { learningResult: { not: null, not: 'INCONCLUSIVE' } } });
  console.log('Notifications Ready: ' + nReady);
  console.log('Notifications Sent: ' + nSent);
  console.log('Notifications Failed: ' + nFailed);
  console.log('Evaluations Pending: ' + ePend);
  console.log('Evaluations Completed: ' + eComp);
  const lr = await prisma.ownerAction.count({ where: { learningResult: { not: null, not: 'INCONCLUSIVE' } } });
  console.log('Conversions: ' + (ag._sum.converted || 0));
  const lr = await prisma.ownerAction.count({ where: { learningResult: { not: null, not: 'INCONCLUSIVE' } } });
  console.log('Learning Results: ' + lr);
  await prisma.$disconnect();
}
run();