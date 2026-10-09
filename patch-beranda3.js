const fs = require("fs");
let file = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/(dashboard)/beranda/page.tsx", "utf8");

const regex = /const now = new Date\(\)\r?\n    const firstDayOfMonth = new Date\(now\.getFullYear\(\), now\.getMonth\(\), 1\)\r?\n    const payment = await prisma\.ubosRevenue\.findFirst\(\{\r?\n      where: \{ \r?\n        userId: business\.userId, \r?\n        status: "PAID",\r?\n        createdAt: \{ gte: firstDayOfMonth \}\r?\n      \}\r?\n    \}\)/;

const replacement = `const payment = await prisma.ubosRevenue.findFirst({
      where: { 
        userId: business.userId, 
        status: "PAID"
      }
    })`;

if (regex.test(file)) {
  file = file.replace(regex, replacement);
  fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/(dashboard)/beranda/page.tsx", file, "utf8");
  console.log("beranda/page.tsx patched via regex ✓");
} else {
  console.log("regex failed");
}
