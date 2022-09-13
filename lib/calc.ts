import { Point } from '@prisma/client'
import { NexusGenRootTypes } from '..'

type PercentResult = NexusGenRootTypes['PercentResult']
type ReceiverIdToPercentResults = {
  [receiverId: number]: {
    received: PercentResult[]
    receiverName: string
    result: number
  }
}

type receiverPercent = NexusGenRootTypes['receiverPercent']
type Gifted = NexusGenRootTypes['GiftedResult']

type CalcResult = NexusGenRootTypes['CalcResult']

type InputGifter = {
  accept: boolean;
  gifterId: number;
  gifterName: string;
}
type InputPoint = Point & {
  sender: {
    name: string;
  },
  receiver: {
    name: string;
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
export function normalize(gifterOnRoom: InputGifter[], points: InputPoint[]): Normalized {
  const rejectorIds = gifterOnRoom.filter((gor) => !gor.accept).map((gor) => gor.gifterId)

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

    const sentPoints = points.filter(point => point.senderId === sender.gifterId && !rejectorIds.includes(point.receiverId)
    )
    const sentSum = sentPoints.reduce((acc, cur) => acc + cur.point, 0)

    // let percentPoints
    if (sentSum > 0) {
      normalizedBySender(sentPoints, sentSum, (point, percent) => {
        percentTotal += percent ? percent : 0
        if (percentReceived[point.receiverId] === undefined) {
          percentReceived[point.receiverId] = {
            receiverName: point.receiver.name,
            received: [],
            result: 0
          }
        }

        percentReceived[point.receiverId].received.push({
          senderId: point.senderId,
          senderName: point.sender.name,
          percent
        })

        gifted.normalized.push({
          receiverId: point.receiverId,
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
              receiverName: receiver.gifterName,
              received: [],
              result: 0
            }
          }

          percentReceived[receiver.gifterId].received.push({
            senderId: sender.gifterId,
            senderName: sender.gifterName,
            percent
          })

          gifted.normalized.push({
            receiverId: receiver.gifterId,
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

  const { percentReceived, percentTotal, allGifted } = normalize(gifterOnRoom, points)

  const result: receiverPercent[] = []
  for (const receiverId in percentReceived) {
    const percentSum = percentReceived[receiverId].received.reduce((acc, cur) => acc + cur.percent, 0)
    percentReceived[receiverId].result = percentTotal ? percentSum / percentTotal : 0
    result.push({
      receiverId: parseInt(receiverId),
      receiverName: percentReceived[receiverId].receiverName,
      percent: percentReceived[receiverId].result
    })
  }

  return {
    allGifted,
    result,
  }
}