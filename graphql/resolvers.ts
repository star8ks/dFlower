import { Context } from './context'

const resolvers = {
  Query: {
    rooms: async (_parent, args: { id: string | undefined }, ctx: Context) =>
      await ctx.prisma.room.findMany()
  }
}

export default resolvers