const Database = require('better-sqlite3');
const db = new Database('dev.db');
const tables = ['TeamMember', 'TeamLedger', 'TeamTask', 'TeamTicket'];
for (const t of tables) {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${t}'`).get();
  if (row) console.log(row.sql + ';');
  
  // Also get indexes
  const idxs = db.prepare(`SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='${t}' AND sql IS NOT NULL`).all();
  for (const idx of idxs) console.log(idx.sql + ';');
}
