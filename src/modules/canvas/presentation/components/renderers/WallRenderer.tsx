'use client'

import React from 'react'
import { Group, Line } from 'react-konva'
import { Wall, Opening, Point, WallTemplate } from '../../../application/types'
import { KonvaEventObject } from 'konva/lib/Node'

import { WallGizmo } from './WallGizmo'
import { WallPatternRenderer } from './WallPatternRenderer'

interface WallRendererProps {
  walls: Wall[]
  openings: Opening[]
  onWallClick?: (id: string) => void
  onWallUpdate?: (id: string, updates: Partial<Wall>) => void
  onBreak?: (id: string, breakPoint: Point) => void
  selectedWallId?: string
  selection: { type: string, data: any }[]
  currentTool: 'select' | 'wall' | 'window' | 'door' | 'break' | 'room'
  templateMap?: Map<string, WallTemplate>
}

/* ── Vector helpers ──────────────────────────────────────── */

interface V { x: number; y: number }
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y })
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y })
const sc  = (v: V, s: number): V => ({ x: v.x * s, y: v.y * s })
const vlen = (v: V): number => Math.sqrt(v.x * v.x + v.y * v.y)
const norm = (v: V): V => { const l = vlen(v); return l < 1e-12 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l } }
const perp = (v: V): V => ({ x: -v.y, y: v.x })
const cross = (a: V, b: V): number => a.x * b.y - a.y * b.x

/* ── Connection Helper ───────────────────────────────────── */

interface Connection { 
  dirAway: V 
  wallId: string
  thickness: number
}

function findConnected(walls: Wall[], skipId: string, pt: Point, eps = 0.05): Connection[] {
  const out: Connection[] = []
  for (const w of walls) {
    if (w.id === skipId || w.points.length < 2) continue
    
    // 1. Check Endpoints
    const s = w.points[0], e = w.points[w.points.length - 1]
    if (vlen(sub(s, pt)) < eps) {
      out.push({ dirAway: norm(sub(e, s)), wallId: w.id, thickness: w.thickness }) 
      continue
    } else if (vlen(sub(e, pt)) < eps) {
      out.push({ dirAway: norm(sub(s, e)), wallId: w.id, thickness: w.thickness })
      continue
    }
    
    // 2. Check Mid-segments (T-Junctions)
    for (let i = 0; i < w.points.length - 1; i++) {
        const p1 = w.points[i]
        const p2 = w.points[i+1]
        const segVec = sub(p2, p1)
        const segLen = vlen(segVec)
        const segDir = norm(segVec)
        
        const vToPt = sub(pt, p1)
        const t = (vToPt.x * segDir.x + vToPt.y * segDir.y) / segLen
        
        // Check distance to line
        const proj = add(p1, sc(segDir, t * segLen))
        const dist = vlen(sub(pt, proj))
        
        if (dist < eps && t > 0 && t < 1) {
             // Connected to mid-segment!
             // Add both directions to simulate continuous wall
             out.push({ dirAway: segDir, wallId: w.id, thickness: w.thickness })
             out.push({ dirAway: sc(segDir, -1), wallId: w.id, thickness: w.thickness })
             break // Don't check other segments of same wall (simplify)
        }
    }
  }
  return out
}

function intersect(p1: Point, d1: V, p2: Point, d2: V): Point {
  const det = cross(d1, d2)
  if (Math.abs(det) < 1e-6) return p1 
  const dp = sub(p2, p1)
  const t = cross(dp, d2) / det
  return add(p1, sc(d1, t))
}

/* ── Geometry Layout Computation ───────────────────── */

interface WallSegmentLayout {
  start: Point
  end: Point
  tl: Point // Top-Left
  tr: Point // Top-Right
  br: Point // Bottom-Right
  bl: Point // Bottom-Left
  snappedStart?: boolean
  snappedEnd?: boolean
}

