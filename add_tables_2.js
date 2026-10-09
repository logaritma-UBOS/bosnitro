const fs = require('fs');
let f = fs.readFileSync('C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/run_turso_mig.js', 'utf8');

const marker = "console.log('Done migrations. Seeding Team OS...');";
const idx = f.indexOf(marker);

if (idx !== -1) {
    const newMig = [
        "    try {",
        "        await client.execute(`ALTER TABLE \"TeamMember\" ADD COLUMN \"profilePicture\" TEXT`);",
        "        console.log('Added profilePicture to TeamMember');",
        "    } catch(e) { if (e.message && !e.message.includes('duplicate column')) console.error('TeamMember alter err:', e.message); }",
        "    try {",
        "        await client.execute(`CREATE TABLE IF NOT EXISTS \"TeamIdeaComment\" (\"id\" TEXT NOT NULL PRIMARY KEY, \"ideaId\" TEXT NOT NULL, \"authorId\" TEXT NOT NULL, \"content\" TEXT NOT NULL, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"TeamIdeaComment_ideaId_fkey\" FOREIGN KEY (\"ideaId\") REFERENCES \"TeamIdea\" (\"id\") ON DELETE CASCADE, CONSTRAINT \"TeamIdeaComment_authorId_fkey\" FOREIGN KEY (\"authorId\") REFERENCES \"TeamMember\" (\"id\") ON DELETE CASCADE)`);",
        "        console.log('Created TeamIdeaComment');",
        "    } catch(e) { if (e.message && !e.message.includes('already exists')) console.error('TeamIdeaComment err:', e.message); }",
        ""
    ].join('\n');

    f = f.substring(0, idx) + newMig + f.substring(idx);
    fs.writeFileSync('C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/run_turso_mig.js', f, 'utf8');
    console.log('Turso migration for comments and profile picture added!');
} else {
    console.log('Marker NOT found');
}
