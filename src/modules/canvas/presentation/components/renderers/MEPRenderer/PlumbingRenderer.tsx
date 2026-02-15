import React from 'react'
import { Group, Circle, Line, Text, Rect } from 'react-konva' // Added Text, Rect
import { PlumbingPoint } from '../../../../application/types'
import { useCanvasStore } from '../../../../application/store'
import { PLUMBING_VARIANTS } from './PlumbingShapes' // Removed FixtureVariant

interface PlumbingRendererProps {
  activePlumbingPoints: PlumbingPoint[]
}

export const PlumbingRenderer: React.FC<PlumbingRendererProps> = ({ activePlumbingPoints }) => {
  const sourcePoint = activePlumbingPoints.find(p => p.type === 'source')
  const { selectElement, selectedElement, updatePlumbingPoint } = useCanvasStore()

  return (
    <Group>
      {/* ─── PLUMBING ROUTING ─── */}
      {sourcePoint && activePlumbingPoints.filter(p => p.id !== sourcePoint.id).map(point => (
         // simple direct line for now - to be improved with proper pathfinding
         <Line 
            key={`pipe-${point.id}`}
            points={[sourcePoint.position.x, sourcePoint.position.y, point.position.x, point.position.y]}
            stroke="#3b82f6"
            strokeWidth={0.02}
            dash={[0.1, 0.1]}
            opacity={0.5}
         />
      ))}

      {/* ─── PLUMBING POINTS ─── */}
      {activePlumbingPoints.map(point => {
          const isSelected = selectedElement?.type === 'plumbingPoint' && selectedElement.data.id === point.id
          
          return (
            <Group 
                key={point.id} 
                x={point.position.x} 
                y={point.position.y} 
                draggable
                rotation={point.rotation || 0}
                onClick={(e) => {
                    e.cancelBubble = true
                    selectElement({ type: 'plumbingPoint', data: point })
                }}
                onTap={(e) => {
                    e.cancelBubble = true
                    selectElement({ type: 'plumbingPoint', data: point })
                }}
                onDragStart={(e) => {
                    e.cancelBubble = true
                    selectElement({ type: 'plumbingPoint', data: point })
                }}
                onDragEnd={(e) => {
                    const stage = e.target.getStage()
                    if(stage) {
                         updatePlumbingPoint(point.id, { 
                             position: { x: e.target.x(), y: e.target.y() } 
                         })
                    }
                }}
            >
                {/* Selection Highlight */}
                {isSelected && (
                    <Circle 
                        radius={0.8} 
                        stroke="#3b82f6" 
                        strokeWidth={0.05}
                        dash={[0.1, 0.1]} 
                    />
                )}
                {renderPlumbingFixture(point)}
            </Group>
          )
      })}
    </Group>
  )
}

const renderPlumbingFixture = (point: PlumbingPoint) => {
    // 1. Check if type exists in registry
    const variants = PLUMBING_VARIANTS[point.type]
    
    if (variants) {
        // 2. Find specific variant or default to first
        const variant = variants.find(v => v.id === point.subtype) || variants[0]
        
        // 3. Determine dimensions (User override > Variant Default > Fallback)
        const width = point.width ?? variant.defaultWidth
        const length = point.length ?? variant.defaultLength
        
        // 4. Calculate Scale
        // Canvas units are meters (usually). SVGs are in mm.
        // Scale = 0.001 to convert mm to m.
        const scale = 0.001
        
        return (
            <Group scaleX={scale} scaleY={scale}>
                {variant.render(width, length)}
            </Group>
        )
    }

    // Fallback for types not in registry (source, washing_machine, etc)
    if (point.type === 'source') {
        return <Circle radius={0.15} fill="#0891b2" stroke="white" strokeWidth={0.02} />
    }

    if (point.type === 'washing_machine') {
         // Simple placeholder for WM
         return (
             <Group scaleX={0.001} scaleY={0.001}>
                 <Rect x={-300} y={-300} width={600} height={600} fill="white" stroke="#0e7490" strokeWidth={10} />
                 <Circle x={0} y={0} radius={200} stroke="#0e7490" strokeWidth={5} />
                 <Text text="WM" fontSize={200} x={-120} y={-70} fill="#0e7490" />
             </Group>
         )
    }

    return <Circle radius={0.10} fill="white" stroke="#0891b2" strokeWidth={0.03} />
}
