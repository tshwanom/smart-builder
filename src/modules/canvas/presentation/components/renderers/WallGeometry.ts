
import { Wall, Point, WallLayer } from '../../../application/types'
import { WallConstruction } from '../../../domain/wall/WallTypes'

export interface V { x: number; y: number }
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y })
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y })
const sc  = (v: V, s: number): V => ({ x: v.x * s, y: v.y * s })
const vlen = (v: V): number => Math.sqrt(v.x * v.x + v.y * v.y)
const norm = (v: V): V => { const l = vlen(v); return l < 1e-12 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l } }
const perp = (v: V): V => ({ x: -v.y, y: v.x }) // Left normal
export const cross = (a: V, b: V): number => a.x * b.y - a.y * b.x

function intersect(p1: Point, d1: V, p2: Point, d2: V): Point {
  const det = cross(d1, d2)
  if (Math.abs(det) < 1e-6) return p1 
  const dp = sub(p2, p1)
  const t = cross(dp, d2) / det
  return add(p1, sc(d1, t))
}

export interface LayerPolygon {
  points: Point[] // 4 points usually (TL, TR, BR, BL) - but ordered for rendering
  layerId: string
  color: string // For design mode
  type: string // "masonry", "cavity", etc.
}

interface WallJoint {
  wallId: string
  type: 'L' | 'T_Into' | 'T_Main' // L=Corner, T_Into=This wall ends at other, T_Main=Other wall ends at this
  pt: Point
  angle: number // Angle between walls
  otherWall: Wall
}

