const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const members = [
    { email: "logaritma.tim@gmail.com", name: "Baim", role: "SUPER_ADMIN", sharePercentage: 40 },
    { email: "tony@logaritma.id", name: "Tony", role: "METHODOLOGY", sharePercentage: 25 },
    { email: "reza@logaritma.id", name: "Reza", role: "DEVELOPER", sharePercentage: 20 },
    { email: "bana@logaritma.id", name: "Bana", role: "OPERATIONS", sharePercentage: 15 },
  ];

  for (const m of members) {
    await prisma.teamMember.upsert({
      where: { email: m.email },
      update: m,
      create: m
    });
  }
  console.log("Team seeded successfully");
}

main().finally(() => prisma.$disconnect());
