const fs = require("fs");
let file = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/(dashboard)/beranda/page.tsx", "utf8");

// Remove firstDayOfMonth and createdAt filter
const oldBlock = `      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const payment = await prisma.ubosRevenue.findFirst({
        where: { 
          userId: business.userId, 
          status: "PAID",
          createdAt: { gte: firstDayOfMonth }
        }
      })`;
const newBlock = `      const payment = await prisma.ubosRevenue.findFirst({
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
  // Check what's actually there
  const idx = file.indexOf("firstDayOfMonth");
  if (idx > -1) {
    console.log("CONTEXT:\n" + file.substring(idx - 50, idx + 200));
  } else {
    console.log("firstDayOfMonth not found — already clean");
  }
}