export function getWallLayerPolygons(wall: Wall, allWalls: Wall[]): LayerPolygon[] {
  // 1. Get Construction definition
  // Fallback if no construction defined (Legacy support)
  if (!wall.construction) {
      // Return simple single layer
      return [{
          points: getSimplePoly(wall),
          layerId: 'legacy',
          color: '#d1d5db',
          type: 'generic'
      }]
  }

  const construction = wall.construction
  const totalThick = construction.totalThickness
  const result: LayerPolygon[] = []

  // Pre-calculate layer offsets (relative to centerline)
  // Layer 1 is Exterior (Left +), Layer N is Interior (Right -).
  
  let currentOffset = totalThick / 2
  const layerDefs = construction.layers.map(l => {
      const center = currentOffset - (l.thickness/2)
      currentOffset -= l.thickness
      return { ...l, centerOffset: center }
  })

  // Group segments (if multiple points)
  for (let i = 0; i < wall.points.length - 1; i++) {
     const start = wall.points[i]
     const end = wall.points[i+1]
     const dir = norm(sub(end, start))
     const normal = perp(dir) // Left normal

     // --- Find Connections ---
     const startJoints = findJoints(start, wall.id, allWalls)
     const endJoints = findJoints(end, wall.id, allWalls)
     
     // Process each layer
     layerDefs.forEach(layer => {
         // Calculate infinite lines for this layer edges
         const half = layer.thickness / 2
         const offsetVec = sc(normal, layer.centerOffset)
         
         const pStart = add(start, offsetVec)
         const pEnd = add(end, offsetVec)
         
         // Left edge (Outer relative to layer center)
         const lOffset = sc(normal, half) 
         // Right edge
         const rOffset = sc(normal, -half)

         let tl = add(pStart, lOffset)
         let bl = add(pStart, rOffset)
         let tr = add(pEnd, lOffset)
         let br = add(pEnd, rOffset)
         
         // --- Apply Join Logic ---
         
         // 1. Start Joint
         if (startJoints.length > 0) {
             const joint = startJoints[0]
             
             if (joint.type === 'L') {
                 // Corner Miter
                 const otherLayerOffset = getMatchingLayerOffset(joint.otherWall, layer, construction) ?? 0
                 const otherDir = getWallDirAt(joint.otherWall, joint.pt)
                 const otherNormal = perp(otherDir)
                 
                 const otherCenter = add(joint.pt, sc(otherNormal, otherLayerOffset))
                 
                 const otherEdgeL_pt = add(otherCenter, sc(otherNormal, layer.thickness/2)) 
                 const otherEdgeR_pt = add(otherCenter, sc(otherNormal, -layer.thickness/2))
                 
                 const intL = intersect(tl, dir, otherEdgeL_pt, otherDir)
                 const intR = intersect(bl, dir, otherEdgeR_pt, otherDir)
                 
                 if (vlen(sub(intL, start)) < wall.thickness * 2) tl = intL
                 if (vlen(sub(intR, start)) < wall.thickness * 2) bl = intR
                 
             } else if (joint.type === 'T_Into') {
                 // T-Junction at Start
                 const mainWall = joint.otherWall
                 const mainDir = norm(sub(mainWall.points[1], mainWall.points[0]))
                 const mainNormal = perp(mainDir)
                 
                 const matchOffset = getMatchingLayerOffset(mainWall, layer, construction)
                 
                 if (matchOffset !== null) {
                     const mainCenter = add(joint.pt, sc(mainNormal, matchOffset))
                     const mainEdgeL = add(mainCenter, sc(mainNormal, layer.thickness/2))
                     const mainEdgeR = add(mainCenter, sc(mainNormal, -layer.thickness/2))
                     
                     const intL = intersect(start, dir, mainEdgeL, mainDir)
                     const intR = intersect(start, dir, mainEdgeR, mainDir)
                     
                     const distL = vlen(sub(intL, start))
                     const distR = vlen(sub(intR, start))
                     
                     const bestInt = distL < distR ? intL : intR
                     const stopPt = bestInt
                     const stopDir = mainDir
                     
                     tl = intersect(tl, dir, stopPt, stopDir) 
                     bl = intersect(bl, dir, stopPt, stopDir)
                 }
             }
         }
         
         // 2. End Joint
         if (endJoints.length > 0) {
             const joint = endJoints[0]
             
             if (joint.type === 'L') {
                 // Corner Miter
                 const otherLayerOffset = getMatchingLayerOffset(joint.otherWall, layer, construction) ?? 0
                 
                 // Other wall direction AWAY from joint
                 const otherDir = getWallDirAt(joint.otherWall, joint.pt)
                 const otherNormal = perp(otherDir)
                 
                 const otherCenter = add(joint.pt, sc(otherNormal, otherLayerOffset))
                 
                 const otherEdgeL_pt = add(otherCenter, sc(otherNormal, layer.thickness/2))
                 const otherEdgeR_pt = add(otherCenter, sc(otherNormal, -layer.thickness/2))
                 
                 const intL = intersect(tr, dir, otherEdgeL_pt, otherDir)
                 const intR = intersect(br, dir, otherEdgeR_pt, otherDir)
                 
                 if (vlen(sub(intL, end)) < wall.thickness * 2) tr = intL
                 if (vlen(sub(intR, end)) < wall.thickness * 2) br = intR
                 
             } else if (joint.type === 'T_Into') {
                 // T-Junction at End
                 const mainWall = joint.otherWall
                 const mainDir = norm(sub(mainWall.points[1], mainWall.points[0]))
                 const mainNormal = perp(mainDir)
                 
                 const matchOffset = getMatchingLayerOffset(mainWall, layer, construction)
                 
                 if (matchOffset !== null) {
                     const mainCenter = add(joint.pt, sc(mainNormal, matchOffset))
                     const mainEdgeL = add(mainCenter, sc(mainNormal, layer.thickness/2))
                     const mainEdgeR = add(mainCenter, sc(mainNormal, -layer.thickness/2))
                     
                     const intL = intersect(end, dir, mainEdgeL, mainDir)
                     const intR = intersect(end, dir, mainEdgeR, mainDir)
                     
                     const distL = vlen(sub(intL, end))
                     const distR = vlen(sub(intR, end))
                     
                     const bestInt = distL < distR ? intL : intR
                     const stopPt = bestInt
                     const stopDir = mainDir
                     
                     tr = intersect(tr, dir, stopPt, stopDir) 
                     br = intersect(br, dir, stopPt, stopDir)
                 }
             }
         }
         
         result.push({
             points: [tl, tr, br, bl],
             layerId: layer.id,
             color: getLayerColor(layer.type),
             type: layer.type
         })
     })
  }

  return result
}

