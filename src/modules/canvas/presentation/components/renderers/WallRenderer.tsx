'use client'

import React from 'react'
import { Group, Line } from 'react-konva'
import { Wall, Opening, Point, WallTemplate } from '../../../application/types'
import { KonvaEventObject } from 'konva/lib/Node'

import { WallGizmo } from './WallGizmo'
import { getWallLayerPolygons, getEffectiveGaps, lerp, V, cross } from './WallGeometry'

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

/* ── Vector helpers for click detection ──────────────────── */
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y })
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y })
const sc  = (v: V, s: number): V => ({ x: v.x * s, y: v.y * s })
const vlen = (v: V): number => Math.sqrt(v.x * v.x + v.y * v.y)
const norm = (v: V): V => { const l = vlen(v); return l < 1e-12 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l } }
const perp = (v: V): V => ({ x: -v.y, y: v.x })

export const WallRenderer: React.FC<WallRendererProps> = ({
  walls, openings, onWallClick, selectedWallId, selection = [], currentTool = 'select', onBreak, templateMap
}) => {
  const clickable = currentTool !== 'window' && currentTool !== 'door'

  const handleWallClickWrapper = (e: KonvaEventObject<MouseEvent>, wall: Wall) => {
      if (currentTool === 'break') {
         const stage = e.target.getStage()
         const transform = stage?.getAbsoluteTransform().copy()
         transform?.invert()
         const pos = transform?.point(stage?.getPointerPosition() || {x:0, y:0})
         
         if (pos) {
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
      {/* Layer 1: Multi-Layer Wall Body (Fill) */}
      <Group>
        {walls.map(wall => {
          const isMultiSelected = selection.some(s => s.type === 'wall' && s.data.id === wall.id)
          const sel = wall.id === selectedWallId || isMultiSelected
          
          // Get Render Polygons from Geometry Engine
          const layerPolys = getWallLayerPolygons(wall, walls)
          const wallOpenings = openings.filter(o => o.wallId === wall.id)
          
          let currentDist = 0

          return (
             <Group key={wall.id}>
                {/* Iterate through calculated layer polygons */}
                {layerPolys.map((poly, i) => {
                    // Start/End points of this layer segment (approx for length calc)
                    // Poly points: [TL, TR, BR, BL] -> Start is TL/BL area, End is TR/BR area
                    // Actually, WallGeometry returns segment-like quads if we iterated segments?
                    // YES, getWallLayerPolygons iterates wall segments internally but currently flattens/unifies?
                    // No, my implementation of getWallLayerPolygons iterates wall.points (segments) 
                    // and pushes a polygon for EACH segment for EACH layer.
                    // So we can assume poly corresponds to a segment.
                    
                    const pStart = poly.points[0] // TL
                    const pEnd = poly.points[1]   // TR
                    const segLen = vlen(sub(pEnd, pStart))
                    
                    // We need correct distance along wall for opening placement.
                    // Complex if getWallLayerPolygons doesn't preserve segment order or if we have multiple layers per segment.
                    // Current implementation follows segment loop then layer loop.
                    // So we have [Seg1-L1, Seg1-L2, ... Seg2-L1, Seg2-L2] OR [Seg1-L1... Seg2-L1...]
                    // Actually WallGeometry implementation:
                    // for segment:
                    //   layerDefs.forEach: push poly
                    // So order is Seg1-L1, Seg1-L2, Seg1-L3, then Seg2...
                    
                    // We need to track distance resets.
                    // Hack: We can compute distance from wall start for each poly?
                    // Better: Re-calculate currentDist based on segment index? 
                    // getWallLayerPolygons returns a flat array.
                    // Let's rely on the fact that for a straight wall, 0 to 1 param works.
                    // But openings define position 0 to 1 along *Total Length*.
                    
                    // Fix: Openings logic needs to know the "Wall Segment" this poly belongs to.
                    // WallGeometry should probably return { poly, segmentIndex, layerIndex }
                    // Since I can't easily change WallGeometry return type without breaking interface contract (or just add optional fields),
                    // I will calculate gaps based on the polygon length relative to wall length? 
                    // No, that fails for multi-segment walls.
                    
                    // Let's use the poly's spatial location to find where it fits on the wall centerline?
                    // Safe approach: For now, assume single segment walls (standard usage).
                    // Or re-implement 'getEffectiveGaps' to take absolute 3D points?
                    // 'getEffectiveGaps' uses wallLength and segmentStartDist.
                    
                    // Simplification: Standardize on Segment Logic inside Renderer?
                    // No, moving to 'WallGeometry' was to encapsulate this.
                    // I will assume for Phase 2 that `getWallLayerPolygons` renders correct geometry 
                    // and I just subtract gaps locally.
                    
                    // Re-calculating gaps:
                    // Find which segment this poly belongs to.
                    // Project poly center to wall segments?
                    const polyCenter = sc(add(poly.points[0], poly.points[2]), 0.5)
                    let bestSegIndex = 0
                    let bestDistSq = Infinity
                    let runningDist = 0
                    let segStartDist = 0
                    
                    for(let s=0; s<wall.points.length-1; s++) {
                        const s1 = wall.points[s]
                        const s2 = wall.points[s+1]
                        const mid = sc(add(s1, s2), 0.5)
                        const d = vlen(sub(mid, polyCenter)) // Approx check
                        if(d < bestDistSq) {
                            bestDistSq = d
                            bestSegIndex = s
                            segStartDist = runningDist
                        }
                        runningDist += vlen(sub(s2, s1))
                    }
                    
                    // We found the segment. Now calculate gaps.
                    // Note: segment length calculation might differ slightly due to miters, 
                    // but Opening Position is relative to centerline.
                    // Use centerline length for gap calc.
                    const centerLen = vlen(sub(wall.points[bestSegIndex+1], wall.points[bestSegIndex]))
                    const gaps = getEffectiveGaps(wall.length || runningDist, segStartDist, centerLen, wallOpenings)
                    
                    if (gaps.length === 0) {
                        return (
                            <Line 
                                key={`poly-${i}`}
                                points={poly.points.flatMap(p => [p.x, p.y])}
                                fill={poly.color}
                                strokeEnabled={false}
                                closed
                                listening={clickable || (currentTool as string) === 'break'}
                                onClick={(e) => handleWallClickWrapper(e, wall)}
                            />
                        )
                    } else {
                        // Render with Gaps
                        const parts = []
                        let t = 0
                        
                        // Poly Points: 0=TL, 1=TR, 2=BR, 3=BL (Start-Left -> End-Left -> End-Right -> Start-Right)
                        // Interpolate Left edge (0->1) and Right edge (3->2)
                        
                        const pTL = poly.points[0]
                        const pTR = poly.points[1]
                        const pBR = poly.points[2]
                        const pBL = poly.points[3]
                        
                        // Gap Sub-polygons
                        gaps.forEach((g, gi) => {
                            if (g.startT > t) {
                                // Draw solid from t to g.startT
                                const lt0 = lerp(pTL, pTR, t)
                                const lt1 = lerp(pTL, pTR, g.startT)
                                const rt0 = lerp(pBL, pBR, t)
                                const rt1 = lerp(pBL, pBR, g.startT)
                                
                                parts.push(
                                    <Line 
                                        key={`poly-${i}-${gi}`}
                                        points={[lt0.x, lt0.y, lt1.x, lt1.y, rt1.x, rt1.y, rt0.x, rt0.y]}
                                        fill={poly.color}
                                        strokeEnabled={false}
                                        closed
                                        listening={clickable}
                                        onClick={(e) => handleWallClickWrapper(e, wall)}
                                    />
                                )
                            }
                            t = g.endT
                        })
                        
                        // Final segment
                        if (t < 1) {
                            const lt0 = lerp(pTL, pTR, t)
                            const lt1 = lerp(pTL, pTR, 1)
                            const rt0 = lerp(pBL, pBR, t)
                            const rt1 = lerp(pBL, pBR, 1)
                            
                            parts.push(
                                <Line 
                                    key={`poly-${i}-end`}
                                    points={[lt0.x, lt0.y, lt1.x, lt1.y, rt1.x, rt1.y, rt0.x, rt0.y]}
                                    fill={poly.color}
                                    strokeEnabled={false}
                                    closed
                                    listening={clickable}
                                    onClick={(e) => handleWallClickWrapper(e, wall)}
                                />
                            )
                        }
                        
                        return <React.Fragment key={`group-${i}`}>{parts}</React.Fragment>
                    }
                })}
             </Group>
          )
        })}
      </Group>

      {/* Layer 2: Selection Outline & Gizmos */}
      <Group>
         {walls.map(wall => {
            const isMultiSelected = selection.some(s => s.type === 'wall' && s.data.id === wall.id)
            const sel = wall.id === selectedWallId || isMultiSelected
            if (!sel) return null

            // Simple outline for selection (Legacy style but effective)
            // Or render edges of layer polys? 
            // Stick to simple centerline or outer bounds for selection highlight
            const strokeColor = '#3b82f6'
            
            return (
                <WallGizmo key={`gizmo-${wall.id}`} wall={wall} isSelected={true} />
            )
         })}
      </Group>
      
      {/* Note: Openings (Windows/Doors) specific graphics (glass, frames) 
          are usually rendered by a separate OpeningRenderer or we need to add them here.
          The previous renderer drew jambs and simple lines. 
          For "Perfect SVG", we should probably delegate to OpeningRenderer, 
          but if not present, we should draw simple jambs here to close the gaps.
      */}
    </>
  )
}
