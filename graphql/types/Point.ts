import { extendType, inputObjectType, list, nonNull, objectType } from 'nexus'
import { normalize } from '../../lib/calc'
import { giftersOnRoom, pointsWithGifters } from '../../lib/prisma'
import { Gifter } from './Gifter'
import { GiftedResult } from './Result'

export const Point = objectType({
  name: 'Point',
  definition(t) {
    t.nonNull.string('roomId')
    t.nonNull.int('senderId')
    t.nonNull.int('receiverId')
    t.nonNull.int('point')
    t.nonNull.string('createdAt')
    t.nonNull.field('sender', {
      type: Gifter,
      async resolve(parent, args, ctx) {
        return await ctx.prisma.gifter.findUniqueOrThrow({
          where: {
            id: parent.senderId
          }
        })
      }
    })
    t.nonNull.field('receiver', {
      type: Gifter,
      async resolve(parent, args, ctx) {
        return await ctx.prisma.gifter.findUniqueOrThrow({
          where: {
            id: parent.receiverId
          }
        })
      }
    })
  }
})

export const QueryPointInput = inputObjectType({
  name: 'QueryPointInput',
  definition(t) {
    t.nonNull.string('roomId')
    t.int('senderId')
    t.int('receiverId')
  }
})

export const PointQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.list.field('point', {
      type: Point,
      args: {
        data: nonNull(QueryPointInput)
      },
      resolve(_parent, args, ctx) {
        const { roomId, senderId, receiverId } = args.data
        const where: { roomId: string; senderId?: number; receiverId?: number } = { roomId: roomId }
        if (senderId) where.senderId = senderId
        if (receiverId) where.receiverId = receiverId
        return ctx.prisma.point.findMany({
          where
        })
      }
    })
  },
})

export const UpdatePointInput = inputObjectType({
  name: 'UpdatePointInput',
  definition(t) {
    t.nonNull.string('roomId')
    t.nonNull.int('senderId')
    t.nonNull.int('receiverId')
    t.nonNull.int('point')
  }
})

export const UpdatePointMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('updatePoint', {
      type: Point,
      args: {
        data: nonNull(UpdatePointInput)
      },
      async resolve(_parent, args, ctx) {
        const { roomId, senderId, receiverId, point } = args.data

        const allowedGifter = await ctx.prisma.giftersOnRooms.findMany({
          where: {
            roomId,
          },
          select: {
            gifterId: true,
          }
        })
        const allowedGifterIds = allowedGifter.map(gifter => gifter.gifterId)

        if (!allowedGifterIds.includes(senderId) || !allowedGifterIds.includes(receiverId)) {
          throw new Error('Sender or receiver are not in room.')
        }

        return ctx.prisma.point.upsert({
          where: {
            roomId_senderId_receiverId: {
              roomId,
              senderId,
              receiverId
            }
          },
          update: {
            point
          },
          create: {
            roomId,
            senderId,
            receiverId,
            point
          }
        })
      }

    })
  }
})

export const UpdatePointBatchMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('updatePointBatch', {
      type: GiftedResult,
      args: {
        data: nonNull(list(nonNull(UpdatePointInput)))
      },
      async resolve(_parent, args, ctx) {
        const { roomId, senderId } = args.data[0]

        const room = await ctx.prisma.room.findFirst({
          where: {
            id: roomId,
            endedAt: {
              gte: new Date()
            }
          },
          select: {
            endedAt: true
          }
        })
        // if room ended now, throw error
        if (!room) {
          console.log('Room is ended or not existed.')
          throw new Error('Room is ended or not existed.')
        }


        const allowedGifter = await ctx.prisma.giftersOnRooms.findMany({
          where: {
            roomId,
          },
          select: {
            gifterId: true,
            gifter: {
              select: {
                name: true
              }
            }
          }
        })
        const allowedGifterIds = allowedGifter.map(gifter => gifter.gifterId)

        for (const data of args.data) {
          if (!allowedGifterIds.includes(data.senderId) || !allowedGifterIds.includes(data.receiverId)) {
            throw new Error('Sender or receiver are not in room.')
          }
          if (data.roomId !== roomId) {
            throw new Error('RoomId is not same.')
          }
          if (data.senderId !== senderId) {
            throw new Error('SenderId is not same.')
          }
        }

        const res = await ctx.prisma.$transaction(args.data.map(data => {
          const { roomId, senderId, receiverId, point } = data
          return ctx.prisma.point.upsert({
            where: {
              roomId_senderId_receiverId: {
                roomId,
                senderId,
                receiverId
              }
            },
            update: {
              point
            },
            create: {
              roomId,
              senderId,
              receiverId,
              point
            }
          })
        }))
        console.log('points updated:', res)

        const points = await pointsWithGifters(roomId, senderId)
        console.log('points retrived:', points)

        const gifterOnRoom = (await giftersOnRoom(roomId)).map(g => ({
          gifterId: g.gifterId,
          gifterName: g.gifter.name,
          accept: g.accept
        }))
        const normalized = normalize(gifterOnRoom, points)
        console.log('normalized:', normalized)

        return normalized.allGifted[0]
      }

    })
  }
})