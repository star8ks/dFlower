import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import {select} from 'd3-selection'


export type ChordData = {
  data: number[][]; names: string[]; colors: string[];
  width: number;
  height: number;
}


function groupTicks(d, step) {
  const k = (d.endAngle - d.startAngle) / d.value
  return d3.range(0, d.value, step).map(value => {
    return {value: value, angle: value * k + d.startAngle}
  })
}

export const ChordDiagram: React.FC<ChordData> = ({ data, names, colors, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipText, setTooltipText] = useState('')

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const tooltip = d3.select(tooltipRef.current)
    tooltip.append('div')
      .style('opacity', 0)
      .style('background-color', 'white')
      .style('border', 'solid')
      .style('border-width', '2px')
      .style('border-radius', '5px')
      .style('padding', '5px')

    const mouseout = function() {
      tooltip
        .style('opacity', 0)
    }

    const outerRadius = Math.min(width, height) * 0.5 - 30
    const innerRadius = outerRadius - 20
    const sum = d3.sum(data.flat())
    const tickStep = d3.tickStep(0, sum, 100)
    const tickStepMajor = d3.tickStep(0, sum, 20)
    const formatValue = d3.formatPrefix(',.0', tickStep)

    const chord = d3.chord()
      .padAngle(20 / innerRadius)
      .sortSubgroups(d3.descending)

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)

    const ribbon = d3.ribbon()
      .radius(innerRadius)

    const chords = chord(data)

    const group = svg.append('g')
      .selectAll()
      .data(chords.groups)
      .join('g')
      .attr('x', width/2)
      .attr('y', height/2)

    group.append('path')
      .attr('fill', d => colors[d.index])
      .attr('d', arc)
      .append('title')
      .text(d => `${d.value.toLocaleString('en-US')} ${names[d.index]}`)

    const groupTick = group.append('g')
      .selectAll()
      .data(d => groupTicks(d, tickStep))
      .join('g')
      .attr('transform', d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`)

    groupTick.append('line')
      .attr('stroke', 'currentColor')
      .attr('x2', 6)

    groupTick
      .filter(d => d.value % tickStepMajor === 0)
      .append('text')
      .attr('x', 8)
      .attr('dy', '.35em')
      .attr('transform', d => d.angle > Math.PI ? 'rotate(180) translate(-16)' : null)
      .attr('text-anchor', d => d.angle > Math.PI ? 'end' : null)
      .text(d => formatValue(d.value))

    svg.append('g')
      .attr('fill-opacity', 0.7)
      .selectAll()
      .data(chords)
      .join('path')
      .attr('d', ribbon)
      .attr('fill', d => colors[d.target.index])
      .attr('stroke', 'white')
      .on('mouseover', function(e, d: d3.Chord) {
        select(this)
          .attr('stroke-width', 2)
        tooltip.style('opacity', 1)

        const {value, index} = d.source
        const {index: targetIndex} = d.target
        setTooltipText(`${value} ${names[index]} → ${names[targetIndex]}${index !== targetIndex ? `\n${d.target.value} ${names[targetIndex]} → ${names[index]}` : ''}`)
        console.log({ source: index, target: targetIndex })
      })
      .on('mouseout', mouseout)
  }
  , [data, names, colors])

  return (<>
    <svg ref={svgRef} viewBox={`${-width/2} ${-height/2} ${width} ${height}`}
      fill='none' xmlns='http://www.w3.org/2000/svg' style={{
        maxWidth: '50vw', height: 'auto',
      }} preserveAspectRatio="xMaxYMax meet" />
    <div ref={tooltipRef}>{tooltipText}</div>
  </>
  )
}