import { InferGetServerSidePropsType } from 'next'
import { extendType, inputObjectType, nonNull, objectType } from 'nexus'
import { Gifter, CreateGifterInput } from './Gifter'

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