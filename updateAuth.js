const fs = require('fs');
let code = fs.readFileSync('src/auth.ts', 'utf8');

const jwtSearch = `
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role
        
        // Simpan hari login untuk fitur "Wajib login tiap hari" (Reset tengah malam)
        token.loginDateStr = currentDayStr;
      }`;

const jwtReplace = `
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role
        token.staffBusinessId = (user as any).staffBusinessId || null
        
        // Coba ambil dari DB jika oauth
        if (!(user as any).staffBusinessId) {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
          if (dbUser) {
            token.role = dbUser.role
            token.staffBusinessId = dbUser.staffBusinessId
          }
        }
        
        // Simpan hari login untuk fitur "Wajib login tiap hari" (Reset tengah malam)
        token.loginDateStr = currentDayStr;
      }`;

code = code.replace(jwtSearch, jwtReplace);

const sessSearch = `
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
`;

const sessReplace = `
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.staffBusinessId = token.staffBusinessId as string | null
      }
`;

code = code.replace(sessSearch, sessReplace);
fs.writeFileSync('src/auth.ts', code);