// Helpers
function getSimplePoly(wall: Wall): Point[] {
    const half = (wall.thickness || 230) / 2
    if(wall.points.length < 2) return []
    const s = wall.points[0]
    const e = wall.points[wall.points.length-1]
    const dir = norm(sub(e, s))
    const n = perp(dir)
    return [
        add(s, sc(n, half)),
        add(e, sc(n, half)),
        add(e, sc(n, -half)),
        add(s, sc(n, -half))
    ]
}

function findJoints(pt: Point, selfId: string, walls: Wall[]): WallJoint[] {
    const joints: WallJoint[] = []
    walls.forEach(w => {
        if (w.id === selfId || w.points.length < 2) return
        
        // Check endpoints
        const dS = vlen(sub(pt, w.points[0]))
        const dE = vlen(sub(pt, w.points[w.points.length-1]))
        
        if (dS < 0.1 || dE < 0.1) {
            joints.push({
                wallId: w.id,
                type: 'L', 
                pt: dS < dE ? w.points[0] : w.points[w.points.length-1],
                angle: 0,
                otherWall: w
            })
            return
        }
        
        // Check Mid-segment (T connection)
        for (let i = 0; i < w.points.length - 1; i++) {
             const p1 = w.points[i]
             const p2 = w.points[i+1]
             const seg = sub(p2, p1)
             const len = vlen(seg)
             const dir = norm(seg)
             
             const v = sub(pt, p1)
             const t = (v.x*dir.x + v.y*dir.y) / len
             const proj = add(p1, sc(dir, t*len))
             const d = vlen(sub(pt, proj))
             
             if (d < 0.1 && t > 0.05 && t < 0.95) {
                 joints.push({
                     wallId: w.id,
                     type: 'T_Into',
                     pt: proj,
                     angle: 0,
                     otherWall: w
                 })
             }
        }
    })
    return joints
}

function getWallDirAt(wall: Wall, pt: Point): V {
    if (wall.points.length < 2) return {x:1, y:0}
    const s = wall.points[0]
    const e = wall.points[wall.points.length-1]
    if (vlen(sub(pt, s)) < 0.1) return norm(sub(e, s)) 
    if (vlen(sub(pt, e)) < 0.1) return norm(sub(s, e))
    return norm(sub(e, s))
}

function getMatchingLayerOffset(otherWall: Wall, myLayer: any, myConstruction: WallConstruction): number | null {
    if (!otherWall.construction) return null
    
    // Try find index
    const myIdx = myConstruction.layers.findIndex(l => l.id === myLayer.id)
    
    let targetIdx = -1
    
    // If strict layer structure match (e.g. brick-cavity-brick to brick-cavity-brick)
    if (otherWall.construction.layers.length === myConstruction.layers.length) {
        targetIdx = myIdx
    } else {
        // Find by type
        targetIdx = otherWall.construction.layers.findIndex(l => l.type === myLayer.type)
        // If multiple, closest one? Detailed logic for future.
    }
    
    if (targetIdx !== -1) {
        return calculateLayerCenterOffset(otherWall.construction, targetIdx)
    }
    return null
}

function calculateLayerCenterOffset(construction: WallConstruction, index: number): number {
    let currentOffset = construction.totalThickness / 2
    for(let i=0; i<construction.layers.length; i++) {
        const l = construction.layers[i]
        const center = currentOffset - (l.thickness/2)
        if (i === index) return center
        currentOffset -= l.thickness
    }
    return 0
}

function getLayerColor(type: string): string {
    switch(type) {
        case 'masonry_skin': return '#ef4444' // Red-500
        case 'cavity': return '#3b82f6' // Blue-500
        case 'plaster': return '#fca5a5' // Red-300
        case 'drywall_frame': return '#94a3b8' // Slate-400
        case 'gypsum_board': return '#e2e8f0' // Slate-200
        case 'insulation': return '#fde047' // Yellow-300
        case 'icf_core': return '#64748b' // Slate-500
        case 'panel': return '#cbd5e1' // Slate-300
        default: return '#9ca3af'
    }
}

import { Opening } from '../../../application/types'

export function getEffectiveGaps(
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

    // Check overlaps
    if (opStartDist < segmentEndDist && opEndDist > segmentStartDist) {
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

export function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  }
}
