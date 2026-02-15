import React from 'react'
import { Circle, Group } from 'react-konva'
import { useCanvasStore } from '../../../application/store'
import { useCanvasCoordinates } from '../../hooks/useCanvasCoordinates'
import { Point } from '../../../application/types'
import { PolygonProcessor } from '../../../domain/geometry/PolygonProcessor'

export const RoofFootprintEditor = () => {
    const editingRoofId = useCanvasStore(state => state.editingRoofId)
    const roofPanels = useCanvasStore(state => state.roofPanels)
    const rooms = useCanvasStore(state => state.rooms)
    const updateRoofPanel = useCanvasStore(state => state.updateRoofPanel)
    const { snapPoint, screenToWorld } = useCanvasCoordinates()

    if (!editingRoofId) return null

    const panel = roofPanels.find(p => p.id === editingRoofId)
    if (!panel) return null

    // Determine current points
    let points: Point[] = panel.footprint || []
    if (points.length === 0 && panel.roomId) {
        const room = rooms.find(r => r.id === panel.roomId)
        if (room) {
             // Initialise from room if strictly empty
             // Use cleaned/normalized polygon to ensure stability
             points = PolygonProcessor.cleanPolygon(room.polygon, 0.01)
        }
    }

    if (points.length < 3) return null

    const handleDragMove = (index: number, e: import('konva/lib/Node').KonvaEventObject<DragEvent>) => {
        const stage = e.target.getStage()
        const pointer = stage.getPointerPosition()
        if (!pointer) return

        // Snap the pointer
        const worldPos = screenToWorld(pointer)
        const snapped = snapPoint(worldPos)

        // Create new points array
        const newPoints = [...points]
        newPoints[index] = snapped

        // Update store (triggers re-render of RoofRenderer)
        updateRoofPanel(panel.id, { footprint: newPoints })
    }

    return (
        <Group>
            {points.map((p, i) => (
                <Circle
                    key={`handle-${i}`}
                    x={p.x}
                    y={p.y}
                    radius={0.2} // 20cm visible handle (in world units? need to check scale)
                    // If scale is small (meters), 0.2 is 20cm. If mm, 200.
                    // Canvas seems to be in Meters based on wall thickness 0.22 default.
                    fill="#00FF00"
                    stroke="white"
                    strokeWidth={0.05}
                    draggable
                    onDragMove={(e) => handleDragMove(i, e)}
                    // Prevent propagation to avoid panning/selection
                    onClick={(e) => e.cancelBubble = true}
                    onMouseDown={(e) => e.cancelBubble = true}
                />
            ))}
        </Group>
    )
}
