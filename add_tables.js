const fs = require('fs');
let f = fs.readFileSync('C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/run_turso_mig.js', 'utf8');

const marker = "console.log('Done migrations. Seeding Team OS...');";
const idx = f.indexOf(marker);
console.log('Marker found at:', idx);

if (idx !== -1) {
    const createTeamIdea = [
        "    try {",
        "        await client.execute(`CREATE TABLE IF NOT EXISTS \"TeamIdea\" (\"id\" TEXT NOT NULL PRIMARY KEY, \"authorId\" TEXT NOT NULL, \"content\" TEXT NOT NULL, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"TeamIdea_authorId_fkey\" FOREIGN KEY (\"authorId\") REFERENCES \"TeamMember\" (\"id\") ON DELETE CASCADE)`);",
        "        console.log('Created TeamIdea');",
        "    } catch(e) { if (e.message && !e.message.includes('already exists')) console.error('TeamIdea err:', e.message); else console.log('TeamIdea already exists'); }",
        "    try {",
        "        await client.execute(`CREATE TABLE IF NOT EXISTS \"SupportMessage\" (\"id\" TEXT NOT NULL PRIMARY KEY, \"userId\" TEXT NOT NULL, \"senderRole\" TEXT NOT NULL, \"message\" TEXT NOT NULL, \"isRead\" INTEGER NOT NULL DEFAULT 0, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"SupportMessage_userId_fkey\" FOREIGN KEY (\"userId\") REFERENCES \"User\" (\"id\") ON DELETE CASCADE)`);",
        "        console.log('Created SupportMessage');",
        "    } catch(e) { if (e.message && !e.message.includes('already exists')) console.error('SupportMessage err:', e.message); else console.log('SupportMessage already exists'); }",
        ""
    ].join('\n');

    f = f.substring(0, idx) + createTeamIdea + f.substring(idx);
    fs.writeFileSync('C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/run_turso_mig.js', f, 'utf8');
    console.log('Migration added!');
} else {
    console.log('Marker NOT found');
}
