import React, { useMemo } from 'react'
import { Group, Circle, Line, Text } from 'react-konva'
import { ElectricalPoint, Room } from '../../../../application/types'
import { calculateElectricalRouting, WirePath } from '@/core/engine/mep-routing'

interface ElectricalRendererProps {
  activeElectricalPoints: ElectricalPoint[]
  rooms: Room[]
}

export const ElectricalRenderer: React.FC<ElectricalRendererProps> = ({ 
  activeElectricalPoints, 
  rooms 
}) => {
  const dbPoint = activeElectricalPoints.find(p => p.type === 'db_board')

  // Calculate Routes Memoized
  const electricalRoutes = useMemo(() => {
      // Logic requires DB to route from. If no DB active, routing internal to circuits or skipped.
      return calculateElectricalRouting(activeElectricalPoints, dbPoint, rooms)
  }, [activeElectricalPoints, dbPoint, rooms])

  return (
    <Group>
      {/* ─── ELECTRICAL ROUTING (Intelligent) ─── */}
      {electricalRoutes.map((route: WirePath, i: number) => (
          <Line
            key={`elec-route-${i}`}
            points={[route.from.x, route.from.y, route.to.x, route.to.y]}
            stroke={route.circuitType === 'light' ? '#eab308' : route.circuitType === 'socket' ? '#2563eb' : '#dc2626'} // Yellow/Blue/Red
            strokeWidth={0.02}
            dash={[0.05, 0.05]}
            opacity={0.6}
            listening={false}
          />
      ))}

      {/* ─── ELECTRICAL POINTS ─── */}
      {activeElectricalPoints.map(point => (
        <Group 
            key={point.id} 
            x={point.position.x} 
            y={point.position.y}
            draggable
            // Add drag handler logic here if needed (passed from parent or store)
        >
           {/* Visual Representation */}
           {point.type === 'db_board' ? (
               <Group>
                   <Circle radius={0.15} fill="#dc2626" stroke="white" strokeWidth={0.02} />
                   <Text 
                        text="DB" 
                        fontSize={0.1} 
                        fill="white" 
                        x={-0.07} 
                        y={-0.035} 
                        fontStyle="bold"
                   />
               </Group>
           ) : point.type === 'socket' ? (
               <Group>
                    <Circle radius={0.08} fill="white" stroke="#2563eb" strokeWidth={0.02} />
                    <Line points={[-0.04, 0, 0, -0.04, 0.04, 0]} stroke="#2563eb" strokeWidth={0.015} />
               </Group>
           ) : point.type === 'light' ? (
                <Group>
                    <Line points={[-0.08, -0.08, 0.08, 0.08]} stroke="#eab308" strokeWidth={0.02} />
                    <Line points={[0.08, -0.08, -0.08, 0.08]} stroke="#eab308" strokeWidth={0.02} />
                    <Circle radius={0.05} fill="#eab308" />
                </Group>
           ) : (
                <Circle radius={0.05} fill="gray" />
           )}
        </Group>
      ))}
    </Group>
  )
}
