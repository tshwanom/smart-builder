import React from 'react'
import { Group, Text, Tag, Label, Line } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { useCanvasStore } from '../../../application/store'
import { Wall, Point } from '../../../application/types'

export const TemporaryDimensions: React.FC = () => {
  const { currentWall, selectedElement, isDrawing, mousePosition } = useCanvasStore()

  return (
    <Group>
      {/* 1. Dynamic Dimension while drawing */}
      {isDrawing && currentWall.length > 0 && (
        <DimensionLabel 
          p1={currentWall[currentWall.length - 1]} 
          p2={mousePosition || currentWall[currentWall.length - 1]} 
          isTemporary={true}
        />
      )}

      {/* 3. Show dimensions for SELECTED wall */}
      {selectedElement?.type === 'wall' && (() => {
        const wall = selectedElement.data as Wall | undefined
        if (!wall || !wall.points || wall.points.length < 2) return null
        
        const walls = useCanvasStore.getState().walls
        
        const p1 = wall.points[0]
        const p2 = wall.points[1]
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const len = Math.sqrt(dx*dx + dy*dy)
        if(len < 0.01) return null

        const nx = -dy / len
        const ny = dx / len
        
        const findGap = (direction: number): { refWall: Wall, dist: number, pt: Point } | null => {
             let closestDist = Infinity
             let closestWall = null
             const mid = { x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2 }
             const searchDir = { x: nx * direction, y: ny * direction }

             for (const w of walls) {
                 if (w.id === wall.id) continue
                 const wdx = w.points[1].x - w.points[0].x
                 const wdy = w.points[1].y - w.points[0].y
                 const wlen = Math.sqrt(wdx*wdx + wdy*wdy)
                 
                 const vToW = { x: mid.x - w.points[0].x, y: mid.y - w.points[0].y }
                 const wDir = { x: wdx/wlen, y: wdy/wlen }
                 
                 const t = vToW.x * wDir.x + vToW.y * wDir.y
                 
                 if (t < 0 || t > wlen) continue 
                 
                 const projPoint = {
                     x: w.points[0].x + wDir.x * t,
                     y: w.points[0].y + wDir.y * t
                 }
                 
                 const distVec = { x: projPoint.x - mid.x, y: projPoint.y - mid.y }
                 const dist = Math.sqrt(distVec.x*distVec.x + distVec.y*distVec.y)
                 const dirCheck = distVec.x * searchDir.x + distVec.y * searchDir.y
                 
                 if (dirCheck > 0 && dist < closestDist) {
                     closestDist = dist
                     closestWall = w
                 }
             }
             
             if (closestWall && closestDist < 10) { 
                 return { refWall: closestWall, dist: closestDist, pt: { x: mid.x + searchDir.x * closestDist/2, y: mid.y + searchDir.y * closestDist/2 } }
             }
             return null
        }
        
        const gap1 = findGap(1)
        const gap2 = findGap(-1)

        // Wall Thickness Handling for Face-to-Face Dimensions
        const wallThickness = wall.thickness || 0.23
        const halfThick = wallThickness / 2

        return (
          <>
            <DimensionLabel 
              p1={wall.points[0]} 
              p2={wall.points[wall.points.length - 1]} 
              isTemporary={false}
              wallId={wall.id}
              type="length"
            />
            {gap1 && (() => {
                const refThick = gap1.refWall.thickness || 0.23
                const halfRefThick = refThick / 2
                // Start Face (Selected Wall)
                const startX = (p1.x+p2.x)/2 + nx * halfThick
                const startY = (p1.y+p2.y)/2 + ny * halfThick
                
                // End Face (Reference Wall)
                const endX = (p1.x+p2.x)/2 + nx * gap1.dist - nx * halfRefThick
                const endY = (p1.y+p2.y)/2 + ny * gap1.dist - ny * halfRefThick
                
                return (
                    <DimensionLabel
                        p1={{ x: startX, y: startY }}
                        p2={{ x: endX, y: endY }}
                        isTemporary={false}
                        wallId={wall.id}
                        type="gap"
                        referenceWallId={gap1.refWall.id}
                        direction={{ x: nx, y: ny }}
                    />
                )
            })()}
            {gap2 && (() => {
                const refThick = gap2.refWall.thickness || 0.23
                const halfRefThick = refThick / 2

                // Start Face (Selected Wall) - note direction is -nx, -ny
                const startX = (p1.x+p2.x)/2 - nx * halfThick
                const startY = (p1.y+p2.y)/2 - ny * halfThick

                // End Face (Reference Wall)
                const endX = (p1.x+p2.x)/2 - nx * gap2.dist + nx * halfRefThick
                const endY = (p1.y+p2.y)/2 - ny * gap2.dist + ny * halfRefThick

                return (
                    <DimensionLabel
                        p1={{ x: startX, y: startY }}
                        p2={{ x: endX, y: endY }}
                        isTemporary={false}
                        wallId={wall.id}
                        type="gap"
                        referenceWallId={gap2.refWall.id}
                        direction={{ x: -nx, y: -ny }}
                    />
                )
             })()}
          </>
        )
      })()}
    </Group>
  )
}

