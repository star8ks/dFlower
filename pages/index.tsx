
import React, { useEffect, useState } from 'react'
import { gql, useQuery } from '@apollo/client'
import Link from 'next/link'

const AllRoomsQuery = gql`
  query AllRoomsQuery {
    rooms {
      id
      name
      endedAt
      createdAt
    }
  }
`

function Index(): React.ReactElement {
  const [btnColor, setBtnColor] = useState('rgb(207, 20, 114)')
  const [hover, setHover] = useState(false)
  const [siteName, setSiteName] = useState<string | JSX.Element>('dFlower')
  const { data, error, loading } = useQuery<{rooms: {id: string, name: string, endedAt: string, createdAt: string}[]}>(AllRoomsQuery)

  useEffect(() => {
    if (!hover) return
    const intervalID = setInterval(() => setBtnColor(randomColor()), 100)
    return () => clearInterval(intervalID)
  }, [hover])

  useEffect(() => {
    if (typeof window !== undefined) {
      const navigator = window.navigator
      const lang = navigator.languages && navigator.languages.length
        ? navigator.languages[0]
        : navigator.language
      setSiteName(lang === 'zh-CN' ? (
        <div><strong className="sitename">小红花</strong></div>
      ) : 'dFlower')
    }
  }, [])

  if (loading) return <p> Loading...</p>
  if (error) return <p> Oops, somthing went wrong. {error.message}</p>
  

  return (
    <div className="App prose">
      <h1 className='prose-headings:leading-loose'>{siteName}</h1>
      {/* <div className="card">
        <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          style={{ color: btnColor }}>
          开始
        </button>
        <p>
          点击开始，把小红花送给朋友们吧
        </p>
      </div> */}
      
      <ol className='list-none p-0'>
        {data?.rooms && data.rooms.map(room => {
          if(parseInt(room.endedAt) > new Date().getTime()) return


          const date = new Date(parseInt(room.createdAt))
          console.log(room.createdAt, date)
          return <li key={room.id} className='p-0 mb-4'
            title={room.id}>
            <strong className='prose-strong'>{date.toLocaleDateString()}</strong>&nbsp;&nbsp;&nbsp;
            <Link className='not-prose' href={'result?id=' + room.id}>{room.name}</Link>
          </li>
        })}
      </ol>
    </div>
  )

  function randomColor() {
    const colors = ['rgb(207, 20, 114)', '#333']
    const rnd = Math.floor(Math.random() * colors.length)
    return colors[rnd]
  }
}

export default Index
