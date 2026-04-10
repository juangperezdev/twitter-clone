import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

async function createPrismaClient(): Promise<PrismaClient> {
  // En desarrollo local usamos el adapter pg para pool de conexiones
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { Pool } = await import('pg')
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const pool = new Pool({ connectionString: process.env.DATABASE_URL })
      const adapter = new PrismaPg(pool)
      return new PrismaClient({ adapter })
    } catch {
      // Fallback sin adapter
      return new PrismaClient()
    }
  }

  // En producción (Vercel) usamos PrismaClient directo con DATABASE_URL
  return new PrismaClient()
}

// Singleton pattern con lazy init
let prismaPromise: Promise<PrismaClient> | null = null

function getPrismaPromise(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    return Promise.resolve(globalForPrisma.prisma)
  }
  if (!prismaPromise) {
    prismaPromise = createPrismaClient().then(client => {
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = client
      }
      return client
    })
  }
  return prismaPromise
}

// Export síncrono para compatibilidad con todo el código existente
// En Vercel, DATABASE_URL existe así que PrismaClient() funciona directo
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
