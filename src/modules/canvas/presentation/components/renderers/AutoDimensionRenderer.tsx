import React from 'react'
import { Group, Line, Text, Tag } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { useCanvasStore } from '../../../application/store'
import { Wall } from '../../../application/types'

export const AutoDimensionRenderer: React.FC = () => {
    const { walls, openings, activeStoryId, stories } = useCanvasStore()
    
    // Filter by Active Story
    const activeStory = stories.find(s => s.id === activeStoryId)
    const activeWalls = walls.filter(w => {
         if (!activeStory) return true // Legacy: show all
         return w.storyId === activeStoryId || (!w.storyId && activeStory.level === 0)
    })
    
    // NOTE: We could also filter openings, but logic below relies on scopeWalls anyway.
    // However, for optimization we can filter them too.
    const activeOpenings = openings.filter(o => {
         if (!activeStory) return true
         return o.storyId === activeStoryId || (!o.storyId && activeStory.level === 0)
    })

    if (activeWalls.length === 0) return null

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    activeWalls.forEach(w => {
        const thickness = w.thickness || 0.23 // Default thickness if missing
        const halfThickness = thickness / 2
        w.points.forEach(p => {
             if (p.x - halfThickness < minX) minX = p.x - halfThickness
             if (p.x + halfThickness > maxX) maxX = p.x + halfThickness
             if (p.y - halfThickness < minY) minY = p.y - halfThickness
             if (p.y + halfThickness > maxY) maxY = p.y + halfThickness
        })
    })

    const BASE_OFFSET = 0.8
    const LINE_SPACING = 0.8

    // --- VISIBILITY FILTER (Ray Casting / Occlusion) ---
    const filterVisibleWalls = (allWalls: Wall[], side: 'top' | 'bottom' | 'left' | 'right') => {
        const isHorzGroup = side === 'top' || side === 'bottom'
        
        // 1. Filter by Orientation
        const candidates = allWalls.filter(w => {
            const dx = Math.abs(w.points[1].x - w.points[0].x)
            const dy = Math.abs(w.points[1].y - w.points[0].y)
            const isVert = dy > dx
            return isHorzGroup ? !isVert : isVert
        })

        // 2. Occlusion Test
        return candidates.filter(subject => {
            const sStart = isHorzGroup ? Math.min(subject.points[0].x, subject.points[1].x) : Math.min(subject.points[0].y, subject.points[1].y)
            const sEnd = isHorzGroup ? Math.max(subject.points[0].x, subject.points[1].x) : Math.max(subject.points[0].y, subject.points[1].y)
            const sDepth = isHorzGroup ? (subject.points[0].y + subject.points[1].y)/2 : (subject.points[0].x + subject.points[1].x)/2

            // Check against potential blockers
            const isOccluded = candidates.some(blocker => {
                if (blocker.id === subject.id) return false
                
                const bStart = isHorzGroup ? Math.min(blocker.points[0].x, blocker.points[1].x) : Math.min(blocker.points[0].y, blocker.points[1].y)
                const bEnd = isHorzGroup ? Math.max(blocker.points[0].x, blocker.points[1].x) : Math.max(blocker.points[0].y, blocker.points[1].y)
                const bDepth = isHorzGroup ? (blocker.points[0].y + blocker.points[1].y)/2 : (blocker.points[0].x + blocker.points[1].x)/2

                const hasOverlap = (sStart < bEnd - 0.01) && (bStart < sEnd - 0.01)
                
                if (!hasOverlap) return false

                if (side === 'top') return bDepth < sDepth - 0.01 
                if (side === 'bottom') return bDepth > sDepth + 0.01
                if (side === 'left') return bDepth < sDepth - 0.01
                if (side === 'right') return bDepth > sDepth + 0.01
                
                return false
            })

            return !isOccluded
        })
    }

    // Apply Filter to each side
    const topWalls = filterVisibleWalls(activeWalls, 'top')
    const bottomWalls = filterVisibleWalls(activeWalls, 'bottom')
    const leftWalls = filterVisibleWalls(activeWalls, 'left')
    const rightWalls = filterVisibleWalls(activeWalls, 'right')

    // Helper to generate points for a tier
    const getTierPoints = (side: 'top' | 'bottom' | 'left' | 'right', tier: 1|2|3, scopeWalls: Wall[]) => {
        let isVertical = false
        if (side === 'left' || side === 'right') isVertical = true
        
        // Scope walls are already filtered by side
        if (scopeWalls.length === 0) return []

        let points: number[] = []

        if (tier === 3) {
            // Tier 3: Overall Bounds (Exterior Faces)
             let minVal = Infinity, maxVal = -Infinity
             activeWalls.forEach(w => {
                 const thickness = w.thickness || 0.23
                 const halfThk = thickness / 2
                 w.points.forEach(p => {
                      const val = isVertical ? p.y : p.x
                      if (val - halfThk < minVal) minVal = val - halfThk
                      if (val + halfThk > maxVal) maxVal = val + halfThk
                 })
             })
             points = [minVal, maxVal]
        } else {
             // Tier 1 (Details: Walls + Openings) & Tier 2 (Structural: Walls Only)
             const includeOpenings = tier === 1
             const rawPoints = new Set<number>()
             
             // 1. Add faces of Visible Parallel Walls (The Boundary Walls)
             // We project ALL scope walls to the dimension line. 
             // This automatically handles "Stepped" facades by flattening them.
             scopeWalls.forEach(w => {
                 const axisCoord = isVertical ? w.points[0].y : w.points[0].x
                 const thickness = w.thickness || 0.23
                 rawPoints.add(axisCoord - thickness/2)
                 rawPoints.add(axisCoord + thickness/2)
             })

             // 2. Add faces of Perpendicular Walls that CONNECT to Visible Walls
             // This picks up the "Jog" or "Step" walls (Returns).
             activeWalls.forEach(w => {
                 const dx = w.points[1].x - w.points[0].x
                 const dy = w.points[1].y - w.points[0].y
                 const isWallVertical = Math.abs(dy) > Math.abs(dx)
                 
                 // If Perpendicular (Vertical wall for Top/Bottom dimension)
                 if (isVertical !== isWallVertical) {
                     // Check connectivity to ANY scope wall
                     const isConnectedToScope = scopeWalls.some(sw => {
                         const swP1 = sw.points[0]; const swP2 = sw.points[1]
                         const wP1 = w.points[0]; const wP2 = w.points[1]
                         const d2 = (p1: {x:number, y:number}, p2: {x:number, y:number}) => (p1.x-p2.x)**2 + (p1.y-p2.y)**2
                         const EPS = 0.15 
                         return d2(swP1, wP1)<EPS || d2(swP1, wP2)<EPS || d2(swP2, wP1)<EPS || d2(swP2, wP2)<EPS
                     })

                     if (isConnectedToScope) {
                         // Add thickness of this return wall
                         const axisCoord = isVertical ? w.points[0].y : w.points[0].x
                         const thickness = w.thickness || 0.23
                         rawPoints.add(axisCoord - thickness/2)
                         rawPoints.add(axisCoord + thickness/2)
                     }
                 }
             })

             // 3. Add Openings (Only for Tier 1)
             if (includeOpenings) {
                 activeOpenings.forEach(o => {
                     const wallInScope = scopeWalls.find(w => w.id === o.wallId)
                     if (wallInScope) {
                           const wall = wallInScope
                           const dx = wall.points[1].x - wall.points[0].x
                           const dy = wall.points[1].y - wall.points[0].y
                           const isWallVertical = Math.abs(dy) > Math.abs(dx)
                           
                           if (isVertical === isWallVertical) {
                               const openingCenterVal = isWallVertical 
                                    ? wall.points[0].y + (wall.points[1].y - wall.points[0].y) * o.position
                                    : wall.points[0].x + (wall.points[1].x - wall.points[0].x) * o.position
                               const halfWidth = o.width / 2
                               rawPoints.add(openingCenterVal - halfWidth)
                               rawPoints.add(openingCenterVal + halfWidth)
                           }
                     }
                 })
             }
             
             // Strict Dedup & Sort
             const sorted = Array.from(rawPoints).sort((a,b) => a-b)
             points = []
             if (sorted.length > 0) {
                 points.push(sorted[0])
                 for(let i=1; i<sorted.length; i++) {
                     if (Math.abs(sorted[i] - sorted[i-1]) > 0.001) { // 1mm precision
                         points.push(sorted[i])
                     }
                 }
             }
        }
        return points
    }

    const renderTier = (side: 'top' | 'bottom' | 'left' | 'right', tier: 1|2|3, offset: number, points: number[]) => {
         let axisPos = 0
         let isVertical = false
         
         // Calculate Global Bounds for Axis Position
         let minVal = Infinity, maxVal = -Infinity
         activeWalls.forEach(w => {
             const thickness = w.thickness || 0.23; const hT = thickness/2
             const vMin = (side === 'left' || side === 'right' ? w.points[0].x : w.points[0].y) - hT
             const vMax = (side === 'left' || side === 'right' ? w.points[0].x : w.points[0].y) + hT
             if (vMin < minVal) minVal = vMin
             if (vMax > maxVal) maxVal = vMax
             
             // Also check point 1
             const p1Min = (side === 'left' || side === 'right' ? w.points[1].x : w.points[1].y) - hT
             const p1Max = (side === 'left' || side === 'right' ? w.points[1].x : w.points[1].y) + hT
             if (p1Min < minVal) minVal = p1Min
             if (p1Max > maxVal) maxVal = p1Max
         })

         if (side === 'top') { axisPos = minVal - offset; isVertical = false }
         if (side === 'bottom') { axisPos = maxVal + offset; isVertical = false }
         if (side === 'left') { axisPos = minVal - offset; isVertical = true }
         if (side === 'right') { axisPos = maxVal + offset; isVertical = true }

         const segments = []
         for(let i=0; i<points.length-1; i++) {
              const start = points[i]
              const end = points[i+1]
              // Filter micro-segments (often floating point noise)
              if (Math.abs(end - start) < 0.005) continue 

              segments.push(
                  <AutoDimensionLabel 
                     key={`${side}-${tier}-${i}`}
                     side={side}
                     start={start} end={end} axisPos={axisPos} isVertical={isVertical}
                     // Click disabled for face-to-face stability
                     // wallId={relevantWallId} isClickable={isClickable} 
                  />
              )
         }
         return <Group key={tier}>{segments}</Group>
    }

    const renderSideGroup = (side: 'top' | 'bottom' | 'left' | 'right', scopeWalls: Wall[]) => {
        if (scopeWalls.length === 0) return null

        const tier1Pts = getTierPoints(side, 1, scopeWalls) // Walls + Openings
        const tier2Pts = getTierPoints(side, 2, scopeWalls) // Walls Only
        const tier3Pts = getTierPoints(side, 3, activeWalls) // Overall (use all walls for global bounds)

        const layers = []
        let currentOffset = BASE_OFFSET

        const arePointsEqual = (a: number[], b: number[]) => {
            if (a.length !== b.length) return false
            return a.every((v, i) => Math.abs(v - b[i]) < 0.01)
        }
        
        // Detect "Complex" Facade (Stepped Walls / Corners)
        const isVertical = side === 'left' || side === 'right'
        let isComplexFacade = false
        if (scopeWalls.length > 1) {
            const firstAxis = isVertical ? scopeWalls[0].points[0].x : scopeWalls[0].points[0].y
            isComplexFacade = scopeWalls.some(w => {
                 const axis = isVertical ? w.points[0].x : w.points[0].y
                 return Math.abs(axis - firstAxis) > 0.05 
            })
        }

        // Tier 1: Details
        // Render if logic requires it (Openings OR Complex Facade)
        const hasOpenings = !arePointsEqual(tier1Pts, tier2Pts)
        // Check if complex facade AND points are different enough to warrant a separate tier? 
        // Actually, if T1 == T2, rendering both just draws on top of each other.
        // User wants 3 tiers VISUALLY.
        // So we strictly render T1 if hasOpenings OR isComplexFacade.
        const showTier1 = hasOpenings || isComplexFacade
        
        if (showTier1 && tier1Pts.length > 1) {
            layers.push(renderTier(side, 1, currentOffset, tier1Pts))
            currentOffset += LINE_SPACING
        }

        // Tier 2: Structural (Walls)
        // Always render if meaningful
        if (tier2Pts.length > 1) {
             layers.push(renderTier(side, 2, currentOffset, tier2Pts))
             currentOffset += LINE_SPACING
        }

        // Tier 3: Overall (Always render if meaningful)
        if (tier3Pts.length > 1) {
             layers.push(renderTier(side, 3, currentOffset, tier3Pts))
        }

        return <Group>{layers}</Group>
    }
    
    return (
        <Group>
            {renderSideGroup('top', topWalls)}
            {renderSideGroup('bottom', bottomWalls)}
            {renderSideGroup('left', leftWalls)}
            {renderSideGroup('right', rightWalls)}
        </Group>
    )
}

