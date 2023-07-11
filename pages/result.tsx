import React, { useEffect, useState } from 'react'
import { gql, useLazyQuery } from '@apollo/client'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { NexusGenFieldTypes, NexusGenRootTypes } from '..'
import { ChordDiagram } from '@/components/ui/ChordDiagram'
import { Pallatte } from '@/graphql/types'

// TODO generate N tailwind bg-color class name
const colors:Pallatte = [{
  normal: 'rose-100',
  highlight: 'rose-200',
  normalRGB: '#ffe4e6',
}, {
  normal: 'yellow-100',
  highlight: 'yellow-200',
  normalRGB: '#fef9c3',
}, {
  normal: 'green-100',
  highlight: 'green-200',
  normalRGB: '#dcfce7',
}, {
  normal: 'purple-100',
  highlight: 'purple-200',
  normalRGB: '#f3e8ff',
}, {
  normal: 'indigo-100',
  highlight: 'indigo-200',
  normalRGB: '#e0e7ff',
}, {
  normal: 'cyan-100',
  highlight: 'cyan-200',
  normalRGB: '#cffafe',
}]

// query with param: id
const ResultQuery = gql`
  query getRoomById($roomId: String!) {
    roomById(id: $roomId) {
      id
      name
      createdAt
      endedAt
      tempResult {
        allGifted{
          senderId
          normalized {
            receiverId
            percent
          }
        }
        result {
          receiverId
          receiverDiscordId
          receiverName
          percent
        }
      }
      points {
        createdAt
        senderId
        receiverId
        point
      }
      gifters {
        accept
        gifter {
          id
          name
          discordId
        }
      }
    }
  }
`

type RenderData = {
  key: string
  senderId: number
  senderName: string
  receiverId: number
  point0?: number
  point1?: number
  point2?: number
  point3?: number
  point4?: number
  point5?: number
  points: Point[]
}

type PointSums = Map<number, number>

function composeData(points: Array<NexusGenRootTypes['Point'] | null>, gifters: NexusGenFieldTypes['Room']['gifters'], senderPointSums?: PointSums) {
  return points.reduce(
    (acc, cur) => {
      if(!cur) return acc
      const sender = gifters.find((g) => g?.gifter.id === cur.senderId)
      const receiver = gifters.find((g) => g?.gifter.id === cur.receiverId)
      
      const receiverIndex = gifters.findIndex((g) => g?.gifter.id === cur.receiverId)

      if (!sender || !receiver) return acc

      const sum = senderPointSums ? senderPointSums.get(cur.senderId) : 0
      if (senderPointSums && !sum) throw new Error('senderPointSums not found')
      
      const exist = acc.find((a) => a.senderId === cur.senderId)
      if (exist) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        exist[`point${receiverIndex.toString()}`] = (senderPointSums && sum) ? (cur.point / sum * 100).toFixed(2) + '%' : cur.point
        exist.points.push({
          key: cur.receiverId + '-' + cur.senderId,
          date: new Date(parseInt(cur.createdAt)).toLocaleString(),
          sender: sender.gifter.name,
          receiver: receiver.gifter.name,
          point: cur.point,
        })
        
        return acc
      }

      console.log('createdAt', cur.createdAt)

      const senderIndex = gifters.findIndex((g) => g?.gifter.id === cur.senderId)
      acc.push({
        key: cur.receiverId + '-' + cur.senderId,
        senderId: cur.senderId,
        senderName: sender.gifter.name,// + '-' + sender.gifter.id,
        receiverId: receiver.gifter.id,
        [`point${receiverIndex}`]: (senderPointSums && sum) ? (cur.point / sum * 100).toFixed(2) + '%' : cur.point,
        [`point${senderIndex}`]: 'N/A',
        points: [{
          key: cur.receiverId + '-' + cur.senderId,
          date: new Date(parseInt(cur.createdAt)).toLocaleString(),
          sender: sender.gifter.name,
          receiver: receiver.gifter.name,
          point: cur.point,
        }],
      })
      return acc
    },
    [] as RenderData[]
  )
}

type Point = {key: string, date: string, sender: string, receiver: string, point: number}

