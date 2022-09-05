import { extendType, inputObjectType, nonNull, nullable, objectType, stringArg } from 'nexus'
import { Gifter, CreateGifterInput } from './Gifter'

export const Room = objectType({
  name: 'Room',
  definition(t) {
    t.nonNull.string('id')
    t.nonNull.string('name')
    // t.nonNull.string('createdAt')
    t.nonNull.string('startedAt')
    t.nonNull.string('endedAt')
    t.field('creator', {
      type: Gifter,
      async resolve(parent, args, ctx) {
        return await ctx.prisma.room.findUnique({
          where: {
            id: parent.id
          }
        }).creator()
      }
    })
  }
})

export const RoomQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.list.field('rooms', {
      type: Room,
      resolve(_parent, _args, ctx) {
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
            // ended at 2 hours later by default
            endedAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
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
            giftersOnRooms: {
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