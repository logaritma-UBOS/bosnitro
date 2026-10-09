const fs = require('fs');
let code = fs.readFileSync('run_turso_mig.js', 'utf8');

const additionalSql = `
    try {
        await client.execute('ALTER TABLE "Product" ADD COLUMN "currentStock" REAL DEFAULT 0');
        console.log("Added currentStock to Product");
    } catch (e) {
        if (e.message && !e.message.includes("duplicate column")) console.error("Product alter err (currentStock):", e.message);
    }

    try {
        await client.execute('ALTER TABLE "Product" ADD COLUMN "minStock" REAL DEFAULT 0');
        console.log("Added minStock to Product");
    } catch (e) {
        if (e.message && !e.message.includes("duplicate column")) console.error("Product alter err (minStock):", e.message);
    }
`;

code = code.replace("console.log('Done migrations. Seeding Team OS...');", additionalSql + "\nconsole.log('Done migrations. Seeding Team OS...');");

fs.writeFileSync('run_turso_mig.js', code);
