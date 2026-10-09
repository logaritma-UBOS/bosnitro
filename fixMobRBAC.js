const fs = require('fs');
let code = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');

// Match everything from "// Filter for role" down to the end of the else if block
const regex = /\/\/ Filter for role[\s\S]*?\}\)\)\.filter\(cat => cat\.links\.length > 0\);\n    \}/;

const newLogic = `// Filter for role
    if (role === "KASIR") {
      const allowedKasir: string[] = []; 
      menuCategories = menuCategories.map(cat => ({
        ...cat,
        links: cat.links.filter(l => allowedKasir.includes(l.href))
      })).filter(cat => cat.links.length > 0);
    } else if (role === "MANAGER") {
      const allowedManager = ["/stok", "/katalog"];
      menuCategories = menuCategories.map(cat => ({
        ...cat,
        links: cat.links.filter(l => allowedManager.includes(l.href))
      })).filter(cat => cat.links.length > 0);
    }`;

code = code.replace(regex, newLogic);
fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', code);
console.log("Replaced MobileBottomNav");
