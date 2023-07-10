import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Pallatte } from '@/graphql/types'

export type ChordData = {
  data: number[][]
  share: number[]
  names: string[]
  colors: Pallatte
  width: number
  height: number
}

function groupTicks(d, step) {
  const k = (d.endAngle - d.startAngle) / d.value
  return d3.range(0, d.value, step).map(value => {
    return {value: value, angle: value * k + d.startAngle}
  })
}

interface GradientDefsProps {
  chords: d3.Chords;
  colors: {
    normalRGB: string;
  }[];
  innerRadius: number;
}
function GradientDefs({ chords, colors, innerRadius }: GradientDefsProps) {
  return (
    <defs>
      {chords.map((chord, i) => {
        const id = `chord-ribbon-gradient-${chord.source.index}-${chord.target.index}`
        const x1 = innerRadius * Math.cos((chord.source.endAngle - chord.source.startAngle) / 2 + chord.source.startAngle - Math.PI / 2)
        const y1 = innerRadius * Math.sin((chord.source.endAngle - chord.source.startAngle) / 2 + chord.source.startAngle - Math.PI / 2)
        const x2 = innerRadius * Math.cos((chord.target.endAngle - chord.target.startAngle) / 2 + chord.target.startAngle - Math.PI / 2)
        const y2 = innerRadius * Math.sin((chord.target.endAngle - chord.target.startAngle) / 2 + chord.target.startAngle - Math.PI / 2)

        const stopColor1 = colors[chord.target.index].normalRGB
        const stopColor2 = colors[chord.source.index].normalRGB
        
        return (
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2} key={i}>
            <stop offset="0%" stopColor={stopColor1} />
            <stop offset="100%" stopColor={stopColor2} />
          </linearGradient>
        )
      })}
    </defs>
  )
}

