import { useState, useCallback, useRef } from 'react'
import { KonvaEventObject } from 'konva/lib/Node'
import { useCanvasStore } from '../../application/store'
import { Point, Wall, Opening, RoofPanel, PlumbingPoint, ElectricalPoint } from '../../application/types'

export const useBoxSelection = (
    screenToWorld: (point: Point) => Point
) => {
    const { currentTool, walls, openings } = useCanvasStore()
    const [isBoxSelecting, setIsBoxSelecting] = useState(false)
    const [selectionStart, setSelectionStart] = useState<Point | null>(null)
    const [selectionEnd, setSelectionEnd] = useState<Point | null>(null)
    
    // We use a ref to track if we've moved enough to consider it a drag
    const moveThresholdPassed = useRef(false)

    const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
        // console.log('useBoxSelection: handleMouseDown', { currentTool, button: e.evt.button })
        if (currentTool !== 'select') return
        // Right click or middle click ignored
        if (e.evt.button !== 0) return
        
        // Ensure we clicked on stage
        const stage = e.target.getStage()
        // console.log('useBoxSelection: target', e.target.name())
        if (e.target !== stage && e.target.name() !== 'grid-background') return

        const pos = stage?.getPointerPosition()
        if (pos) {
            const worldPos = screenToWorld(pos)
            // console.log('useBoxSelection: started', worldPos)
            setSelectionStart(worldPos)
            setSelectionEnd(worldPos)
            setIsBoxSelecting(true)
            moveThresholdPassed.current = false
        }
    }, [currentTool, screenToWorld])

    const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
        if (!isBoxSelecting || !selectionStart) return

        const stage = e.target.getStage()
        const pos = stage?.getPointerPosition()
        if (pos) {
            const worldPos = screenToWorld(pos)
            setSelectionEnd(worldPos)
            
            // Check threshold
            if (!moveThresholdPassed.current) {
                const dx = worldPos.x - selectionStart.x
                const dy = worldPos.y - selectionStart.y
                if (dx * dx + dy * dy > 0.01) { // 10cm threshold in world units? or pixels?
                     // 0.01 is 10cm if units are meters. Maybe too small.
                     // Let's assume just movement logic.
                     moveThresholdPassed.current = true
                }
            }
        }
    }, [isBoxSelecting, selectionStart, screenToWorld])

    const handleMouseUp = useCallback(() => {
        if (!isBoxSelecting || !selectionStart || !selectionEnd) {
             setIsBoxSelecting(false)
             return
        }

        if (moveThresholdPassed.current) {
            // Perform Selection
            const x1 = Math.min(selectionStart.x, selectionEnd.x)
            const x2 = Math.max(selectionStart.x, selectionEnd.x)
            const y1 = Math.min(selectionStart.y, selectionEnd.y)
            const y2 = Math.max(selectionStart.y, selectionEnd.y)

            const selectedItems: Array<{ type: 'wall' | 'room' | 'roof' | 'opening' | 'plumbingPoint' | 'electricalPoint', data: Wall | Opening | RoofPanel | PlumbingPoint | ElectricalPoint }> = []

            // 1. Walls - Check if any point is inside OR if line intersects box (simplified to points for now)
            walls.forEach(w => {
                 // Check if start or end point is inside
                 const p1Inside = w.points[0].x >= x1 && w.points[0].x <= x2 && w.points[0].y >= y1 && w.points[0].y <= y2
                 const p2Inside = w.points[1].x >= x1 && w.points[1].x <= x2 && w.points[1].y >= y1 && w.points[1].y <= y2
                 
                 // Also check if wall passes THROUGH the box (even if endpoints outside)
                 // Simple AABB overlap check for wall segment
                 const wx1 = Math.min(w.points[0].x, w.points[1].x)
                 const wx2 = Math.max(w.points[0].x, w.points[1].x)
                 const wy1 = Math.min(w.points[0].y, w.points[1].y)
                 const wy2 = Math.max(w.points[0].y, w.points[1].y)

                 // Simple AABB overlap
                 const wallAABBOverlap = wx1 <= x2 && wx2 >= x1 && wy1 <= y2 && wy2 >= y1
                 
                 // console.log(`Wall ${w.id}:`, { p1Inside, p2Inside, wallAABBOverlap, wx1, wx2, wy1, wy2 })
                 
                 // Precise intersection check could be added, but AABB overlap + point check is often "good enough" for box select 
                 // strictly speaking, we usually want "contained in" or "intersects". 
                 // Let's go with: if visible part intersects box.
                 
                 if (p1Inside || p2Inside || wallAABBOverlap) {
                     selectedItems.push({ type: 'wall', data: w })
                 }
            })

            // 2. Openings (Windows/Doors)
            const { openings, plumbingPoints, electricalPoints } = useCanvasStore.getState()
            openings.forEach(o => {
                // We need opening position. It's stored as 'position' (0-1) on a wall.
                const wall = walls.find(w => w.id === o.wallId)
                if (wall) {
                    const p1 = wall.points[0]
                    const p2 = wall.points[1]
                    const ox = p1.x + (p2.x - p1.x) * o.position
                    const oy = p1.y + (p2.y - p1.y) * o.position
                    
                    if (ox >= x1 && ox <= x2 && oy >= y1 && oy <= y2) {
                        selectedItems.push({ type: 'opening', data: o })
                    }
                }
            })

            // 3. Plumbing Points
            plumbingPoints.forEach(p => {
                if (p.position.x >= x1 && p.position.x <= x2 && p.position.y >= y1 && p.position.y <= y2) {
                    selectedItems.push({ type: 'plumbingPoint', data: p })
                }
            })

            // 4. Electrical Points
            electricalPoints.forEach(p => {
                if (p.position.x >= x1 && p.position.x <= x2 && p.position.y >= y1 && p.position.y <= y2) {
                    selectedItems.push({ type: 'electricalPoint', data: p })
                }
            })

            // Update Selection
            if (selectedItems.length > 0) {
                // We need to cast here because setSelection expects strict types that we matched
                useCanvasStore.getState().setSelection(selectedItems as any)
            } else {
                useCanvasStore.getState().clearSelection()
            }
        }

        setIsBoxSelecting(false)
        setSelectionStart(null)
        setSelectionEnd(null)
    }, [isBoxSelecting, selectionStart, selectionEnd, walls, openings])

    return {
        isBoxSelecting,
        selectionStart,
        selectionEnd,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp
    }
}
