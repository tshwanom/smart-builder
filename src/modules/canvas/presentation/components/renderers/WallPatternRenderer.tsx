import React from 'react'
import { Group, Path, Rect } from 'react-konva'
import { WallTemplate } from '../../../application/types'

interface WallPatternRendererProps {
  width: number
  height: number // Wall length in pixels
  template: WallTemplate
  scale?: number
}

export const WallPatternRenderer: React.FC<WallPatternRendererProps> = ({
  width,
  height,
  template,
  scale = 1
}) => {
  const pattern = template.hatchPattern
  const color = template.fillColor
  // Convert hex color to rgba for fills if needed, keeping it simple for now
  
  if (pattern === 'SOLID') {
    return <Rect width={width} height={height} fill={color} />
  }

  // Create pattern canvas or paths based on pattern type
  // For Konva, using `fillPatternImage` is most performant, but drawing paths is easier for custom shapes without loading images.
  // Given we are simulating simple CAD hatches:
  
  // Adjusted for visibility: 150mm spacing relative to 220mm wall is clearer
  const patternSize = 150 * scale
  
  const renderPattern = () => {
    const paths = []
    
    if (pattern === 'DIAGONAL') {
      // Draw diagonal lines at 45 degrees
      const steps = Math.ceil((width + height) / patternSize)
      for (let i = -steps; i < steps; i++) {
        paths.push(
          <Path
            key={i}
            data={`M${i * patternSize} 0 L${i * patternSize + height} ${height}`}
            stroke="rgba(0,0,0,0.5)" // Darker for visibility
            strokeWidth={1}
            strokeScaleEnabled={false} // Constant screen width
            listening={false}
          />
        )
      }
    }
    
    if (pattern === 'CROSSHATCH') {
      // Diagonals + Inverse Diagonals
       const steps = Math.ceil((width + height) / patternSize)
       // Forward slash
       for (let i = -steps; i < steps; i++) {
         paths.push(
           <Path
             key={`f${i}`}
             data={`M${i * patternSize} 0 L${i * patternSize + height} ${height}`}
             stroke="rgba(0,0,0,0.5)"
             strokeWidth={1}
             strokeScaleEnabled={false}
              listening={false}
           />
         )
       }
       // Back slash
       for (let i = -steps; i < steps; i++) {
         paths.push(
            <Path
              key={`b${i}`}
              data={`M${i * patternSize + height} 0 L${i * patternSize} ${height}`}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={1}
              strokeScaleEnabled={false}
               listening={false}
            />
          )
       }
    }
    
    if (pattern === 'CONCRETE') {
        // Random triangles / dots simulation
        // Randomization inside render is bad (re-renders flicker).
        // Use pseudo-random based on index if possible, or just a repeating stipple pattern.
        return <Rect width={width} height={height} fill={color} opacity={0.8} /> // Fallback for now, stippling is hard in SVG paths efficiently
    }

    return paths
  }

  return (
    <Group>
      <Rect width={width} height={height} fill={color} />
      <Group clipFunc={(ctx) => ctx.rect(0, 0, width, height)}>
         {renderPattern()}
      </Group>
    </Group>
  )
}
