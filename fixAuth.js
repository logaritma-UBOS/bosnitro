const fs = require('fs');
let code = fs.readFileSync('src/auth.ts', 'utf8');

const linkCode = `
      if (account?.provider === "google" && user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          if (dbUser) {
            const linked = await prisma.account.findFirst({ where: { userId: dbUser.id, provider: "google" } });
            if (!linked) {
              await prisma.account.create({
                data: {
                  userId: dbUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                }
              });
            }
          }
        } catch (e) {
          console.error("Manual link failed:", e);
        }
      }
`;

code = code.replace(
  'const ALLOWED_EMAILS = [',
  linkCode + '\n      const ALLOWED_EMAILS = ['
);

fs.writeFileSync('src/auth.ts', code);
