import React from 'react'
import { Group } from 'react-konva'
import { useCanvasStore } from '../../../../application/store'
import { ElectricalRenderer } from './ElectricalRenderer'
import { PlumbingRenderer } from './PlumbingRenderer'
import { PlumbingPoint } from '../../../../application/types'

interface MEPRendererProps {
    ghostPoint?: PlumbingPoint
}

export const MEPRendererComponent: React.FC<MEPRendererProps> = ({ ghostPoint }) => {
  const { 
    stories,
    activeStoryId,
    electricalPoints,
    plumbingPoints,
    rooms
  } = useCanvasStore()

  const activeStory = stories.find(s => s.id === activeStoryId)

  // Filter Points for Active Story
  const filterByStory = (item: { storyId?: string }) => {
      if (!activeStory) return true // Show all if no story system active
      return item.storyId === activeStoryId || (!item.storyId && activeStory.level === 0)
  }

  const activeElectricalPoints = electricalPoints.filter(filterByStory)
  const activePlumbingPoints = plumbingPoints.filter(filterByStory)
  const activeRooms = rooms.filter(filterByStory)

  return (
    <Group>
      {/* Existing Electrical Points */}
      <ElectricalRenderer 
        activeElectricalPoints={activeElectricalPoints} 
        rooms={activeRooms} 
      />
      
      {/* Existing Plumbing Points */}
      <PlumbingRenderer 
        activePlumbingPoints={activePlumbingPoints} 
      />

      {/* Ghost Overlay */}
      {ghostPoint && (
          <Group listening={false} opacity={0.6}>
              <PlumbingRenderer activePlumbingPoints={[ghostPoint]} />
          </Group>
      )}
    </Group>
  )
}
