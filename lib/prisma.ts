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

export async function giftersOnRoom(roomId: string, gifterSelect = {
  name: true,
}) {
  return await prisma.giftersOnRooms.findMany({
    where: {
      roomId
    },
    include: {
      gifter: {
        select: gifterSelect
      },
    }
  })
}

export async function pointsWithGifters(roomId: string, senderId?: number) {
  const where = {
    roomId,
    senderId: senderId ? senderId : undefined
  }
  return await prisma.point.findMany({
    where,
    include: {
      sender: {
        select: {
          name: true,
        }
      },
      receiver: {
        select: {
          name: true,
        }
      }
    }
  })
}