function getWallLayout(wall: Wall, allWalls: Wall[]): WallSegmentLayout[] {
  const layouts: WallSegmentLayout[] = []
  const half = wall.thickness / 2
  
  for (let i = 0; i < wall.points.length - 1; i++) {
    let start = wall.points[i]
    let end = wall.points[i+1]
    
    // --- Visual Snapping ---
    // Only snap endpoints if they aren't already connected
    const isStartNode = i === 0
    const isEndNode = i === wall.points.length - 2
    
    // Check existing connections first
    let startConns = isStartNode ? findConnected(allWalls, wall.id, start) : []
    let endConns = isEndNode ? findConnected(allWalls, wall.id, end) : []
    
    let snappedStart = false
    let snappedEnd = false
    
    if (isStartNode && startConns.length === 0) {
        const snap = snapToNearbyWalls(start, wall.id, allWalls)
        if (snap.snapped) {
            start = snap.point
            snappedStart = true
            // Re-check connections at snapped point
            startConns = findConnected(allWalls, wall.id, start)
        }
    }
    
    if (isEndNode && endConns.length === 0) {
        const snap = snapToNearbyWalls(end, wall.id, allWalls)
        if (snap.snapped) {
            end = snap.point
            snappedEnd = true
            // Re-check connections at snapped point
            endConns = findConnected(allWalls, wall.id, end)
        }
    }

    const dir = norm(sub(end, start))
    const n = perp(dir) 
    
    // Initial basic rect
    let p1 = add(start, sc(n, half))
    let p2 = add(start, sc(n, -half))
    let p3 = add(end, sc(n, half))
    let p4 = add(end, sc(n, -half))
    
    // --- Start Joint ---
    const v_ins: Connection[] = []
    
    // 1. Internal Connection
    if (i > 0) {
       v_ins.push({ dirAway: sub(start, wall.points[i-1]), wallId: wall.id, thickness: wall.thickness })
    }
    // 2. External Connections
    else {
       // Use original start for connection check (it handles L-joins)
       startConns.forEach(c => {
          v_ins.push({ ...c, dirAway: sc(c.dirAway, -1) })
       })
       
       // Handle closed loop (if wall is closed, start connects to end)
       if (vlen(sub(wall.points[0], wall.points[wall.points.length-1])) < 0.01) {
          v_ins.push({ dirAway: sub(start, wall.points[wall.points.length-2]), wallId: wall.id, thickness: wall.thickness })
       }
    }
    
    if (v_ins.length > 0) {
        // Prefer connections that are NOT parallel/collinear if possible (to form corners)
        // But for T-Junctions, we intersect with the face.
        
        const c = v_ins[0]
        const v_in = c.dirAway
        const n_in = perp(norm(v_in))
        
        // Use connected wall's thickness!
        const otherHalf = c.thickness / 2

        // Incoming Left Line
        const pt_in_left = add(start, sc(n_in, otherHalf))
        const intLeft = intersect(p1, dir, pt_in_left, norm(v_in))
        
        // Safety: Limit miter length
        if (vlen(sub(intLeft, p1)) < Math.max(wall.thickness, c.thickness) * 4) p1 = intLeft
        
        // Incoming Right Line
        const pt_in_right = add(start, sc(n_in, -otherHalf))
        const intRight = intersect(p2, dir, pt_in_right, norm(v_in))
        
        if (vlen(sub(intRight, p2)) < Math.max(wall.thickness, c.thickness) * 4) p2 = intRight
    }
    
    // --- End Joint ---
    const v_outs: Connection[] = []
    
    if (i < wall.points.length - 2) {
       v_outs.push({ dirAway: sub(wall.points[i+2], end), wallId: wall.id, thickness: wall.thickness })
    } else {
       endConns.forEach(c => v_outs.push(c))
       
       // Handle closed loop
       if (vlen(sub(wall.points[0], wall.points[wall.points.length-1])) < 0.01) {
          v_outs.push({ dirAway: sub(wall.points[1], wall.points[0]), wallId: wall.id, thickness: wall.thickness })
       }
    }
    
    if (v_outs.length > 0) {
       const c = v_outs[0]
       const v_out = c.dirAway
       const n_out = perp(norm(v_out))
       
       const otherHalf = c.thickness / 2
       
       const pt_out_left = add(end, sc(n_out, otherHalf))
       const intLeft = intersect(p3, dir, pt_out_left, norm(v_out))
       if (vlen(sub(intLeft, p3)) < Math.max(wall.thickness, c.thickness) * 4) p3 = intLeft
       
       const pt_out_right = add(end, sc(n_out, -otherHalf))
       const intRight = intersect(p4, dir, pt_out_right, norm(v_out))
       if (vlen(sub(intRight, p4)) < Math.max(wall.thickness, c.thickness) * 4) p4 = intRight
    }

    layouts.push({ start, end, tl: p1, bl: p2, tr: p3, br: p4, snappedStart, snappedEnd })
  }
  return layouts
}

