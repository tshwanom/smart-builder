import React from 'react'
import { Line, Group } from 'react-konva'
import { Room } from '../../../application/types'


interface RoomRendererProps {
  rooms: Room[]
  onRoomClick?: (roomId: string) => void
  selectedRoomId?: string
  currentTool?: string
}

export const RoomRenderer: React.FC<RoomRendererProps> = ({ 
  rooms, 
  onRoomClick, 
  selectedRoomId,
  currentTool
}) => {
  // Helper to check if point is inside polygon (Ray casting)
  // ... (unused for now as Konva handles hit detection via fill)
  const roomsClickable = currentTool !== 'window' && currentTool !== 'door'



  return (
    <>
      {rooms.map(room => {
        // Use ordered polygon points from detection logic
        const polygonPoints = room.polygon?.flatMap(p => [p.x, p.y]) || []
        const isSelected = room.id === selectedRoomId
        
        if (polygonPoints.length < 6) return null // Need at least 3 points
        
        return (
          <Group key={room.id}>
            {/* Room fill - clickable only when not placing openings */}
            <Line
              points={polygonPoints}
              fill={isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.08)'}
              closed
              onClick={roomsClickable ? () => onRoomClick?.(room.id) : undefined}
              onTap={roomsClickable ? () => onRoomClick?.(room.id) : undefined}
              listening={roomsClickable}
              hitStrokeWidth={0}
            />
            
            {/* Room border - highlight when selected */}
            {isSelected && (
              <Line
                points={polygonPoints}
                stroke="#3b82f6"
                strokeWidth={0.03}
                dash={[0.1, 0.05]}
                closed
                listening={false}
              />
            )}
            
            {/* Room label */}
            {room.name && (
              <Group>
                {/* Calculate center point for label */}
                {(() => {
                  const centerX = polygonPoints.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) / (polygonPoints.length / 2)
                  const centerY = polygonPoints.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0) / (polygonPoints.length / 2)
                  
                  return (
                    <Line
                      points={[centerX - 0.3, centerY - 0.1, centerX + 0.3, centerY + 0.1]}
                      fill="white"
                      opacity={0.9}
                      closed
                      listening={false}
                    />
                  )
                })()}
              </Group>
            )}
          </Group>
        )
      })}
    </>
  )
}
