import React from 'react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

import style from './BlurryMoving.module.css'

type CustomCSSProperties = React.CSSProperties & {
  [key: string]: string | number
}

export const BlurryMoving = ({
  className,
  n = 3,
  blur = 227,
}: {
  className?: string
  n?: number
  blur?: number
}) => {
  const [styles, setStyles] = useState<React.CSSProperties[]>([])
  const filterStyle = { filter: `blur(${blur}px)` }

  const randomPercent = (min = 0, max = 1) =>
    Number((Math.random() * (max - min) + min) * 100).toString() + '%'
  const randomColor = () => {
    const hue = Math.floor(Math.random() * 360)
    const saturation = Math.floor(Math.random() * 20 + 80)
    const lightness = Math.floor(Math.random() * 20 + 80)
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }
  const randomStyle = () => {
    const style: CustomCSSProperties = {
      width: randomPercent(0.2, 0.8),
      height: randomPercent(0.3, 0.6),
      backgroundColor: randomColor(),
      '--x': randomPercent(-0.2),
      '--y': randomPercent(-0.2),
    }
    let index = n
    do {
      style[`--x${index.toString()}`] = randomPercent(-0.2)
      style[`--y${index.toString()}`] = randomPercent(-0.2)
    } while (--index)
    return style
  }

  useEffect(() => {
    setStyles(new Array(n).fill(0).map(() => randomStyle()))
  }, [])

  return (
    <section className={cn(style.container, className)} style={filterStyle}>
      {styles.map((s, i) => (
        <div key={i} className={style.circle} style={s}></div>
      ))}
    </section>
  )
}