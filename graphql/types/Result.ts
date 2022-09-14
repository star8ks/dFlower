import { objectType } from 'nexus'


export const PercentResult = objectType({
  name: 'PercentResult',
  definition(t) {
    t.nonNull.int('senderId')
    t.nonNull.string('senderName')
    t.nonNull.float('percent')
  }
})

export const receiverPercent = objectType({
  name: 'receiverPercent',
  definition(t) {
    t.nonNull.int('receiverId')
    t.nonNull.string('receiverDiscordId')
    t.nonNull.string('receiverName')
    t.nonNull.float('percent')
  }
})

export const GiftedResult = objectType({
  name: 'GiftedResult',
  definition(t) {
    t.nonNull.int('senderId')
    t.nonNull.string('senderName')
    t.nonNull.list.field('normalized', {
      type: receiverPercent,
    })
  }
})

export const CalcResult = objectType({
  name: 'CalcResult',
  definition(t) {
    t.nonNull.list.field('allGifted', {
      type: GiftedResult,
    })
    t.nonNull.list.field('result', {
      type: receiverPercent,
    })
  }
})