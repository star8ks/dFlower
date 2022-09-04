import { objectType } from 'nexus'


export const Gifter = objectType({
  name: 'Gifter',
  definition(t) {
    t.string('id')
    t.string('name')
    t.string('discordId')
    t.string('ethAddress')
    t.list.field('rooms', {
      type: Room,
      async resolve(parent, args, ctx) {
        return await ctx.prisma.gifter.findUnique({
          where: {
            id: parent.id
          }
        }).Room()
      }
    })
  }
})