const DimensionLabel = ({ p1, p2, isTemporary, wallId, type = 'length', referenceWallId, direction }: { 
    p1: Point, p2: Point | null, isTemporary: boolean, wallId?: string, 
    type?: 'length' | 'gap', referenceWallId?: string, direction?: Point 
}) => {
  const { setActiveDimension } = useCanvasStore()
  
  if (!p1 || !p2) return null
  
  const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  if (length < 0.01) return null
  
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  
  let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI)
  if (angle > 90 || angle < -90) angle += 180
  
  const displayText = `${Math.round(length * 1000)}` 

  const handleClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isTemporary && wallId) {
          e.cancelBubble = true
          setActiveDimension({
              wallId,
              currentLength: length,
              screenPosition: e.target.getAbsolutePosition(),
              rotation: angle,
              type,
              referenceWallId,
              direction
          })
      }
  }

  // Ticks geometry
  const tickLen = 0.1 // 10cm tick
  const rad = angle * Math.PI / 180
  const tickAngle = rad + Math.PI / 4 // 45 degrees
  const dx = Math.cos(tickAngle) * tickLen
  const dy = Math.sin(tickAngle) * tickLen

  return (
    <Group onClick={handleClick} onTap={handleClick}>
       {type === 'gap' && (
           <>
               {/* Main Dimension Line */}
               <Line 
                  points={[p1.x, p1.y, p2.x, p2.y]}
                  stroke="#64748b"
                  strokeWidth={0.01} // Thin line
               />
               {/* Start Tick */}
               <Line 
                  points={[p1.x - dx, p1.y - dy, p1.x + dx, p1.y + dy]}
                  stroke="#64748b"
                  strokeWidth={0.015}
               />
               {/* End Tick */}
               <Line 
                  points={[p2.x - dx, p2.y - dy, p2.x + dx, p2.y + dy]}
                  stroke="#64748b"
                  strokeWidth={0.015}
               />
           </>
       )}
      
      <Label x={midX} y={midY} rotation={angle}>
        <Tag
          fill={isTemporary ? '#3b82f6' : '#ffffff'} // White background to cover line
          stroke={type === 'gap' ? undefined : undefined} // No border for gap, text floats (or covered line)
          opacity={isTemporary ? 1 : (type === 'gap' ? 0.8 : 0)} // Semi transparent white for gaps
          pointerDirection="down"
          pointerWidth={0.06}
          pointerHeight={0.03}
          cornerRadius={0.02}
        />
        <Text
          text={displayText}
          fontFamily="Inter"
          fontSize={0.2}
          padding={0.05}
          fill={type === 'gap' ? '#334155' : "black"}
          align="center"
        />
      </Label>
    </Group>
  )
}
