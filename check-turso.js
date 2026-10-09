const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
  const rs = await client.execute("SELECT b.name, s.storeSlug, s.storeActive, u.email FROM Business b JOIN BusinessSetting s ON b.id = s.businessId JOIN User u ON b.userId = u.id WHERE s.storeSlug = 'warunkarsi'");
  console.log(rs.rows);
}
run().catch(console.error);