export default function Result() {
  const [roomId, setRoomId] = useState('')
  const [getResult, { data, error, loading }] = useLazyQuery<{
    roomById: NexusGenFieldTypes['Room'];
  }>(ResultQuery)

  // get roomId from query on load
  useEffect(() => {
    const rid = new URLSearchParams(window.location.search).get('id')
    if (!rid) return

    setRoomId(rid)
    getResult({ variables: { roomId: rid } })
  }, [])

  if (loading) {
    return <p> Loading...</p>
  }

  if (error || !data || !data.roomById.points) {
    return <p> Oops, somthing went wrong. {error?.message}</p>
  }

  if (parseInt(data.roomById.endedAt) > new Date().getTime()) {
    return <p> This room is not ended yet.</p>
  }

  const gifters = data.roomById.gifters
  // console.log('render', renderData)

  const senderSums:PointSums = new Map()
  data.roomById.points.forEach((p) => {
    const senderId = p?.senderId
    if(!senderId) return

    const value = senderSums.has(senderId) ? (senderSums.get(senderId) || 0) : 0
    senderSums.set(senderId, value + p?.point)
  })

  const renderPercentData = composeData(data.roomById.points, gifters, senderSums)

  
  const childrenColumns:ColumnsType<RenderData> = gifters.map((g) => {
    const index = gifters.findIndex((gi) => gi?.gifter.id === g?.gifter.id)
    return {
      title: g?.gifter.name,
      dataIndex: 'point' + index.toString(),
      key: 'point' + index.toString(),
      width: 20,
      align: 'right',
      // sorter: (a, b) => a['point'] - b['point'],
    }
  })
  
  const columns: ColumnsType<RenderData> = [
    {
      title: 'Sender',
      dataIndex: 'senderName',
      key: 'senderName',
      width: 20,
      fixed: 'left',
      className: '!bg-inherit',
    },
    {
      title: 'Percent',
      children: childrenColumns,
      // align: 'center',
    },
  ]

  const chordData = {
    data: gifters.map((g) => {
      const normalized = data.roomById.tempResult?.allGifted.find((a) => a?.senderId === g?.gifter.id)?.normalized
      return gifters.map((gg) => {
        const index = normalized?.findIndex((n) => n?.receiverId === gg?.gifter.id)
        return normalized && typeof index !== 'undefined' 
          ? Math.round((normalized[index]?.percent || 0) * 10000) / 100
          : 0
      })
    }),
    share: gifters.map(g => {
      return data.roomById.tempResult?.result.find(res => res?.receiverId === g?.gifter.id)?.percent || 0
    }),
    names: gifters.map((g) => g?.gifter.name || ''),
    colors
  }
  console.log('data', chordData.data, chordData.share)

  // show tables of each gifter and receiver
  return (
    <div>
      <h1 className='text-lg my-8'>Result of {data.roomById.name} <span className='prose prose-slate' >({roomId})</span></h1>

      <div className="flex justify-center items-center flex-col bg-white">
        <ChordDiagram
          data={chordData.data}
          share={chordData.share}
          names={chordData.names}
          colors={chordData.colors} width={800} height={800} />
      </div>

      <Table className='mt-8' columns={columns}
        dataSource={renderPercentData} bordered size="middle"
        pagination={false}
        rowClassName={(record, index) => `bg-${colors[index].normal}`}

        
        expandable={{
          expandedRowRender: (record, index) => {
            const columns = [{
              title: 'Date',
              dataIndex: 'date',
              key: 'date',
            }, {
              title: 'Sender',
              dataIndex: 'sender',
              key: 'sender',
            }, {
              title: 'Receiver',
              dataIndex: 'receiver',
              key: 'receiver',
            }, {
              title: 'Point',
              dataIndex: 'point',
              key: 'point',
            }]
            
            return <Table columns={columns} dataSource={record.points} pagination={false} />
          },
          defaultExpandedRowKeys: ['0']
        }}


        onRow={(record) => {
          return {
            onMouseEnter: (event) => {
              console.log('enter', event, event.target)
            },
          }
        }}
        summary={() => {
          return (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell align='right' className='font-bold' index={0}>Share</Table.Summary.Cell>
                {gifters.map((g) => {
                  const index = gifters.findIndex((gi) => gi?.gifter.id === g?.gifter.id)
                  const percent = data.roomById.tempResult?.result[index]?.percent
                  if (!percent) {
                    return (
                      <Table.Summary.Cell align='right' className='font-bold' index={index} key={index}>
                  0%
                      </Table.Summary.Cell>
                    )
                  }
                  return (
                    <Table.Summary.Cell align='right' className='font-bold' index={index} key={index}>
                      {(percent * 100).toFixed(2)}%
                    </Table.Summary.Cell>
                  )
                })}
              </Table.Summary.Row>
            </>
          )
        }}
      ></Table>

    </div>
  )
}