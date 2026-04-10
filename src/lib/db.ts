import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    // Si olvidamos setear la URL local, lanzamos un error que se entienda
    if (!connectionString || connectionString === 'undefined') {
        throw new Error('No se encontró DATABASE_URL en las variables de entorno.')
    }
    
    // Generando la instancia explícita compatible con Prisma 7
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
  })()

// Cachear la instancia en desarrollo para evitar agotar las conexiones
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
