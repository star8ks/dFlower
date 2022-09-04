import { objectType } from 'nexus'
import { Gifter } from './Gifter'


export const Room = objectType({
  name: 'Room',
  definition(t) {
    t.string('id')
    t.string('name')
    t.string('createdAt')
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