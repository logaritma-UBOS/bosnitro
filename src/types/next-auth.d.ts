import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      staffBusinessId?: string | null
      businessId?: string | null
    } & DefaultSession["user"]
  }
  interface User {
    id: string
    role: string
    staffBusinessId?: string | null
    businessId?: string | null
  }
}
