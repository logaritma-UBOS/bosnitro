const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');

async function main() {
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });

  await prisma.$executeRawUnsafe(`ALTER TABLE OwnerCampaign ADD COLUMN author TEXT;`); 
  console.log("Success");
} 
main().catch(e => console.error(e));
