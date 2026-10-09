const fs = require('fs');
let code = fs.readFileSync('src/actions/superAdminActions.ts', 'utf8');
code = code.replace('import { uploadImage } from "@/lib/cloudinary";\n"use server"', '"use server"\nimport { uploadImage } from "@/lib/cloudinary";');
fs.writeFileSync('src/actions/superAdminActions.ts', code);
console.log('Fixed');
