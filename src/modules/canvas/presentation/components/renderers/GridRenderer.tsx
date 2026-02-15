import React from 'react'
import { Line } from 'react-konva'
import { useCanvasStore } from '../../../application/store'

interface GridRendererProps {
  width: number
  height: number
}

export const GridRenderer: React.FC<GridRendererProps> = ({ width, height }) => {
  const { viewport, gridSettings } = useCanvasStore()

  if (!gridSettings.showGrid) return null
  
  const gridLines: React.ReactElement[] = []
  const gridSize = gridSettings.gridSize // Already in world units (meters)
  
  // Calculate visible world bounds
  const worldLeft = -viewport.offset.x / viewport.scale
  const worldTop = -viewport.offset.y / viewport.scale
  const worldRight = worldLeft + width / viewport.scale
  const worldBottom = worldTop + height / viewport.scale
  
  // Snap to grid boundary
  const startX = Math.floor(worldLeft / gridSize) * gridSize
  const startY = Math.floor(worldTop / gridSize) * gridSize
  
  // Vertical lines
  for (let x = startX; x <= worldRight; x += gridSize) {
    gridLines.push(
      <Line
        key={`v-${x}`}
        points={[x, worldTop, x, worldBottom]}
        stroke="#e2e8f0"
        strokeWidth={0.005} // Consistent with original (was 0.005)
        listening={false}
      />
    )
  }
  
  // Horizontal lines
  for (let y = startY; y <= worldBottom; y += gridSize) {
    gridLines.push(
      <Line
        key={`h-${y}`}
        points={[worldLeft, y, worldRight, y]}
        stroke="#e2e8f0"
        strokeWidth={0.005}
        listening={false}
      />
    )
  }
  
  return <>{gridLines}</>
}
