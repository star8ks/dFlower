import { extendType, inputObjectType, nonNull, objectType, stringArg } from 'nexus'
import calc from '../../lib/calc'
import { giftersOnRoom, pointsWithGifters } from '../../lib/prisma'
import { Gifter, CreateGifterInput } from './Gifter'

export const GifterOnRoom = objectType({
  name: 'GifterOnRoom',
  definition(t) {
    t.nonNull.boolean('accept')
    t.nonNull.field('gifter', {
      type: 'Gifter'
    })
  }
})

export const Room = objectType({
  name: 'Room',
  definition(t) {
    t.nonNull.string('id')
    t.nonNull.string('name')
    t.nonNull.string('createdAt')
    t.nonNull.string('startedAt')
    t.nonNull.string('endedAt')

    t.field('creator', {
      type: Gifter,
      async resolve(parent, _args, ctx) {
        return await ctx.prisma.room.findUniqueOrThrow({
          where: {
            id: parent.id
          }
        }).creator()
      }
    })

    t.nonNull.list.field('gifters', {
      type: 'GifterOnRoom',
      async resolve(parent, _args, ctx) {
        const gifterIds = await ctx.prisma.giftersOnRooms.findMany({
          where: {
            roomId: parent.id
          },
          select: {
            gifterId: true,
            accept: true
          }
        })

        return await Promise.all(gifterIds.map(async gifterOnRoom => {
          const gifter = await ctx.prisma.gifter.findUniqueOrThrow({
            where: {
              id: gifterOnRoom.gifterId
            }
          })
          return {
            accept: gifterOnRoom.accept,
            gifter
          }
        }))

      }
    })

    t.list.field('points', {
      type: 'Point',
      async resolve(parent, _args, ctx) {
        return await ctx.prisma.point.findMany({
          where: {
            roomId: parent.id
          }
        })
      }
    })

    t.field('tempResult', {
      type: 'CalcResult',
      async resolve(parent, _args, _ctx) {
        const points = await pointsWithGifters(parent.id)

        const gifterOnRoom = (await giftersOnRoom(parent.id)).map(g => ({
          gifterId: g.gifterId,
          gifterName: g.gifter.name,
          accept: g.accept
        }))

        console.log(calc(gifterOnRoom, points))
        return calc(gifterOnRoom, points)
      }
    })
  }
})

export const RoomByIdQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('roomById', {
      type: 'Room',
      args: {
        id: nonNull(stringArg())
      },
      resolve(_parent, args, ctx) {
        return ctx.prisma.room.findUniqueOrThrow({ where: { id: args.id } })
      }
    })
  },
})

export const RoomsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.list.field('rooms', {
      type: Room,
      resolve(_parent, _args, ctx) {
        // TODO pagination
        return ctx.prisma.room.findMany()
      }
    })
  },
})


export const CreateRoomFromDiscordInput = inputObjectType({
  name: 'CreateRoomFromDiscord',
  definition(t) {
    t.nullable.string('name')
    t.nonNull.string('discordId')
    t.nonNull.string('discordName')
    t.nonNull.list.field('gifters', {
      type: nonNull(CreateGifterInput),
    })
  }
})

export const CreateRoomFromDiscordMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('createRoomFromDiscord', {
      type: Room,
      args: {
        data: nonNull(CreateRoomFromDiscordInput)
      },

      async resolve(_parent, args, ctx) {
        const { discordId, discordName, gifters, name: roomName } = args.data

        if (gifters.length < 3) {
          throw new Error('Not enough gifters')
        }
        if (gifters.length > 5) {
          throw new Error('Too many gifters')
        }
        const gifterIds = await Promise.all(gifters.map(async gifter => {
          // if (!gifter) return
          const gifterOnRoom = await ctx.prisma.gifter.upsert({
            where: {
              discordId: gifter.discordId
            },
            update: {},
            create: {
              name: gifter.name,
              discordId: gifter.discordId
            }
          })
          return { gifterId: gifterOnRoom.id }
        }))

        const room = await ctx.prisma.room.create({
          data: {
            name: roomName || `room created by ${discordName}`,
            createdAt: new Date(Date.now()),
            // ended at 30 mins later by default
            endedAt: new Date(Date.now() + 0.5 * 60 * 60 * 1000),
            creator: {
              connectOrCreate: {
                where: { discordId: discordId },
                // connect: { discordId: discordId },
                create: {
                  discordId,
                  name: discordName ?? 'discord_' + discordId
                }
              }
            },
            gifters: {
              createMany: {
                data: gifterIds
              }
            }
          }
        })

        return room

      }
    })
  }
})