// ... existing code ...



/* ── Opening Helper ──────────────────────────────────────── */

function getEffectiveGaps(
  wallLength: number, 
  segmentStartDist: number, 
  segmentLength: number, 
  openings: Opening[]
): { startT: number, endT: number, type: 'window' | 'door' }[] {
  const segmentEndDist = segmentStartDist + segmentLength
  const gaps: { startT: number, endT: number, type: 'window' | 'door' }[] = []

  openings.forEach(op => {
    // Convert relative position (0-1) to absolute distance along wall
    const opCenterDist = op.position * wallLength
    const opHalfWidth = op.width / 2
    const opStartDist = opCenterDist - opHalfWidth
    const opEndDist = opCenterDist + opHalfWidth

    // Check if opening overlaps with this segment
    // Overlap: (OpStart < SegEnd) && (OpEnd > SegStart)
    if (opStartDist < segmentEndDist && opEndDist > segmentStartDist) {
      // Calculate local t (0-1) on segment
      // Clip opening to segment bounds
      const localStartDist = Math.max(segmentStartDist, opStartDist)
      const localEndDist = Math.min(segmentEndDist, opEndDist)

      const startT = (localStartDist - segmentStartDist) / segmentLength
      const endT = (localEndDist - segmentStartDist) / segmentLength
      
      if (endT > startT) {
         gaps.push({ startT, endT, type: op.type })
      }
    }
  })
  
  return gaps.sort((a, b) => a.startT - b.startT)
}

/* ── T-Junction Helper ──────────────────────────────────── */

interface ConnectionGap {
  startT: number
  endT: number
  side: 'left' | 'right'
}

function getIncomingConnections(
  segmentStart: Point, 
  segmentEnd: Point, 
  currentWallId: string, 
  allWalls: Wall[]
): ConnectionGap[] {
  const gaps: ConnectionGap[] = []
  const segVec = sub(segmentEnd, segmentStart)
  const segLen = vlen(segVec)
  
  if (segLen < 0.001) return []
  
  const segDir = norm(segVec)

  allWalls.forEach(otherWall => {
    if (otherWall.id === currentWallId) return
    
    // Check both endpoints of other wall
    const endpoints = [otherWall.points[0], otherWall.points[otherWall.points.length - 1]]
    
    endpoints.forEach(pt => {
        // Project pt onto segment line
        const vToPt = sub(pt, segmentStart)
        const t = (vToPt.x * segDir.x + vToPt.y * segDir.y) / segLen
        
        // Check if projected point is ON the segment (with epsilon buffer)
        // AND check if the point is close enough to the line (distance < epsilon)
        
        // Distance to line
        const projPt = add(segmentStart, sc(segDir, t * segLen))
        const dist = vlen(sub(pt, projPt))
        
        if (dist < 0.2 && t > 0.01 && t < 0.99) {
            // It's a T-junction!
            // Determine side: Cross product of segment direction and vector to other wall *center*?
            // Or use the direction of the other wall leaving the junction
            
            // Find direction of the incoming wall
            // If pt is start, dir is (start -> next point)
            // If pt is end, dir is (end -> prev point)
            let incomingDir: V = { x: 0, y: 0 }
            if (pt === otherWall.points[0]) {
                 incomingDir = norm(sub(otherWall.points[1], otherWall.points[0]))
            } else {
                 incomingDir = norm(sub(otherWall.points[otherWall.points.length - 2], otherWall.points[otherWall.points.length - 1]))
            }
            
            // Cross product: segDir x incomingDir
            // 2D cross: x1*y2 - y1*x2
            
            // If CP > 0, incoming is on "Left"? (Depends on coordinate system)
            // Screen Coords (Y down):
            // Right Hand Rule: X x Y = Z. 
            // Here: X is Right, Y is Down.
            // If we walk from Start to End. Left is...
            // Let's test with cross product.
            // If cp > 0, incoming vector is "Clockwise" from segDir?
            // Actually simpler: 
            // Left Normal = (dy, -dx) or (-dy, dx)? 
            // In layout logic: n = perp(dir) = (-dir.y, dir.x). 
            // If dot(n, incomingDir) > 0, it's on the "Left" side (same side as normal)
            
            const n = perp(segDir)
            const dotN = n.x * incomingDir.x + n.y * incomingDir.y
            
            // perp is (-y, x). Standard CCW rotation.
            // If dotN > 0, incoming is defined by Normal.
            // BUT: Incoming vector points INTO the wall? No, away from it.
            // "dirAway" in `findConnected` was AWAY.
            // Here `incomingDir` is AWAY from the junction (into the other wall body).
            
            // Wall layout p1/p3 are "Left" (Normal side).
            // If incoming wall goes AWAY in direction of Normal (dotN > 0), then it's on the Left side.
            // If incoming wall goes AWAY opposite to Normal (dotN < 0), it's on the Right side.
             
            // Gap Size: Thickness of incoming wall
            const halfThick = otherWall.thickness / 2
            const gapStartDist = (t * segLen) - halfThick
            const gapEndDist = (t * segLen) + halfThick
            
            const startT = Math.max(0, gapStartDist / segLen)
            const endT = Math.min(1, gapEndDist / segLen)
            
            if (endT > startT) {
                gaps.push({ startT, endT, side: dotN > 0 ? 'left' : 'right' })
            }
        }
    })
  })
  
  return gaps
}

