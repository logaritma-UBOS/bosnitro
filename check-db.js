const { createClient } = require('@libsql/client');
const client = createClient({ url: '[SENSITIVE]', authToken: '[SENSITIVE]' });

async function main() {
  // Find user by phone (with or without country code)
  const result = await client.execute("SELECT id, email, name, phone, crmStatus FROM User WHERE phone LIKE '%085175150408%' OR phone LIKE '%85175150408%' OR phone LIKE '+62085175150408%' OR phone LIKE '62085175150408%'");
  console.log('=== User with WA 085175150408 ===');
  console.log(JSON.stringify(result.rows, null, 2));

  // All users with their emails
  const allUsers = await client.execute("SELECT id, email, name, phone, crmStatus FROM User ORDER BY createdAt DESC");
  console.log('=== ALL USERS ===');
  console.log(JSON.stringify(allUsers.rows, null, 2));

  // All revenue records
  const revenues = await client.execute("SELECT userId, amount, status, mayarTrxId FROM UbosRevenue WHERE status='PAID'");
  console.log('=== ALL PAID REVENUES ===');
  console.log(JSON.stringify(revenues.rows, null, 2));
}
main().catch(console.error);
