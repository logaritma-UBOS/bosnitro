const fs = require('fs');

// Optimize Dashboard page.tsx
let pageContent = fs.readFileSync('src/app/admin/pilot/(dashboard)/page.tsx', 'utf8');
const targetPage = `  // TEAM OS DATA
  const members = await prisma.teamMember.findMany({
      include: {
          tasks: {
              where: {
                  date: {
                      gte: new Date(new Date().setHours(0,0,0,0)),
                      lt: new Date(new Date().setHours(23,59,59,999))
                  }
              }
          }
      }
  });

  const totalReserve = await prisma.teamLedger.aggregate({
    where: { type: "RESERVE_ALLOCATION" },
    _sum: { amount: true }
  });
  
  const totalDistributed = await prisma.teamLedger.aggregate({
    where: { type: "ROYALTY_DISTRIBUTION" },
    _sum: { amount: true }
  });`;

const newPage = `  // TEAM OS DATA
  const [members, totalReserve, totalDistributed] = await Promise.all([
    prisma.teamMember.findMany({
      include: {
        tasks: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0,0,0,0)),
              lt: new Date(new Date().setHours(23,59,59,999))
            }
          }
        }
      }
    }),
    prisma.teamLedger.aggregate({
      where: { type: "RESERVE_ALLOCATION" },
      _sum: { amount: true }
    }),
    prisma.teamLedger.aggregate({
      where: { type: "ROYALTY_DISTRIBUTION" },
      _sum: { amount: true }
    })
  ]);`;

if (pageContent.includes("const members = await prisma.teamMember.findMany")) {
    pageContent = pageContent.replace(targetPage, newPage);
    fs.writeFileSync('src/app/admin/pilot/(dashboard)/page.tsx', pageContent, 'utf8');
    console.log("Optimized page.tsx");
} else {
    console.log("Failed to optimize page.tsx");
}

// Optimize methodology/page.tsx
let methodContent = fs.readFileSync('src/app/admin/pilot/(dashboard)/methodology/page.tsx', 'utf8');
const targetMethod = `  // Get high-level metrics
  const totalUsers = await prisma.user.count();
  const paidRevenues = await prisma.ubosRevenue.findMany({ where: { status: "PAID" } });
  const totalRevenue = paidRevenues.reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalReserve = await prisma.teamLedger.aggregate({
    where: { type: "RESERVE_ALLOCATION" },
    _sum: { amount: true }
  });
  const reserveBalance = totalReserve._sum.amount || 0;

  const members = await prisma.teamMember.findMany({
    include: {
      tasks: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0,0,0,0)),
            lt: new Date(new Date().setHours(23,59,59,999))
          }
        }
      }
    }
  });`;

const newMethod = `  // Get high-level metrics
  const [totalUsers, paidRevenues, totalReserve, members] = await Promise.all([
    prisma.user.count(),
    prisma.ubosRevenue.findMany({ where: { status: "PAID" } }),
    prisma.teamLedger.aggregate({
      where: { type: "RESERVE_ALLOCATION" },
      _sum: { amount: true }
    }),
    prisma.teamMember.findMany({
      include: {
        tasks: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0,0,0,0)),
              lt: new Date(new Date().setHours(23,59,59,999))
            }
          }
        }
      }
    })
  ]);

  const totalRevenue = paidRevenues.reduce((acc, curr) => acc + curr.amount, 0);
  const reserveBalance = totalReserve._sum.amount || 0;`;

if (methodContent.includes("const totalUsers = await prisma.user.count()")) {
    methodContent = methodContent.replace(targetMethod, newMethod);
    fs.writeFileSync('src/app/admin/pilot/(dashboard)/methodology/page.tsx', methodContent, 'utf8');
    console.log("Optimized methodology page.tsx");
} else {
    console.log("Failed to optimize methodology page.tsx");
}
