import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

import fs from 'fs'
import path from 'path'

const DEFAULT_TURSO_URL = 'libsql://bosnitro-logaritma.aws-ap-southeast-2.turso.io'
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTE3Nzc1NjksImlkIjoiMDFhMTJlNDItYjkwMS03NzYwLWIzMWItYjIzNzNmM2Q1MTNhIiwia2lkIjoib2I5ZkprdzFaa05ORXAyanFvcW9DQVR1QUR5ZmdwSk80UmRTdEhFY0VWWSIsInJpZCI6IjZmNTZiMjVhLTJhOTQtNDg5Mi1hZjQwLTJlMzU0ZDNmMjRhOSJ9.9w23ErAm-zW133YHWfdFIPQgR606QBrAQMsHKKpSTsG_BEFdf44CPiumZMLU_x9vDDjXeNF6ML__R0_BpeGzDg'

function getDatabaseConfig() {
  const rawUrl = process.env.DATABASE_URL || DEFAULT_TURSO_URL
  const rawToken = process.env.TURSO_AUTH_TOKEN || DEFAULT_TURSO_TOKEN

  if (rawUrl && (rawUrl.startsWith('libsql:') || rawUrl.startsWith('https:'))) {
    return { url: rawUrl, authToken: rawToken }
  }

  // Handle SQLite file in Vercel Serverless environment where root is read-only
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = '/tmp/dev.db'
    if (!fs.existsSync(tmpDbPath)) {
      const srcDbPath = path.resolve('./dev.db')
      if (fs.existsSync(srcDbPath)) {
        try {
          fs.copyFileSync(srcDbPath, tmpDbPath)
        } catch (e) {
          console.warn('Failed to copy dev.db to /tmp:', e)
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
