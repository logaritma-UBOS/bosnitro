const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ select: { id: true, email: true }});
  const revenues = await prisma.ubosRevenue.findMany();
  
  for (const u of users) {
    let tier = "Starter";
    if (u.email === "warunkarsi23@gmail.com") {
      tier = "Lifetime";
    } else {
      const isPaid = revenues.find(r => r.userId === u.id && r.status === "PAID");
      if (isPaid) tier = "Pro";
    }
    console.log(`${u.email} -> ${tier}`);
  }
}
check().catch(console.error).finally(() => prisma.$disconnect());
