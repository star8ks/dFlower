import React, { useEffect, useState } from 'react'
// import './App.css'

function Index() {
  const [btnColor, setBtnColor] = useState('rgb(207, 20, 114)')
  const [hover, setHover] = useState(false)
  const [siteName, setSiteName] = useState<string | JSX.Element>('dFlower')

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
        <div>送你一朵<strong className="sitename">小红花</strong></div>
      ) : 'dFlower')
    }
  })


  return (
    <div className="App">
      <div>
      </div>
      <h1>{siteName}</h1>
      <div className="card">
        <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          style={{ color: btnColor }}>
          开始
        </button>
        <p>
          点击开始，把小红花送给朋友们吧
        </p>
      </div>
    </div>
  )

  function randomColor() {
    const colors = ['rgb(207, 20, 114)', '#333']
    const rnd = Math.floor(Math.random() * colors.length)
    return colors[rnd]
  }
}

export default Index
