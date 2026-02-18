import { useState, useCallback, useRef } from 'react'
import { CoordinateSystem, ViewSettings, Point2D } from '../logic/CoordinateSystem'
import { useGeometryStore } from '../../../../application/store/geometryStore'
import { SelectionLogic } from '../logic/SelectionLogic'

export type ToolType = 
    | 'select' 
    | 'wall' | 'window' | 'door' | 'roof' | 'room' | 'staircase'
    | 'electrical_socket' | 'electrical_switch' | 'electrical_light' | 'electrical_db'
    | 'plumbing_source' | 'plumbing_sink' | 'plumbing_toilet' | 'plumbing_shower' | 'plumbing_bath'
    | 'hvac_unit' | 'hvac_duct'
    | 'structural_column' | 'structural_beam' | 'structural_slab'

export function useCanvasInteraction(viewSettings: ViewSettings) {
    const [activeTool, setActiveTool] = useState<ToolType>('select')
    const [tempWallStart, setTempWallStart] = useState<Point2D | null>(null)
    const [mouseWorldPos, setMouseWorldPos] = useState<Point2D | null>(null)
    const [snappedPos, setSnappedPos] = useState<{ point: Point2D, wallId: string } | null>(null)
    
    const { addWall, project, select, clearSelection, addOpening } = useGeometryStore()

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Ignore if panning (middle click or space)
        if (e.button === 1 || e.nativeEvent.getModifierState('Space')) return

        const worldPos = CoordinateSystem.screenToWorld(
            { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
            viewSettings
        )

        if (activeTool === 'wall') {
            if (!tempWallStart) {
                // Start drawing
                setTempWallStart(worldPos)
            } else {
                // Finish drawing segment
                const newWall = {
                    id: crypto.randomUUID(),
                    start: { x: tempWallStart.x, y: tempWallStart.y, z: 0 },
                    end: { x: worldPos.x, y: worldPos.y, z: 0 },
                    thickness: 0.23,
                    height: 2.7, // Default height
                    storyId: 'story-1' // Default story
                }
                addWall(newWall)
                setTempWallStart(worldPos) 
            }
        } else if (activeTool === 'select') {
            const hitOpeningId = SelectionLogic.hitTestOpenings(worldPos, project.openings)
            if (hitOpeningId) {
                select(hitOpeningId, e.shiftKey)
                return
            }

            const hitId = SelectionLogic.hitTestWalls(worldPos, project.walls)
            if (hitId) {
                select(hitId, e.shiftKey) // Multi-select with shift
            } else {
                clearSelection()
            }
        } else if (activeTool === 'window' || activeTool === 'door') {
            if (snappedPos) {
                 const newOpening = {
                    id: crypto.randomUUID(),
                    wallId: snappedPos.wallId,
                    width: activeTool === 'window' ? 1.2 : 0.9,
                    height: activeTool === 'window' ? 1.2 : 2.1,
                    sillHeight: activeTool === 'window' ? 0.9 : 0,
                    center: { x: snappedPos.point.x, y: snappedPos.point.y, z: 0 }, // Z is relative to wall base usually, but here global? 
                    // Actually types.ts says center: Point3D. Let's assume global X,Y and Z=sillHeight for now or similar.
                    // For plan view X,Y matters.
                    type: activeTool
                }
                addOpening(newOpening)
            }
        }
    }, [activeTool, viewSettings, tempWallStart, addWall, project.walls, project.openings, select, clearSelection, snappedPos, addOpening])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const worldPos = CoordinateSystem.screenToWorld(
            { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
            viewSettings
        )
        setMouseWorldPos(worldPos)

        if (activeTool === 'window' || activeTool === 'door') {
            const nearest = SelectionLogic.getNearestWall(worldPos, project.walls)
            if (nearest) {
                setSnappedPos({ point: nearest.point, wallId: nearest.wall.id })
            } else {
                setSnappedPos(null)
            }
        } else {
            setSnappedPos(null)
        }
    }, [viewSettings, activeTool, project.walls])

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setTempWallStart(null)
            setActiveTool('select')
            clearSelection()
            setSnappedPos(null)
        }
    }, [clearSelection])

    return {
        activeTool,
        setActiveTool,
        handleMouseDown,
        handleMouseMove,
        handleKeyDown,
        tempWallStart,
        mouseWorldPos,
        snappedPos
    }
}
