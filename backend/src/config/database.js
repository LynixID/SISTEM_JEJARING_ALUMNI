import { PrismaClient } from '@prisma/client'

// Prisma 6: Connection URL dari environment variable
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

export default prisma

