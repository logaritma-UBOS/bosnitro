const fs = require("fs");
// 1. Ubah sidebar Baim
let layout = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/admin/pilot/(dashboard)/layout.tsx", "utf8");
layout = layout.replace(/Manajemen 100 User/g, "Manajemen User");
fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/admin/pilot/(dashboard)/layout.tsx", layout, "utf8");
console.log("layout.tsx updated ✓");

// 2. Ubah judul tabel di dashboard Bana (OperationsClient.tsx)
let opsClient = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/admin/pilot/(dashboard)/operations/OperationsClient.tsx", "utf8");
opsClient = opsClient.replace(/>Database User<\/h3>/g, ">Manajemen User (CRM)</h3>");
fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/admin/pilot/(dashboard)/operations/OperationsClient.tsx", opsClient, "utf8");
console.log("OperationsClient.tsx updated ✓");
