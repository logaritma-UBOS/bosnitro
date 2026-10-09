const fs = require('fs');

let authStr = fs.readFileSync('src/actions/auth.ts', 'utf8');
authStr = authStr.replace(/passwordHash, name: existing\.name \|\| name, phone/g, 'passwordHash, name: existing.name || name, phone, emailVerified: new Date()');
authStr = authStr.replace(/data: \{ name, email, passwordHash, role: "OWNER", phone \}/g, 'data: { name, email, passwordHash, role: "OWNER", phone, emailVerified: new Date() }');
fs.writeFileSync('src/actions/auth.ts', authStr);

let staffStr = fs.readFileSync('src/actions/staff.ts', 'utf8');
staffStr = staffStr.replace(/staffBusinessId: business\.id/g, 'staffBusinessId: business.id, emailVerified: new Date()');
fs.writeFileSync('src/actions/staff.ts', staffStr);
console.log("Fixed actions");
