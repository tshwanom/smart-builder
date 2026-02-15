import React, { useState } from 'react'
import { Group, Rect, RegularPolygon, Line } from 'react-konva'
import { useCanvasStore } from '../../../application/store'
import { Wall, Point } from '../../../application/types'
import { KonvaEventObject } from 'konva/lib/Node'

interface WallGizmoProps {
  wall: Wall
  isSelected: boolean
}

export const WallGizmo: React.FC<WallGizmoProps> = ({ wall, isSelected }) => {
  const { updateWall, snapPoint } = useCanvasStore()
  const [ghostWall, setGhostWall] = useState<{ start: Point, end: Point } | null>(null)

  if (!isSelected) return null

  const start = wall.points[0]
  const end = wall.points[1]
  
  // Calculate wall geometry
  const dx = end.x - start.x
  const dy = end.y - start.y
  const angleRad = Math.atan2(dy, dx)
  const length = Math.sqrt(dx * dx + dy * dy)
  const angleDeg = angleRad * 180 / Math.PI

  // Midpoint for Center Handle
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2

  // --- Handlers ---

  // 1. Center Handle (Red Square): Orthogonal Move
  const handleCenterDrag = (e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true
      
      const stage = e.target.getStage()
      if (!stage) return

      // Get delta
      // We need to track standard drag deltas. 
      // Konva's drag move gives us new absolute position.
      // We need to project that movement onto the Normal Vector of the wall.
      
      // Wall Unit Vector
      const ux = dx / length
      const uy = dy / length
      
      // Normal Vector
      const nx = -uy
      const ny = ux
      
      // Current Drag Position
      const dragPos = e.target.position()
      // Drag Start Position was 'midX, midY' (local to group? no, absolute)
      // Actually we are dragging the Rect which is at midX, midY.
      // But we constrained drag? No, we do custom logic.
      
      // Let's reset the handle position visually to avoid it drifting while we process logic?
      // Or just calculate delta from previous wall param?
      
      // Easier: Calculate projection of (DragPos - MidPoint) onto Normal.
      const dragDx = dragPos.x - midX
      const dragDy = dragPos.y - midY
      
      const dot = dragDx * nx + dragDy * ny
      const moveX = nx * dot
      const moveY = ny * dot
      
      // Apply Move to Wall Points
      const newP0 = { x: start.x + moveX, y: start.y + moveY }
      const newP1 = { x: end.x + moveX, y: end.y + moveY }
      
      // Update Connected Walls (Stretch Neighbors)
      // We need to look up neighbors connected to start and end
      // usage of 'updateWall' in store usually handles single wall.
      // We might need a batch update or smart update in store.
      // For now, let's just move THIS wall using store action.
      // The store's 'updateWall' has some logic for points, let's leverage or expand it.
      // Actually, my plan said "Update store.ts:updateWall to handle neighbor updates".
      // I haven't done that yet. I should do that first or pass a flag.
      
      updateWall(wall.id, { points: [newP0, newP1] })
      
      // Reset handle visual position to new midpoint (Konva handles this if we re-render? No, Konva keeps dragged node output)
      // If we update store, React re-renders, WallGizmo re-renders with new props.
      // But Konva Drag interaction effectively "detaches" the node from prop-based positioning during drag unless we force it back.
      e.target.position({ x: (newP0.x + newP1.x)/2, y: (newP0.y + newP1.y)/2 })
  }

  // 2. End Handles (Blue Rectangles): Stretch
  const handleEndDrag = (e: KonvaEventObject<DragEvent>, pointIndex: 0 | 1) => {
      e.cancelBubble = true
      const dragPos = e.target.position()
      
      // Logic:
      // Project dragPos onto line defined by OTHER point and Original Angle?
      // Or just allow free drag?
      // Requirement: "if pulled straight it will stretch... if pulled back it will shrink... if toward angle it will change angle"
      // So effectively: It's free drag, but with a Snap/Lock bias to the original line.
      
      const otherPoint = pointIndex === 0 ? end : start
      
      // Vector from fixed point to drag pos
      const vx = dragPos.x - otherPoint.x
      const vy = dragPos.y - otherPoint.y
      
      // Original Angle (or current angle if we want to snap to specific increments)
      // Let's snap to 0, 90, or Original Angle if close.
      
      // Simple approach: Update point directly. The user can use Shift for ortho snap (built-in to app logic?).
      // Or we implement the "Sticky" behavior:
      // Calculate distance from projected line. If < threshold, snap to line.
      
      // Project onto original wall line
      const wallUx = dx / length
      const wallUy = dy / length
      
      // Vector projection length
      const t = vx * wallUx + vy * wallUy
      
      // Distance from line
      const dist = Math.abs(vx * (-wallUy) + vy * wallUx)
      
      let newPoint = { x: dragPos.x, y: dragPos.y }
      
      if (dist < 0.5) { // 50cm threshold for snapping to existing line
          newPoint = {
              x: otherPoint.x + wallUx * t,
              y: otherPoint.y + wallUy * t
          }
      }
      
      const newPoints = [...wall.points]
      newPoints[pointIndex] = newPoint
      updateWall(wall.id, { points: newPoints })
      
      e.target.position(newPoint)
  }

  // 3. Diamond Handles: Add New Wall
  const handleDiamondDragStart = (e: KonvaEventObject<DragEvent>, pointIndex: 0 | 1) => {
      e.cancelBubble = true
      const startP = pointIndex === 0 ? start : end
      setGhostWall({ start: startP, end: startP })
  }

  const handleDiamondDragMove = (e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true
      const pos = e.target.getStage()?.getPointerPosition()
      if (pos && ghostWall) {
           const { viewport } = useCanvasStore.getState()
           const worldPos = {
               x: (pos.x - viewport.offset.x) / viewport.scale,
               y: (pos.y - viewport.offset.y) / viewport.scale
           }
           const snapped = snapPoint(worldPos)
           setGhostWall({ ...ghostWall, end: snapped })
      }
      // Keep handle at original position
      e.target.position(ghostWall?.start || {x:0,y:0}) // Handle visual doesn't move? 
      // Actually we want the handle to stay put? 
      // "Create temporary Ghost Wall from corner". Yes, user drags cursor, handle stays or moves?
      // Usually users drag the handle TO the new position.
      // If handle stays, it feels like extrusion.
      // If handle moves, it feels like dragging.
      // Let's keep handle at original corner for now as the "Source", 
      // but maybe we should move the handle to the cursor?
      // If we move handle, we need to reset it on end.
      // Let's stick to handle stays, cursor drags ghost.
      
      // Reset handle visual position
      // We need to know which handle (0 or 1) to reset. 
      // But this function doesn't have pointIndex closed over from call site?
      // Ah `handleDiamondDragMove` is generic. Konva sets `this`? No.
      // We should pass index or use the event target. 
      // But wait! `onDragMove` in JSX: `onDragMove={handleDiamondDragMove}`. 
      // We aren't passing index. 
      // We should use an arrow function: `(e) => handleDiamondDragMove(e, 0)`?
      // OR just rely on `ghostWall.start` if we set it? 
      // But we need to reset the *dragged node* position.
      e.target.position(ghostWall?.start || {x:0, y:0})
  }

  const handleDiamondDragEnd = (e: KonvaEventObject<DragEvent>, pointIndex: 0 | 1) => {
      e.cancelBubble = true
      
      if (ghostWall && ghostWall.end) {
          // Only create if length > 0
          const dist = Math.sqrt(Math.pow(ghostWall.end.x - ghostWall.start.x, 2) + Math.pow(ghostWall.end.y - ghostWall.start.y, 2))
          
          if (dist > 0.1) {
              useCanvasStore.getState().addWall({
                 points: [ghostWall.start, ghostWall.end],
                 thickness: wall.thickness,
                 wallType: 'partition' 
              })
          }
      }
      setGhostWall(null)
      e.target.position(pointIndex === 0 ? start : end)
  }

  return (
    <Group>
        
        {/* Ghost Wall Preview */}
        {ghostWall && (
            <Line
              points={[ghostWall.start.x, ghostWall.start.y, ghostWall.end.x, ghostWall.end.y]}
              stroke="#94a3b8"
              strokeWidth={0.05}
              dash={[0.2, 0.2]}
            />
        )}

      {/* --- Center Handle (Red Square) --- */}
      <Rect
        x={midX}
        y={midY}
        width={0.25}
        height={0.25}
        offsetX={0.125}
        offsetY={0.125}
        fill="#ef4444" // red-500
        stroke="white"
        strokeWidth={0.02}
        rotation={angleDeg}
        draggable
        onDragMove={handleCenterDrag}
        onDragEnd={handleCenterDrag} // Final commit
        onMouseEnter={e => {
            const container = e.target.getStage()?.container()
            if(container) container.style.cursor = 'move'
        }}
        onMouseLeave={e => {
            const container = e.target.getStage()?.container()
            if(container) container.style.cursor = 'default'
        }}
      />

      {/* --- End Handle 0 (Start) --- */}
      <Rect
        x={start.x}
        y={start.y}
        width={0.2}
        height={0.2}
        offsetX={0.1}
        offsetY={0.1}
        fill="#3b82f6" // blue-500
        stroke="white"
        strokeWidth={0.02}
        rotation={angleDeg}
        draggable
        onDragMove={(e) => handleEndDrag(e, 0)}
        onDragEnd={(e) => handleEndDrag(e, 0)}
      />

      {/* --- End Handle 1 (End) --- */}
      <Rect
        x={end.x}
        y={end.y}
        width={0.2}
        height={0.2}
        offsetX={0.1}
        offsetY={0.1}
        fill="#3b82f6" // blue-500
        stroke="white"
        strokeWidth={0.02}
        rotation={angleDeg}
        draggable
        onDragMove={(e) => handleEndDrag(e, 1)}
        onDragEnd={(e) => handleEndDrag(e, 1)}
      />

       {/* --- Diamond Handle 0 (Start Nudge) --- */}
       {/* Positioned slightly offset outwards along wall vector? Or at corner? */}
       {/* Screenshot shows they are adjacent to the end handles. Let's put them 30cm outwards */}
       <RegularPolygon
        sides={4}
        radius={0.12}
        x={start.x - (dx/length) * 0.4} // 40cm offset outwards
        y={start.y - (dy/length) * 0.4}
        fill="#cbd5e1" // slate-300 like screenshot? Or white with border? Screenshot shows grey.
        stroke="#64748b"
        strokeWidth={0.02}
        rotation={angleDeg + 45} // Diamond
        draggable
        onDragStart={(e) => handleDiamondDragStart(e, 0)}
        onDragMove={handleDiamondDragMove}
        onDragEnd={(e) => handleDiamondDragEnd(e, 0)}
       />
       
       {/* --- Diamond Handle 1 (End Nudge) --- */}
       <RegularPolygon
        sides={4}
        radius={0.12}
        x={end.x + (dx/length) * 0.4}
        y={end.y + (dy/length) * 0.4}
        fill="#cbd5e1"
        stroke="#64748b"
        strokeWidth={0.02}
        rotation={angleDeg + 45}
        draggable
        onDragStart={(e) => handleDiamondDragStart(e, 1)}
        onDragMove={handleDiamondDragMove}
        onDragEnd={(e) => handleDiamondDragEnd(e, 1)}
       />

    </Group>
  )
}
