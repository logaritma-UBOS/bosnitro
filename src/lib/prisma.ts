import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

function getDatabaseConfig() {
  const rawUrl = process.env.DATABASE_URL
  const rawToken = process.env.TURSO_AUTH_TOKEN

  const isInvalidUrl = !rawUrl || rawUrl.includes('[SENSITIVE]') || (!rawUrl.startsWith('file:') && !rawUrl.startsWith('libsql:') && !rawUrl.startsWith('http:') && !rawUrl.startsWith('https:'))
  const url = isInvalidUrl ? 'file:./dev.db' : rawUrl

  const authToken = (rawToken && !rawToken.includes('[SENSITIVE]')) ? rawToken : undefined

  return { url, authToken }
}

const dbConfig = getDatabaseConfig()
const adapter = new PrismaLibSql({
  url: dbConfig.url,
  authToken: dbConfig.authToken
})

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  currentDbUrl?: string
}

// Reset instance if cached with an outdated/invalid URL
if (globalForPrisma.currentDbUrl !== dbConfig.url) {
  globalForPrisma.prisma = undefined
  globalForPrisma.currentDbUrl = dbConfig.url
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
