'use client'

import React from 'react'
import { Circle, Line, Group } from 'react-konva'
import { Wall, Point } from '../../../application/types'

interface DrawingPreviewProps {
  currentWall: Point[]
  mousePosition: Point | null
  wallThickness?: number // in meters, default 0.23
}

/* ── Vector helpers ──────────────────────────────────────── */

interface V { x: number; y: number }
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y })
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y })
const sc  = (v: V, s: number): V => ({ x: v.x * s, y: v.y * s })
const vlen = (v: V): number => Math.sqrt(v.x * v.x + v.y * v.y)
const norm = (v: V): V => { const l = vlen(v); return l < 1e-12 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l } }
const perp = (v: V): V => ({ x: -v.y, y: v.x })


export const DrawingPreview: React.FC<DrawingPreviewProps> = ({ 
  currentWall, 
  mousePosition,
  wallThickness = 0.23 
}) => {
  if (currentWall.length === 0 || !mousePosition) return null
  
  const start = currentWall[0]
  const end = mousePosition

  // Calculate Layout for single segment
  const half = wallThickness / 2
  const dir = norm(sub(end, start))
  const n = perp(dir)
  
  const p1 = add(start, sc(n, half))
  const p2 = add(start, sc(n, -half))
  const p3 = add(end, sc(n, half))
  const p4 = add(end, sc(n, -half))

  // We could add joint logic here if we passed the previous wall, 
  // but for now a simple segment preview is sufficient and robust.

  return (
    <>
      {/* Snap Points */}
      <Circle
          x={start.x}
          y={start.y}
          radius={0.05}
          fill="#3b82f6"
          stroke="#1e40af"
          strokeWidth={0.01}
      />

      {/* Fill Layer */}
      <Group opacity={0.8}>
            <Line
              points={[p1.x, p1.y, p3.x, p3.y, p4.x, p4.y, p2.x, p2.y]}
              fill="rgba(147, 197, 253, 0.3)" 
              strokeEnabled={false}
              closed
            />
      </Group>

      {/* Stroke Layer */}
      <Group>
            <React.Fragment>
                <Line points={[p1.x, p1.y, p3.x, p3.y]} stroke="#93c5fd" strokeWidth={0.01} dash={[0.05, 0.03]}/>
                <Line points={[p2.x, p2.y, p4.x, p4.y]} stroke="#93c5fd" strokeWidth={0.01} dash={[0.05, 0.03]}/>
                {/* Caps */}
                <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke="#93c5fd" strokeWidth={0.01} />
                <Line points={[p3.x, p3.y, p4.x, p4.y]} stroke="#93c5fd" strokeWidth={0.01} />
            </React.Fragment>
      </Group>

      {/* Mouse cursor snap indicator */}
      <Circle
        x={mousePosition.x}
        y={mousePosition.y}
        radius={0.04}
        fill="#ef4444"
        stroke="#dc2626"
        strokeWidth={0.008}
      />
    </>
  )
}