const AutoDimensionLabel = ({ side, start, end, axisPos, isVertical, wallId, isClickable, isRelativeMove, referenceWallId }: 
    { side: 'top' | 'bottom' | 'left' | 'right', start: number, end: number, axisPos: number, isVertical: boolean, wallId?: string, isClickable?: boolean, isRelativeMove?: boolean, referenceWallId?: string }) => {
    
    const { setActiveDimension } = useCanvasStore()
    const val = Math.round((end - start) * 1000)
    const center = (start + end) / 2
    
    const p1 = isVertical ? { x: axisPos, y: start } : { x: start, y: axisPos }
    const p2 = isVertical ? { x: axisPos, y: end } : { x: end, y: axisPos }
    
    const rotation = isVertical ? -90 : 0
    const textPos = isVertical ? { x: axisPos - 0.2, y: center } : { x: center, y: axisPos - 0.2 }

    const handleClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (isClickable && wallId) {
            e.cancelBubble = true
            const angle = isVertical ? -90 : 0
            
            if (isRelativeMove && referenceWallId) {
                setActiveDimension({
                    wallId, referenceWallId,
                    currentLength: (end - start),
                    screenPosition: e.target.getAbsolutePosition(),
                    rotation: angle,
                    type: 'gap' 
                })
            } else {
                setActiveDimension({
                    wallId,
                    currentLength: (end - start),
                    screenPosition: e.target.getAbsolutePosition(),
                    rotation: angle,
                    type: 'length'
                })
            }
        }
    }

    // Witness Line Calc
    // Extend towards the object (Opposite to offset direction)
    const EXT_OVERHANG = 0.1 // How much it crosses the dim line away from object
    const EXT_LENGTH = 0.3   // How much it extends towards object
    
    let w1Start = {x:0, y:0}; let w1End = {x:0, y:0}
    let w2Start = {x:0, y:0}; let w2End = {x:0, y:0}
    
    if (side === 'top') {
        // Line is above. Extends DOWN (+y)
        w1Start = { x: p1.x, y: axisPos - EXT_OVERHANG }
        w1End =   { x: p1.x, y: axisPos + EXT_LENGTH }
        w2Start = { x: p2.x, y: axisPos - EXT_OVERHANG }
        w2End =   { x: p2.x, y: axisPos + EXT_LENGTH }
    } else if (side === 'bottom') {
        // Line is below. Extends UP (-y)
        w1Start = { x: p1.x, y: axisPos + EXT_OVERHANG }
        w1End =   { x: p1.x, y: axisPos - EXT_LENGTH }
        w2Start = { x: p2.x, y: axisPos + EXT_OVERHANG }
        w2End =   { x: p2.x, y: axisPos - EXT_LENGTH }
    } else if (side === 'left') {
        // Line is left. Extends RIGHT (+x)
        w1Start = { x: axisPos - EXT_OVERHANG, y: p1.y }
        w1End =   { x: axisPos + EXT_LENGTH,   y: p1.y }
        w2Start = { x: axisPos - EXT_OVERHANG, y: p2.y }
        w2End =   { x: axisPos + EXT_LENGTH,   y: p2.y }
    } else { // right
        // Line is right. Extends LEFT (-x)
        w1Start = { x: axisPos + EXT_OVERHANG, y: p1.y }
        w1End =   { x: axisPos - EXT_LENGTH,   y: p1.y }
        w2Start = { x: axisPos + EXT_OVERHANG, y: p2.y }
        w2End =   { x: axisPos - EXT_LENGTH,   y: p2.y }
    }

    return (
        <Group onClick={handleClick} onTap={handleClick}>
            {/* Main Dim Line */}
            <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke="#64748b" strokeWidth={0.01} />
            
             {/* Witness 1 */}
             <Line points={[w1Start.x, w1Start.y, w1End.x, w1End.y]} stroke="#64748b" strokeWidth={0.01} />
             {/* Witness 2 */}
             <Line points={[w2Start.x, w2Start.y, w2End.x, w2End.y]} stroke="#64748b" strokeWidth={0.01} />

             {/* Ticks (Diagonal) */}
             <Line points={[p1.x - 0.05, p1.y - 0.05, p1.x + 0.05, p1.y + 0.05]} stroke="#64748b" strokeWidth={0.015} />
             <Line points={[p2.x - 0.05, p2.y - 0.05, p2.x + 0.05, p2.y + 0.05]} stroke="#64748b" strokeWidth={0.015} />

            {isClickable && (
                 <Tag 
                    x={textPos.x} y={textPos.y}
                    fill={isRelativeMove ? "#fbbf24" : "#bfdbfe"} 
                    opacity={0.3}
                    pointerWidth={0.2}
                    pointerHeight={0.1}
                 />
            )}

            <Text 
                x={textPos.x} 
                y={textPos.y}
                text={val.toString()}
                fontSize={0.15}
                fill={isClickable ? (isRelativeMove ? "#d97706" : "#2563eb") : "#334155"} 
                fontStyle={isClickable ? "bold" : "normal"}
                rotation={rotation}
                align="center"
                verticalAlign="middle"
                offsetX={isVertical ? 0 : (val.toString().length * 0.15)/2} 
                offsetY={isVertical ? (val.toString().length * 0.15)/2 : 0}
            />
        </Group>
    )
}
