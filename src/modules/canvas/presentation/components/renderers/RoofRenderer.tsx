import React, { useMemo } from 'react'
import { Line, Group, Arrow, Text } from 'react-konva'
import { useCanvasStore } from '../../../application/store'
import { RoofGenerator } from '../../../domain/geometry/RoofGenerator'
import { RoofPanel } from '../../../application/types'

import { PolygonProcessor } from '../../../domain/geometry/PolygonProcessor'

const RoofRenderer = () => {
    const walls = useCanvasStore(state => state.walls)
    const activeStoryId = useCanvasStore(state => state.activeStoryId)
    const roofPitch = useCanvasStore(state => state.roofPitch)
    const roofOverhang = useCanvasStore(state => state.roofOverhang)
    const showRoof = useCanvasStore(state => state.showRoof)
    const showRoofSlopeArrows = useCanvasStore(state => state.showRoofSlopeArrows)
    const roofArrowOffset = useCanvasStore(state => state.roofArrowOffset)
    const roofPanels = useCanvasStore(state => state.roofPanels)
    const rooms = useCanvasStore(state => state.rooms)

    // Filter panels that should be visible on this story
    // COMBINED with "Explicit" panels from store AND "Implicit" panels from rooms (Auto-Gen)
    const visiblePanels = useMemo(() => {
        // 1. Existing Panels
        const realPanels = roofPanels.filter(p => {
            if (p.storyId) return p.storyId === activeStoryId
            if (p.roomId) {
                const r = rooms.find(room => room.id === p.roomId)
                return r?.storyId === activeStoryId
            }
            return true
        })

        // 2. Auto-Generate Virtual Panels for Rooms without Roofs
        const coveredRoomIds = new Set(realPanels.map(p => p.roomId).filter(Boolean))
        
        const candidateRooms = rooms.filter(r => {
            // Must be on this story
            if (r.storyId !== activeStoryId && (!activeStoryId && !r.storyId)) {
                    // Legacy match or strict match failure
                    if (r.storyId !== activeStoryId) return false
            }
            if (activeStoryId && r.storyId !== activeStoryId) return false

            // Must want a roof
            if (r.hasRoof === false) return false
            
            // Must not already have a panel
            if (coveredRoomIds.has(r.id)) return false
            
            return true
        })

        if (candidateRooms.length === 0) return realPanels

        // Create Virtual Panels for each room (No Merging - Let CSG handle it)
        const virtualPanels = candidateRooms.map(r => {
             const poly = r.polygon
             // Generate a stable-ish ID based on centroid
             const centroid = PolygonProcessor.calculateCentroid(poly)
             const idSuffix = `${Math.round(centroid.x * 100)}_${Math.round(centroid.y * 100)}`
             
             return {
                    id: `virtual_roof_${r.id}_${idSuffix}`,
                    roomId: r.id,
                    storyId: activeStoryId,
                    wallId: 'virtual',
                    footprint: poly,
                    type: 'pitched',
                    selected: false,
                    area: 0,
                    trussType: 'timber',
                    trussSpacing: 600,
                    sheeting: 'IBR',
                    insulation: false,
                    ceiling: 'plasterboard'
                } as RoofPanel
            })

        return [...realPanels, ...virtualPanels]
    }, [roofPanels, rooms, activeStoryId])

    const geometry = useMemo(() => {
        if (!showRoof) return null
        
        // Use the new independent generation logic
        return RoofGenerator.generateFromRoofPanels(visiblePanels, rooms, walls, roofPitch, roofOverhang, roofArrowOffset)

    }, [visiblePanels, walls, rooms, roofPitch, roofOverhang, showRoof, roofArrowOffset])

    if (!showRoof) return null

    return (
        <Group>
            {/* 1. Render Roof Baselines (Green) */}
            {/* 1. Render Roof Baselines (Green) - DISABLED (User feedback: Confusing vs new geometry) */}
            {/* 
            {visiblePanels.map(panel => {
                let footprint = panel.footprint
                if (!footprint && panel.roomId) {
                    const r = rooms.find(room => room.id === panel.roomId)
                    if (r) footprint = r.polygon // Should ideally be cleaned/normalized but okay for render
                }
                
                if (!footprint || footprint.length < 2) return null

                const points = footprint.flatMap(p => [p.x, p.y])
                
                return (
                    <Line
                        key={`baseline-${panel.id}`}
                        points={points}
                        stroke={panel.selected ? "#00AAFF" : "#00FF00"} // Highlight on select
                        strokeWidth={panel.selected ? 0.05 : 0.02}
                        closed={true}
                        opacity={0.8}
                        // Enable selection
                        onClick={(e) => {
                            if (useCanvasStore.getState().currentTool !== 'select') return
                            e.cancelBubble = true
                            
                            // If virtual, materialize it? Or select it as 'virtual' and let store handle it?
                            // Store expects an ID. If we pass 'virtual-room-123', selectRoofPanel(id) needs to find it.
                            // But selectRoofPanel searches state.roofPanels.
                            
                            // Better approach: Since we are in an event handler, we can materialize it now.
                            if (panel.id.startsWith('virtual-')) {
                                // Create the real panel
                                useCanvasStore.getState().createRoofPanel(
                                    panel.roomId || null, 
                                    panel.storyId || useCanvasStore.getState().activeStoryId || '0', // Fallback to '0' or active
                                    panel.type,
                                    panel.footprint // IMPORTANT: Pass the merged footprint
                                )
                                
                                // Since ID is unknown, we can't select it immediately easily without searching.
                                // We can search for the panel we just created by footprint matching?
                                // Or mainly, we just needed to create it. next render it will be real.
                                
                            } else {
                                useCanvasStore.getState().selectRoofPanel(panel.id)
                            }
                        }}
                        onMouseEnter={(e) => {
                            const container = e.target.getStage()?.container()
                            if (container) container.style.cursor = 'pointer'
                        }}
                        onMouseLeave={(e) => {
                            const container = e.target.getStage()?.container()
                            if (container) container.style.cursor = 'default'
                        }}
                    />
                )
            })}
            */}

            {/* 2. Render Generated Geometry */}
            {geometry && (
                <>
                    {/* Eaves - Light Grey Dashed */}
                    {geometry.eaves.map((edge: { start: { x: number; y: number }; end: { x: number; y: number } }, i: number) => (
                        <Line
                            key={`eave-${i}`}
                            points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
                            stroke="#9E9E9E"
                            strokeWidth={0.01}
                            dash={[0.3, 0.1]}
                            closingPath={true}
                        />
                    ))}

                    {/* Ridges - Red/Grey */}
                    {geometry.ridges.map((edge: { start: { x: number; y: number }; end: { x: number; y: number } }, i: number) => (
                        <Line
                            key={`ridge-${i}`}
                            points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
                            stroke="#555"
                            strokeWidth={0.02}
                            lineCap="round"
                        />
                    ))}

                    {/* Hips - Same style as Ridges */}
                    {geometry.hips.map((edge: { start: { x: number; y: number }; end: { x: number; y: number } }, i: number) => (
                        <Line
                            key={`hip-${i}`}
                            points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
                            stroke="#555" // Same color as ridge
                            strokeWidth={0.02} 
                            lineCap="round"
                        />
                    ))}

                    {/* Valleys - Blue/Different Color? Standard is usually same, maybe slightly different */}
                    {geometry.valleys.map((edge: { start: { x: number; y: number }; end: { x: number; y: number } }, i: number) => (
                        <Line
                            key={`valley-${i}`}
                            points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
                            stroke="#337AB7" // Blueish for Valley
                            strokeWidth={0.02}
                            lineCap="round"
                        />
                    ))}

                    {/* Hips */}
                    {geometry.hips.map((edge: { start: { x: number; y: number }; end: { x: number; y: number } }, i: number) => (
                        <Line
                            key={`hip-${i}`}
                            points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
                            stroke="#555"
                            strokeWidth={0.02}
                        />
                    ))}
                    
                    {/* Valleys */}
                    {geometry.valleys?.map((edge: { start: { x: number; y: number }; end: { x: number; y: number } }, i: number) => (
                        <Line
                            key={`valley-${i}`}
                            points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
                            stroke="#0000FF"
                            strokeWidth={0.02}
                        />
                    ))}

                    {/* Slope Arrows */}
                    {showRoofSlopeArrows && geometry.slopeArrows?.map((arrow: any, i: number) => {
                        // Scale arrow for visibility 
                        const len = 1.0 
                        const halfLen = len / 2
                        
                        const startX = arrow.vector.x * halfLen
                        const startY = arrow.vector.y * halfLen
                        const endX = -arrow.vector.x * halfLen
                        const endY = -arrow.vector.y * halfLen

                        const dx = endX - startX
                        const dy = endY - startY
                        let angle = Math.atan2(dy, dx) * (180 / Math.PI)
                        
                        if (angle > 90 || angle < -90) {
                            angle += 180
                        }

                        return (
                            <Group key={`arrow-${i}`} x={arrow.position.x} y={arrow.position.y}>
                                <Arrow 
                                    points={[startX, startY, endX, endY]}
                                    pointerLength={0.15} 
                                    pointerWidth={0.15}
                                    fill="#F44336"
                                    stroke="#F44336"
                                    strokeWidth={0.03}
                                />
                                <Text 
                                    x={0}
                                    y={0}
                                    text={arrow.text}
                                    fontSize={0.25}
                                    fontStyle="normal"
                                    fill="#F44336"
                                    align="center"
                                    verticalAlign="middle"
                                    rotation={angle}
                                    offsetX={arrow.text.length * 0.25 * 0.3} 
                                    offsetY={0.4} 
                                />
                            </Group>
                        )
                    })}
                </>
            )}
        </Group>
    )
}

export default RoofRenderer
