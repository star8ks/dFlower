import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

if (process.env.NODE_ENV === 'poduction') {
  prisma = new PrismaClient()
} else {
  // Avoid reinitailing PrismaClient and exhausting
  // connection limit on every next.js fast refresh
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

export default prisma