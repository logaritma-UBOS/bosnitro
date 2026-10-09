const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// Use process.env directly during Vercel build
const dbUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || dbUrl.includes('[SENSITIVE]') || !authToken || !dbUrl.startsWith('libsql:')) {
    console.log('Skipping migrations: DATABASE_URL not available or not Turso remote database.');
    process.exit(0);
}

const client = createClient({ url: dbUrl, authToken });

async function migrate() {
    const migs = [
        '20260821025633_phase1_unified_item',
        '20260821030025_phase1_fix_default',
        '20260821032057_phase3_hpp_engine',
        '20260821155410_phase4d_receipt',
        '20260822005400_promo_engine',
        '20260822114400_content_planner',
        '20260822123000_campaign',
        '20260822171000_wa_fonnte',
        '20260826123000_nextauth',
        '20260829000000_owner_backend',
        '20260829000001_owner_action_fields',
        '20260829000002_owner_marketing',
  '20260830000000_final_learning_loop',
  '20260830005600_notification_delivery',
  '20260830150000_ubos_monetization',
  '20260830160000_visitor_analytics',
  '20260830170000_fix_dummy_amount',
  '20260831150000_pilot_activity_log',
  '20260831160000_sosmed_links',
  '20260901000000_toko_online',
  '20260902100000_author_campaign',
  '20260903000000_supplier',
  '20260903195000_feed_audience',
  '20260904104500_feed_image_url',
  '20260927000000_team_os',
  '20260927000001_crm_status',
  '20260927000002_crm_traffic',
  '20260929000000_team_os_control_tower',
  '20260930000000_manual_lead'
    ];

    for (const m of migs) {
        console.log('Running migration:', m);
        const p = path.join(process.cwd(), 'prisma', 'migrations', m, 'migration.sql');
        if (!fs.existsSync(p)) {
            console.log('File not found:', p);
            continue;
        }
        const sql = fs.readFileSync(p, 'utf8');
        const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const s of stmts) {
            try {
                await client.execute(s);
            } catch (e) {
                if (e.message.includes('duplicate column')) {
                    console.log('Already applied (duplicate column)');
                } else if (e.message.includes('already exists')) {
                    console.log('Already applied (table exists)');
                } else {
                    console.error('Error on statement:', s);
                    console.error(e.message);
                }
            }
        }
    }
        try {
        await client.execute(`CREATE TABLE IF NOT EXISTS "TeamIdea" ("id" TEXT NOT NULL PRIMARY KEY, "authorId" TEXT NOT NULL, "content" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "TeamIdea_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE)`);
        console.log('Created TeamIdea');
    } catch(e) { if (e.message && !e.message.includes('already exists')) console.error('TeamIdea err:', e.message); else console.log('TeamIdea already exists'); }
    try {
        await client.execute(`CREATE TABLE IF NOT EXISTS "SupportMessage" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "senderRole" TEXT NOT NULL, "message" TEXT NOT NULL, "isRead" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SupportMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE)`);
        console.log('Created SupportMessage');
    } catch(e) { if (e.message && !e.message.includes('already exists')) console.error('SupportMessage err:', e.message); else console.log('SupportMessage already exists'); }
    try {
        await client.execute(`ALTER TABLE "TeamMember" ADD COLUMN "profilePicture" TEXT`);
        console.log('Added profilePicture to TeamMember');
    } catch(e) { if (e.message && !e.message.includes('duplicate column')) console.error('TeamMember alter err:', e.message); }
    try {
        await client.execute(`CREATE TABLE IF NOT EXISTS "TeamIdeaComment" ("id" TEXT NOT NULL PRIMARY KEY, "ideaId" TEXT NOT NULL, "authorId" TEXT NOT NULL, "content" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "TeamIdeaComment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "TeamIdea" ("id") ON DELETE CASCADE, CONSTRAINT "TeamIdeaComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE)`);
        console.log('Created TeamIdeaComment');
    } catch(e) { if (e.message && !e.message.includes('already exists')) console.error('TeamIdeaComment err:', e.message); }

    try {
        await client.execute('ALTER TABLE "TeamMember" ADD COLUMN "bankName" TEXT');
        await client.execute('ALTER TABLE "TeamMember" ADD COLUMN "bankAccount" TEXT');
        await client.execute('ALTER TABLE "TeamMember" ADD COLUMN "bankAccountName" TEXT');
        console.log("Added bank fields to TeamMember");
    } catch (e) {
        if (e.message && !e.message.includes("duplicate column") && !e.message.includes("unrecognized token")) console.error("Bank alter err:", e.message);
    }


    try {
        await client.execute('ALTER TABLE "User" ADD COLUMN "staffBusinessId" TEXT');
        console.log("Added staffBusinessId to User");
    } catch (e) {
        if (e.message && !e.message.includes("duplicate column") && !e.message.includes("unrecognized token")) console.error("User alter err:", e.message);
    }


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

    console.log('Done migrations. Seeding Team OS & Admin Users...');

    const pilotPwHash = "$2b$10$hl2byCSEHHxVByhIMKhAUOsTKYoGPNQ4aEvxJ1QUfyvady1oF1vuK"; // bcrypt hash of adminlog2026
    const members = [
        { email: "logaritma.tim@gmail.com", name: "Baim", role: "SUPER_ADMIN", sharePercentage: 40 },
        { email: "baim@logaritma.id", name: "Baim", role: "SUPER_ADMIN", sharePercentage: 40 },
        { email: "tony@logaritma.id", name: "Tony", role: "METHODOLOGY", sharePercentage: 25 },
        { email: "reza@logaritma.id", name: "Reza", role: "DEVELOPER", sharePercentage: 20 },
        { email: "bana@logaritma.id", name: "Bana", role: "OPERATIONS", sharePercentage: 15 },
    ];
    for (const m of members) {
        try {
            await client.execute({
                sql: `INSERT INTO "TeamMember" (id, email, name, role, sharePercentage, walletBalance, totalEarned, updatedAt) VALUES (?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP)`,
                args: [Math.random().toString(36).slice(2), m.email, m.name, m.role, m.sharePercentage]
            });
        } catch (e) {
            // Already exists in TeamMember, update role if needed
            try {
                await client.execute({
                    sql: `UPDATE "TeamMember" SET name = ?, role = ? WHERE email = ?`,
                    args: [m.name, m.role, m.email]
                });
            } catch (_) {}
        }

        try {
            const existingUser = await client.execute({
                sql: `SELECT id FROM "User" WHERE email = ? LIMIT 1`,
                args: [m.email]
            });
            if (existingUser.rows.length === 0) {
                await client.execute({
                    sql: `INSERT INTO "User" (id, email, name, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, 'ADMIN', CURRENT_TIMESTAMP)`,
                    args: [Math.random().toString(36).slice(2), m.email, m.name, pilotPwHash]
                });
            } else {
                await client.execute({
                    sql: `UPDATE "User" SET passwordHash = ?, role = 'ADMIN' WHERE email = ?`,
                    args: [pilotPwHash, m.email]
                });
            }
        } catch (err) {
            console.error('Failed to upsert User for ' + m.email, err.message);
        }
    }
    console.log('Pilot seeding done.');
}
migrate().catch(console.error);