import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "./lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...PrismaAdapter(prisma),
    createUser: async (data) => {
      return prisma.user.create({
        data: {
          ...data,
          passwordHash: "", // Inject empty string to bypass SQLite NOT NULL constraint for OAuth users
        },
      })
    },
  },
  basePath: "/api/auth",
  secret: (process.env.AUTH_SECRET && !process.env.AUTH_SECRET.includes('[SENSITIVE]'))
    ? process.env.AUTH_SECRET
    : (process.env.NEXTAUTH_SECRET && !process.env.NEXTAUTH_SECRET.includes('[SENSITIVE]'))
      ? process.env.NEXTAUTH_SECRET
      : "ubos_secret_key_logaritma_2026_supersecure_auth_token_xyz99",
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('[SENSITIVE]')) ? process.env.GOOGLE_CLIENT_ID : "dummy_google_id",
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET && !process.env.GOOGLE_CLIENT_SECRET.includes('[SENSITIVE]')) ? process.env.GOOGLE_CLIENT_SECRET : "dummy_google_secret",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = (credentials.email as string).trim().toLowerCase()
        const passwordInput = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user || !user.passwordHash) {
          console.log("[AUTH DEBUG] User not found or no password hash for email:", email);
          return null
        }

        const passwordsMatch = await bcrypt.compare(
          passwordInput,
          user.passwordHash
        )

        console.log("[AUTH DEBUG] Passwords match?", passwordsMatch);

        if (!passwordsMatch) return null

        return { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role, 
          staffBusinessId: user.staffBusinessId 
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
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
      
      if (user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          if (dbUser) {
            await prisma.user.update({
              where: { email: user.email },
              data: { lastLogin: new Date() }
            });
          }
        } catch (e) {
          console.error("Failed to track login:", e);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      const currentDayStr = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric", month: "numeric", day: "numeric"
      }).format(new Date());

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
      }
      
      if (!token.loginDateStr || token.loginDateStr !== currentDayStr) {
         return {} as any; // Return empty token
      }
      
      return token
    },
    async session({ session, token }) {
      if (!token || !token.email) {
        return {} as any;
      }
      
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.staffBusinessId = token.staffBusinessId as string | null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/`
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: false,
})
