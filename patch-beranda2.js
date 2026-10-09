const fs = require("fs");
let file = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/(dashboard)/beranda/page.tsx", "utf8");

// The indentation is 4 spaces, not 6
const oldBlock = `    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const payment = await prisma.ubosRevenue.findFirst({
      where: { 
        userId: business.userId, 
        status: "PAID",
        createdAt: { gte: firstDayOfMonth }
      }
    })`;
const newBlock = `    const payment = await prisma.ubosRevenue.findFirst({
      where: { 
        userId: business.userId, 
        status: "PAID"
      }
    })`;

if (file.includes(oldBlock)) {
  file = file.replace(oldBlock, newBlock);
  fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/(dashboard)/beranda/page.tsx", file, "utf8");
  console.log("beranda/page.tsx patched ✓");
} else {
  // try regex
  const regex = /const now = new Date\(\)\s+const firstDayOfMonth[\s\S]{0,300}createdAt: \{ gte: firstDayOfMonth \}\s+\}\s+\}\)/;
  const match = file.match(regex);
  if (match) {
    console.log("MATCH found via regex:");
    console.log(JSON.stringify(match[0]));
  } else {
    console.log("No match — check manually");
    const idx = file.indexOf("firstDayOfMonth");
    console.log("RAW AROUND firstDayOfMonth:");
    console.log(JSON.stringify(file.substring(idx - 10, idx + 300)));
  }
}
