import { inputObjectType, objectType } from 'nexus'
import { Room } from './Room'

export const Gifter = objectType({
  name: 'Gifter',
  definition(t) {
    t.nonNull.int('id')
    t.nonNull.string('name')
    t.nonNull.string('discordId')
    t.string('ethAddress')
    t.list.field('rooms', {
      type: Room,
      async resolve(parent, _args, ctx) {
        // TODO return recent 10 rooms
        return await ctx.prisma.gifter.findUnique({
          where: {
            id: parent.id
          }
        }).rooms()
      }
    })
  }
})

export const CreateGifterInput = inputObjectType({
  name: 'CreateGifterInput',
  definition(t) {
    t.nonNull.string('name')
    t.nonNull.string('discordId')
    t.nullable.string('ethAddress')
  }
})