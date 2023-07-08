import { Point } from '@prisma/client'
import { NexusGenRootTypes } from '..'

type PercentResult = NexusGenRootTypes['PercentResult']
type ReceiverIdToPercentResults = {
  [receiverId: number]: {
    received: PercentResult[]
    receiverName: string,
    receiverDiscordId: string
  }
}

type receiverPercent = NexusGenRootTypes['receiverPercent']
type Gifted = NexusGenRootTypes['GiftedResult']

type CalcResult = NexusGenRootTypes['CalcResult']

type InputGifter = {
  accept: boolean;
  gifterId: number;
  gifterDiscordId: string;
  gifterName: string;
}
type InputPoint = Point & {
  sender: {
    name: string;
  },
  receiver: {
    name: string;
    discordId: string;
  }
}


type normalizeCallback = (point: InputPoint, percent: number) => void

export function normalizedBySender(sentPoints: InputPoint[], sentSum: number, cb: normalizeCallback) {
  for (const point of sentPoints) {
    const percent = point.point / sentSum

    cb(point, percent)
  }
}

type Normalized = {
  percentReceived: ReceiverIdToPercentResults;
  percentTotal: number;
  allGifted: Gifted[]
}
export function normalize(gifterOnRoom: InputGifter[], points: InputPoint[], excludeIds: number[] = []): Normalized {
  const rejectorIds = gifterOnRoom
    .filter((gor) => !gor.accept)
    .map((gor) => gor.gifterId)
    .concat(excludeIds)

  const allGifted: Gifted[] = []
  // save percent to percentReceived, to calculate the sum of percent of each receiver later
  const percentReceived: ReceiverIdToPercentResults = {}
  let percentTotal = 0
  for (const sender of gifterOnRoom) {
    let percent
    const gifted: Gifted = {
      senderId: sender.gifterId,
      senderName: '',
      normalized: []
    }

    const sentPoints = points.filter(point =>
      point.senderId === sender.gifterId
      && point.receiverId !== sender.gifterId
      && !rejectorIds.includes(point.receiverId)
    )
    const sentSum = sentPoints.reduce((acc, cur) => acc + cur.point, 0)

    // let percentPoints
    if (sentSum > 0) {
      normalizedBySender(sentPoints, sentSum, (point, percent) => {
        percentTotal += percent ? percent : 0
        if (percentReceived[point.receiverId] === undefined) {
          percentReceived[point.receiverId] = {
            receiverDiscordId: point.receiver.discordId,
            receiverName: point.receiver.name,
            received: []
          }
        }

        percentReceived[point.receiverId].received.push({
          senderId: point.senderId,
          senderName: point.sender.name,
          percent
        })

        gifted.normalized.push({
          receiverId: point.receiverId,
          receiverDiscordId: point.receiver.discordId,
          receiverName: point.receiver.name,
          percent
        })
      })

    } else {
      // sender gifted nothing to others, assume he/she gifted same point to each receiver
      for (const receiver of gifterOnRoom) {
        if (rejectorIds.includes(receiver.gifterId)) {
          continue
        }

        if (receiver.gifterId !== sender.gifterId) {
          percent = 1 / (gifterOnRoom.length - 1)
          percentTotal += percent ? percent : 0

          if (percentReceived[receiver.gifterId] === undefined) {
            percentReceived[receiver.gifterId] = {
              receiverDiscordId: receiver.gifterDiscordId,
              receiverName: receiver.gifterName,
              received: []
            }
          }

          percentReceived[receiver.gifterId].received.push({
            senderId: sender.gifterId,
            senderName: sender.gifterName,
            percent
          })

          gifted.normalized.push({
            receiverId: receiver.gifterId,
            receiverDiscordId: receiver.gifterDiscordId,
            receiverName: receiver.gifterName,
            percent
          })
        }
      }
    }

    allGifted.push(gifted)
  }

  return {
    percentReceived,
    percentTotal,
    allGifted
  }

}

export default function calc(gifterOnRoom: InputGifter[], points: InputPoint[]): CalcResult {
  const senderIds = points.reduce<number[]>(function (ids, point) {
    if (!ids.includes(point.senderId)) {
      ids.push(point.senderId)
    }
    return ids
  }, [] as number[])

  // exclude gifter who send nothing to others
  const excludeIds = gifterOnRoom.filter(gifter => {
    return !senderIds.includes(gifter.gifterId)
  }).map(gifter => gifter.gifterId)

  const { percentReceived, percentTotal, allGifted } = normalize(gifterOnRoom, points, excludeIds)

  // console.log('percentReceived', JSON.stringify(percentReceived))

  const result: receiverPercent[] = []
  for (const receiverId in percentReceived) {
    const percentSum = percentReceived[receiverId].received.reduce((acc, cur) => acc + cur.percent, 0)
    result.push({
      receiverId: parseInt(receiverId),
      receiverDiscordId: percentReceived[receiverId].receiverDiscordId,
      receiverName: percentReceived[receiverId].receiverName,
      percent: percentTotal ? percentSum / percentTotal : 0
    })
  }

  console.group('calc result', allGifted, result)
  return {
    allGifted,
    result,
  }
}