export const ChordDiagram: React.FC<ChordData> = ({ data, share, names, colors, width, height }) => {
  const [tooltipStyle, setTooltipStyle] = useState({
    text: '',
    x: 0,
    y: 0,
    opacity: 0
  })
  const [hoverRibbon, setHoverRibbon] = useState<number|null>(null)
  const [hoverArc, setHoverArc] = useState<number|null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [boundingRect, setBoundingRect] = useState<DOMRect>()

  useEffect(() => {
    if(containerRef.current){
      setBoundingRect(containerRef.current.getBoundingClientRect())
    }

    // set gradient

    // highlight color sync table cell
    
  }, [containerRef])

  const outerRadius = Math.min(width, height) * 0.5 - 30
  const innerRadius = outerRadius - 20
  const sum = d3.sum(data.flat())
  // const tickStep = d3.tickStep(0, sum, 100)
  const tickStepMajor = d3.tickStep(0, sum, 20)

  const chord = d3.chord()
    .padAngle(20 / innerRadius)
    .sortSubgroups(d3.descending)

  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius + 26)

  const ribbon = d3.ribbon()
    .radius(innerRadius)

  const chords = chord(data.map((group, index) => {
    return group.map((value) => {
      return value * share[index]
    })
  }))

  console.log('tooltip', tooltipStyle)

  return (
    <div className='relative' ref={containerRef}>
      <svg width={width - 150} height={height - 50} viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
        style={{
          maxWidth: '100%', height: 'auto', font: '14px sans-serif'
        }}>

        {chords.groups.map((groupData, i) => {
          // console.log('groupData', groupData)

          return <g key={i}>
            {/* arc of each person */}
            <path d={arc(groupData)}
              className={'fill-' + colors[i].normal}
              fillOpacity={0.7} 
              onMouseEnter={() => {
                setHoverArc(i)
              }}
              onMouseOut={() => {
                setTooltipStyle({
                  ...tooltipStyle,
                  text: ''
                })
                setHoverArc(null)
              }}
              onMouseMove={e => {
                if(!boundingRect || !containerRef.current) return

                const {value, index} = groupData
                const name = names[index]
                const text = `${(share[index] * 100).toFixed(2)}% ${name}`

                console.log(e.clientX, text)
                
                setTooltipStyle({
                  ...tooltipStyle,
                  text,
                  opacity: 1,
                  x: e.clientX - boundingRect.left - containerRef.current.clientLeft + 12 + window.scrollX,
                  y: e.clientY - boundingRect.top - containerRef.current.clientTop + window.scrollY,
                })
              }}
            />
          
            {/* name of each person along side of arc */}
            {groupTicks(groupData, 100).map((tick, j) => {
              // console.log('inside tick', tick, j, groupData)
              const arcWidth = groupData.endAngle - groupData.startAngle
              const namePosition = tick.angle + arcWidth / 2
              // console.log('arc width', arcWidth)

              const transform = (namePosition > Math.PI / 2 && namePosition < Math.PI * 3 / 2)
                ? 'rotate(-90) translate(0, 14)' 
                : namePosition > Math.PI * 3 / 2 
                  ? 'rotate(90) translate(-80, 0)' 
                  : 'rotate(90) translate(0, 0)' 
              return <g key={j} transform={`rotate(${tick.angle * 180 / Math.PI - 90 + arcWidth * 180 / (Math.PI*2)}) translate(${outerRadius}, 0)`}>

                {tick.value % tickStepMajor === 0 && (
                  <text x={0} transform={transform} textAnchor={tick.angle > Math.PI ? 'end' : undefined}>
                    {names[groupData.index].replace(/#\d+$/, '')}
                  </text>
                )}
              </g>
            })}

            {/* sacles */}
            {/* {groupTicks(groupData, tickStep).map((tick, j) => (
              <g key={j} transform={`rotate(${tick.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`}>
                <line stroke="currentColor" x2={6} />
                {tick.value % tickStepMajor === 0 && (
                  <text x={8} dy=".35em" transform={tick.angle > Math.PI ? 'rotate(180) translate(-16)' : undefined} textAnchor={tick.angle > Math.PI ? 'end' : undefined}>
                    {tick.value ? formatValue(tick.value) : ''}
                  </text>
                )}
              </g>
            ))} */}

          </g>
        })}

        <g>
          {chords.map((chordData, i) => {
            const fillOpacity = (hoverRibbon === null) ? 0.7 
              : hoverRibbon === i ? 1 : .2
          
            const sourceIndex = chordData.source.index
            const targetIndex = chordData.target.index
            // percent from sender to receiver
            return <path key={i} d={ribbon(chordData)} fillOpacity={fillOpacity}
              // className={'fill-' + colors[chordData.target.index].normal} 
              fill={`url(#chord-ribbon-gradient-${sourceIndex}-${targetIndex})`}
            
              onMouseEnter={() => {
                setHoverRibbon(i)
              }}
              onMouseOut={() => {
                setTooltipStyle({
                  ...tooltipStyle,
                  text: ''
                })
                setHoverRibbon(null)
              }}
              onMouseMove={e => {
                if(!boundingRect || !containerRef.current) return
                const {value, index} = chordData.source
                const {index: targetIndex} = chordData.target
                const sourceName = names[index]
                const targetName = names[targetIndex]
                const text = `${(value / share[index]).toFixed(2)}% ${sourceName} → ${targetName}${
                  index !== targetIndex 
                    ? `\n${(chordData.target.value / share[targetIndex]).toFixed(2)}% ${targetName} → ${sourceName}` : ''
                }`

                setTooltipStyle({
                  ...tooltipStyle,
                  text,
                  opacity: 1,
                  x: e.clientX - boundingRect.left - containerRef.current.clientLeft + 12 + window.scrollX,
                  y: e.clientY - boundingRect.top - containerRef.current.clientTop + window.scrollY,
                })
              }}

              stroke={hoverRibbon === null ? 'white' : 'rgba(0,0,0,0)'}
            />
          })}
        </g>

        <GradientDefs chords={chords} colors={colors} innerRadius={innerRadius} />

      </svg>

      <p style={{
        left: tooltipStyle.x + 'px',
        top: tooltipStyle.y + 'px',
        opacity: tooltipStyle.text ? tooltipStyle.opacity : 0,
        whiteSpace: 'pre',
        zIndex: 111
      }} className='bg-white absolute p-2 rounded-sm'>
        {tooltipStyle.text}
      </p>
        
    </div>
  )
}
