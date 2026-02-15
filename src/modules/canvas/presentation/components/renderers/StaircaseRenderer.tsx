import React from 'react'
import { Group, Rect, Text, Arrow } from 'react-konva'
import { useCanvasStore } from '@/modules/canvas/application/store'
import { Staircase } from '@/modules/canvas/application/types'

interface StaircaseRendererProps {
  staircases?: Staircase[] // Optional passed prop or from store
}

export const StaircaseRenderer: React.FC<StaircaseRendererProps> = ({ staircases: propStaircases }) => {
  const { staircases, activeStoryId } = useCanvasStore()
  
  const relevantStaircases = propStaircases || staircases.filter(s => s.storyId === activeStoryId)

  return (
    <Group>
      {relevantStaircases.map(stair => (
        <StaircaseShape key={stair.id} staircase={stair} />
      ))}
    </Group>
  )
}

const StaircaseShape: React.FC<{ staircase: Staircase }> = ({ staircase }) => {
  const { width, position, rotation, treadDepth, totalRise, riserHeight = 175, type } = staircase
  
  // Calculate Geometry
  const numberOfRisers = Math.round(totalRise / riserHeight)
  const numberOfTreads = numberOfRisers - 1
  const runLength = numberOfTreads * treadDepth
  
  // Basic Rect for Plan View (Straight Flight)
  // TODO: Handle L/U/Spiral logic
  
  const drawStraightFlight = () => {
      const treads = []
      for (let i = 0; i < numberOfTreads; i++) {
          treads.push(
               <Rect
                 key={i}
                 x={0}
                 y={i * treadDepth}
                 width={width}
                 height={treadDepth}
                 stroke="#333"
                 strokeWidth={1}
                 fill="transparent"
               />
          )
      }
      
      // Cut line / Break line
      // Direction Arrow
      const arrowPoints = [
          width / 2, treadDepth, 
          width / 2, runLength - treadDepth
      ]

      return (
          <Group>
               {treads}
               <Arrow
                 points={arrowPoints}
                 stroke="#333"
                 fill="#333"
                 pointerLength={10}
                 pointerWidth={10}
               />
               <Text
                 text="UP"
                 x={width / 2 + 10}
                 y={runLength / 2}
                 fontSize={12}
                 fontStyle="bold"
               />
          </Group>
      )
  }

  return (
    <Group
      x={position.x}
      y={position.y}
      rotation={rotation}
      draggable
      // Add selection events here
    >
        {type === 'straight' && drawStraightFlight()}
        {/* Placeholders for others */}
        {type !== 'straight' && (
             <Rect width={width} height={width} stroke="red" dash={[5,5]} />
        )}
    </Group>
  )
}