/* ── Visual Snapping Helper ─────────────────────────────── */

function snapToNearbyWalls(pt: Point, currentWallId: string, allWalls: Wall[]): { point: Point, snapped: boolean } {
    let bestDist = 0.2 // Max snap distance 200mm
    let bestPt = pt
    let snapped = false
    
    allWalls.forEach(w => {
        if (w.id === currentWallId) return
        
        // Project pt onto wall segment
        for (let i = 0; i < w.points.length - 1; i++) {
             const s = w.points[i]
             const e = w.points[i+1]
             const dir = sub(e, s)
             const len = vlen(dir)
             const normDir = { x: dir.x / len, y: dir.y / len }
             
             const vToPt = sub(pt, s)
             const t = (vToPt.x * normDir.x + vToPt.y * normDir.y) / len
             
             if (t > 0 && t < 1) {
                 const proj = add(s, sc(normDir, t * len))
                 const dist = vlen(sub(pt, proj))
                 
                 if (dist < bestDist) {
                     bestDist = dist
                     bestPt = proj
                     snapped = true
                 }
             }
        }
    })
    
    return { point: bestPt, snapped }
}


function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  }
}

/* ── Render Component ────────────────────────────── */

export const WallRenderer: React.FC<WallRendererProps> = ({
  walls, openings, onWallClick, selectedWallId, selection = [], currentTool = 'select', onBreak, templateMap
}) => {
  const clickable = currentTool !== 'window' && currentTool !== 'door'



  const handleWallClickWrapper = (e: KonvaEventObject<MouseEvent>, wall: Wall) => {
      if (currentTool === 'break') {
         // Calculate click position relative to wall
         const stage = e.target.getStage()
         // We need world coordinates. 
         // Since we don't have viewport info here easily without context, 
         // we rely on the fact that the WallRenderer is inside a Stage which has scale/offset.
         // Wait! The Line click event gives us `evt` which has clientX/Y.
         // BUT `e.target` is the Line node IN WORLD SPACE transformed by the Group/Stage.
         // `stage.getRelativePointerPosition()` returns the pointer position relative to the stage container 
         // but that doesn't account for stage scale/offset if we are just using `pointer`.
         
         // Actually, simpler: The `e.target` (Line)'s parent is the Stage (or Layer). 
         // `stage.getRelativePointerPosition()` accounts for stage transform!
         const transform = stage?.getAbsoluteTransform().copy()
         transform?.invert()
         const pos = transform?.point(stage?.getPointerPosition() || {x:0, y:0})
         
         if (pos) {
             // Snap to nearest point on the wall segments
             // (Re-using logic from finding clicked segment would be ideal, but for now projection is enough)
             let bestPt = pos
             let minD = Infinity
             
             for (let i = 0; i < wall.points.length - 1; i++) {
                 const p1 = wall.points[i]
                 const p2 = wall.points[i+1]
                 const seg = sub(p2, p1)
                 const len = vlen(seg)
                 const dir = norm(seg)
                 
                 const v = sub(pos, p1)
                 const t = Math.max(0, Math.min(len, v.x*dir.x + v.y*dir.y))
                 const proj = add(p1, sc(dir, t))
                 const d = vlen(sub(pos, proj))
                 
                 if (d < minD) {
                     minD = d
                     bestPt = proj
                 }
             }
             
             onBreak?.(wall.id, bestPt)
         }
      } else if (clickable && onWallClick) {
          onWallClick(wall.id)
      }
  }

  return (
    <>
      {/* Layer 1: Fill (Core) - Continuous, no strokes */}
      <Group>
        {walls.map(wall => {
          const isMultiSelected = selection.some(s => s.type === 'wall' && s.data.id === wall.id)
          const sel = wall.id === selectedWallId || isMultiSelected
          const layouts = getWallLayout(wall, walls)
          const wallOpenings = openings.filter(o => o.wallId === wall.id)
          const template = wall.templateId && templateMap ? templateMap.get(wall.templateId) : undefined
          
          let currentDist = 0

          const renderSegment = (key: string, pts: Point[]) => {
              const xs = pts.map(p => p.x)
              const ys = pts.map(p => p.y)
              const minX = Math.min(...xs), maxX = Math.max(...xs)
              const minY = Math.min(...ys), maxY = Math.max(...ys)
              const flatPoints = pts.flatMap(p => [p.x, p.y])
              
              return (
                  <Group key={key}>
                      <Line 
                          points={flatPoints}
                          fill={template?.fillColor || (sel ? '#dbeafe' : '#f1f5f9')}
                          strokeEnabled={false}
                          closed
                          listening={clickable || (currentTool as string) === 'break'}
                          onClick={(e) => handleWallClickWrapper(e, wall)}
                      />
                      {template && (
                          <Group listening={false} clipFunc={(ctx) => {
                              ctx.beginPath()
                              ctx.moveTo(pts[0].x, pts[0].y)
                              for(let k=1; k<pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y)
                              ctx.closePath()
                          }}>
                              <Group x={minX} y={minY}>
                                  <WallPatternRenderer 
                                      width={maxX - minX} 
                                      height={maxY - minY} 
                                      template={template} 
                                  />
                              </Group>
                          </Group>
                      )}
                  </Group>
              )
          }
          
          return (
             <Group key={wall.id}>
                {layouts.map((l, i) => {
                    const segLen = vlen(sub(l.end, l.start))
                    const gaps = getEffectiveGaps(wall.length || 0, currentDist, segLen, wallOpenings)
                    currentDist += segLen
                    
                    if (gaps.length === 0) {
                        return renderSegment(`fill-${i}`, [l.tl, l.tr, l.br, l.bl])
                    } else {
                        // Render sub-segments with perpendicular cuts at openings
                        const parts = []
                        let t = 0
                        
                        // Calculate segment direction and normal for perpendicular cuts
                        const segDir = norm(sub(l.end, l.start))
                        const segNormal = perp(segDir)
                        const half = wall.thickness / 2
                        
                        gaps.forEach((g, gi) => {
                            if (g.startT > t) {
                                // Draw wall from t to g.startT using perpendicular cuts
                                const center0 = lerp(l.start, l.end, t)
                                const center1 = lerp(l.start, l.end, g.startT)
                                
                                const lt0 = add(center0, sc(segNormal, half))
                                const lt1 = add(center1, sc(segNormal, half))
                                const rt0 = add(center0, sc(segNormal, -half))
                                const rt1 = add(center1, sc(segNormal, -half))
                                
                                // Order points for polygon: TL -> TR -> BR -> BL
                                parts.push(renderSegment(`fill-${i}-${gi}`, [lt0, lt1, rt1, rt0]))
                            }
                            t = g.endT
                        })
                        // Final segment
                        if (t < 1) {
                            const center0 = lerp(l.start, l.end, t)
                            const center1 = lerp(l.start, l.end, 1)
                            
                            const lt0 = add(center0, sc(segNormal, half))
                            const lt1 = add(center1, sc(segNormal, half))
                            const rt0 = add(center0, sc(segNormal, -half))
                            const rt1 = add(center1, sc(segNormal, -half))
                            
                            parts.push(renderSegment(`fill-${i}-end`, [lt0, lt1, rt1, rt0]))
                        }
                        return <React.Fragment key={`fill-group-${i}`}>{parts}</React.Fragment>
                    }
                })}
             </Group>
          )
        })}
      </Group>

      {/* Layer 2: Outlines & Openings - Edges only, drawn on top */}
      <Group>
         {walls.map(wall => {
          const sel = wall.id === selectedWallId
          const strokeColor = sel ? '#3b82f6' : '#334155'
          const layouts = getWallLayout(wall, walls)
          const wallOpenings = openings.filter(o => o.wallId === wall.id)
          
          let currentDist = 0

          return (
             <Group key={`stroke-${wall.id}`} listening={false}>
                {layouts.map((l, i) => {
                    const segLen = vlen(sub(l.end, l.start))
                    
                    // 1. Get Opening Gaps (Apply to BOTH sides)
                    const openingGaps = getEffectiveGaps(wall.length || 0, currentDist, segLen, wallOpenings)
                    
                    // 2. Get T-Junction Gaps (Apply to ONE side)
                    const connectionGaps = getIncomingConnections(l.start, l.end, wall.id, walls)
                    
                    // 3. Combine Gaps for each side
                    const leftGaps = [...openingGaps.map(g => ({ ...g, side: 'both' })), ...connectionGaps.filter(g => g.side === 'left')]
                        .sort((a, b) => a.startT - b.startT)
                        
                    const rightGaps = [...openingGaps.map(g => ({ ...g, side: 'both' })), ...connectionGaps.filter(g => g.side === 'right')]
                        .sort((a, b) => a.startT - b.startT)
                        
                    currentDist += segLen
                    
                    // Determine Caps Logic
                    let showStartCap = i === 0
                    if (vlen(sub(wall.points[0], wall.points[wall.points.length-1])) < 0.01) showStartCap = false
                    if (showStartCap && (findConnected(walls, wall.id, l.start).length > 0 || l.snappedStart)) showStartCap = false
                    
                    let showEndCap = i === layouts.length - 1
                    if (vlen(sub(wall.points[0], wall.points[wall.points.length-1])) < 0.01) showEndCap = false
                    if (showEndCap && (findConnected(walls, wall.id, l.end).length > 0 || l.snappedEnd)) showEndCap = false

                    const renderSide = (side: 'left' | 'right', sideGaps: { startT: number, endT: number }[], pStart: Point, pEnd: Point) => {
                         if (sideGaps.length === 0) {
                             return <Line points={[pStart.x, pStart.y, pEnd.x, pEnd.y]} stroke={strokeColor} strokeWidth={0.015} />
                         }
                         
                         const lines = []
                         let t = 0
                         sideGaps.forEach((g, gi) => {
                             if (g.startT > t) {
                                 const p0 = lerp(pStart, pEnd, t)
                                 const p1 = lerp(pStart, pEnd, g.startT)
                                 lines.push(<Line key={`${side}-${i}-${gi}`} points={[p0.x, p0.y, p1.x, p1.y]} stroke={strokeColor} strokeWidth={0.015} />)
                             }
                             t = g.endT
                         })
                         if (t < 1) {
                             const p0 = lerp(pStart, pEnd, t)
                             const p1 = lerp(pStart, pEnd, 1)
                             lines.push(<Line key={`${side}-${i}-end`} points={[p0.x, p0.y, p1.x, p1.y]} stroke={strokeColor} strokeWidth={0.015} />)
                         }
                         return <React.Fragment>{lines}</React.Fragment>
                    }
                    
                    // Render Caps and Jambs (Openings always get jambs)
                    const renderCapsAndJambs = () => {
                        const parts = []
                        // Start Cap
                        if (showStartCap) {
                            parts.push(<Line key={`capS-${i}`} points={[l.tl.x, l.tl.y, l.bl.x, l.bl.y]} stroke={strokeColor} strokeWidth={0.015} />)
                        }
                        // End Cap
                        if (showEndCap) {
                            parts.push(<Line key={`capE-${i}`} points={[l.tr.x, l.tr.y, l.br.x, l.br.y]} stroke={strokeColor} strokeWidth={0.015} />)
                        }
                        
                        // Jambs for OPENINGS only (not T-junctions)
                        openingGaps.forEach((g, gi) => {
                             // Calculate jamb positions perpendicular to wall centerline
                             // instead of interpolating mitered corners
                             const segDir = norm(sub(l.end, l.start))
                             const segNormal = perp(segDir)
                             const half = wall.thickness / 2
                             
                             // Start jamb position on wall centerline
                             const centerStart = lerp(l.start, l.end, g.startT)
                             const lt0 = add(centerStart, sc(segNormal, half))
                             const rt0 = add(centerStart, sc(segNormal, -half))
                             parts.push(<Line key={`jamb1-${i}-${gi}`} points={[lt0.x, lt0.y, rt0.x, rt0.y]} stroke={strokeColor} strokeWidth={0.015} />)
                             
                             // End jamb position on wall centerline
                             const centerEnd = lerp(l.start, l.end, g.endT)
                             const lt1 = add(centerEnd, sc(segNormal, half))
                             const rt1 = add(centerEnd, sc(segNormal, -half))
                             parts.push(<Line key={`jamb2-${i}-${gi}`} points={[lt1.x, lt1.y, rt1.x, rt1.y]} stroke={strokeColor} strokeWidth={0.015} />)
                             
                             // Windows/Doors content
                            const lt_gap_start = lt0
                            const lt_gap_end = lt1
                            const rt_gap_start = rt0
                            const rt_gap_end = rt1
                            
                            if (g.type === 'window') {
                                const centerStart = lerp(lt_gap_start, rt_gap_start, 0.5)
                                const centerEnd = lerp(lt_gap_end, rt_gap_end, 0.5)
                                parts.push(<Line key={`win-${i}-${gi}`} points={[centerStart.x, centerStart.y, centerEnd.x, centerEnd.y]} stroke="#94a3b8" strokeWidth={0.01} />)
                                parts.push(<Line key={`winT-${i}-${gi}`} points={[lt_gap_start.x, lt_gap_start.y, lt_gap_end.x, lt_gap_end.y]} stroke="#cbd5e1" strokeWidth={0.005} />)
                                parts.push(<Line key={`winB-${i}-${gi}`} points={[rt_gap_start.x, rt_gap_start.y, rt_gap_end.x, rt_gap_end.y]} stroke="#cbd5e1" strokeWidth={0.005} />)
                            }
                        })
                        
                        return <React.Fragment>{parts}</React.Fragment>
                    }

                    return (
                        <React.Fragment key={i}>
                            {/* Left Stroke (Top) */}
                            {renderSide('left', leftGaps, l.tl, l.tr)}
                            
                            {/* Right Stroke (Bottom) */}
                            {renderSide('right', rightGaps, l.bl, l.br)}
                            
                            {/* Caps and Jambs */}
                            {renderCapsAndJambs()}
                        </React.Fragment>
                    )
                })}
             </Group>
          )
        })}
      </Group>

      {/* Layer 3: Interactive Gizmos (Handles) - Only for selected wall */}
      {/* We now use the WallGizmo component for complex interactions */}
      <Group>
        {walls.map(wall => {
            if (wall.id !== selectedWallId) return null
            return <WallGizmo key={`gizmo-${wall.id}`} wall={wall} isSelected={true} />
        })}
      </Group>
    </>
  )
}
