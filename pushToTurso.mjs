import { createClient } from "@libsql/client";
import fs from "fs";

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  const sql = fs.readFileSync("baseline.sql", "utf-8");

  // Split SQL by ; and execute one by one
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Executing ${statements.length} SQL statements...`);
  
  for (const stmt of statements) {
    console.log(`Executing: ${stmt.substring(0, 50)}...`);
    try {
      await client.execute(stmt);
    } catch (err) {
      console.error(`Failed to execute: ${stmt}`);
      throw err;
    }
  }
  
  console.log("Schema pushed successfully!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
