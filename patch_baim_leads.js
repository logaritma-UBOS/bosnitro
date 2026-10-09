const fs = require('fs');

const pagePath = 'src/app/admin/pilot/(dashboard)/page.tsx';
let c = fs.readFileSync(pagePath, 'utf8');

// 1. Add import at top (after last existing import)
const lastImport = 'import MayarBalanceWidget from "@/components/team/MayarBalanceWidget";';
const newImport = lastImport + '\nimport LeadPoolWidget from "@/components/team/LeadPoolWidget";';
c = c.replace(lastImport, newImport);

// 2. Add ManualLead query after activeUsers query
const afterQuery = 'const totalUsers = await prisma.user.count();';
const leadQuery = `${afterQuery}

  // LEAD POOL DATA for Baim
  const manualLeads = await prisma.manualLead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
          source: { select: { name: true, role: true } },
          assignedTo: { select: { name: true } }
      }
  });`;
c = c.replace(afterQuery, leadQuery);

// 3. Add LeadPoolWidget section before "TEAM PERFORMANCE MATRIX"
const beforeMatrix = '{/* TEAM PERFORMANCE MATRIX */}';
const leadPool = `{/* LEAD POOL */}
        <div id="lead-pool" className="mb-8 pt-4">
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Kolam Prospek Tim (Lead Pool)</h2>
            <LeadPoolWidget leads={manualLeads} />
        </div>

        {/* TEAM PERFORMANCE MATRIX */}`;
c = c.replace(beforeMatrix, leadPool);

fs.writeFileSync(pagePath, c);
console.log('Baim dashboard patched!');
