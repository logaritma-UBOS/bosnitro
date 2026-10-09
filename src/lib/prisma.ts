import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

import fs from 'fs'
import path from 'path'

function getDatabaseConfig() {
  const rawUrl = process.env.DATABASE_URL
  const rawToken = process.env.TURSO_AUTH_TOKEN

  if (rawUrl && rawUrl.startsWith('libsql:')) {
    return { url: rawUrl, authToken: rawToken }
  }

  // Handle SQLite file in Vercel Serverless environment where root is read-only
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = '/tmp/dev.db'
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'dev.db'),
        path.resolve('dev.db'),
      ]
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            fs.copyFileSync(p, tmpDbPath)
            break
          } catch (e) {
            console.warn('Failed to copy candidate to /tmp:', p, e)
          }
        }
      }
    }
    return { url: `file:${tmpDbPath}`, authToken: undefined }
  }

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
