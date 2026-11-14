import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as { prisma?: PrismaClient }

// Su Vercel ogni istanza apre le sue connessioni: ne limitiamo il numero per non
// esaurire quelle del database ("too many connections") quando c'è molto traffico.
function dbUrl() {
  const u = process.env.PRISMA_DATABASE_URL
  if (!u || !/^postgres(ql)?:\/\//i.test(u) || /connection_limit=/i.test(u)) return u
  return u + (u.includes('?') ? '&' : '?') + 'connection_limit=1&pool_timeout=20'
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: dbUrl() } } })

globalForPrisma.prisma = prisma

export default prisma
