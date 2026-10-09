const { createClient } = require('@libsql/client');

const dbUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || dbUrl.includes('[SENSITIVE]')) {
    console.log('No DB URL');
    process.exit(0);
}

const client = createClient({ url: dbUrl, authToken });

async function patch() {
    console.log("Patching DB...");
    await client.execute("UPDATE PilotActivityLog SET ownerEmail = 'logaritma.tim@gmail.com' WHERE ownerEmail = 'baim@logaritma.id'");
    await client.execute("UPDATE PilotActivityLog SET ownerEmail = 'tony@logaritma.id' WHERE ownerEmail LIKE 'tony%' AND ownerEmail != 'tony@logaritma.id'");
    await client.execute("UPDATE PilotActivityLog SET ownerEmail = 'reza@logaritma.id' WHERE ownerEmail LIKE 'reza%' AND ownerEmail != 'reza@logaritma.id'");
    await client.execute("UPDATE PilotActivityLog SET ownerEmail = 'bana@logaritma.id' WHERE ownerEmail LIKE 'bana%' AND ownerEmail != 'bana@logaritma.id'");
    console.log("Done");
}

patch().catch(console.error);
