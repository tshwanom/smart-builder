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
    const roofPanels = useCanvasStore(state => state.roofPanels)
    const rooms = useCanvasStore(state => state.rooms)

    // Filter panels visible on this story + auto-generate for uncovered rooms
    const visiblePanels = useMemo(() => {
        const realPanels = roofPanels.filter(p => {
            if (p.storyId) return p.storyId === activeStoryId
            if (p.roomId) {
                const r = rooms.find(room => room.id === p.roomId)
                return r?.storyId === activeStoryId
            }
            return true
        })

        const coveredRoomIds = new Set(realPanels.map(p => p.roomId).filter(Boolean))
        
        const candidateRooms = rooms.filter(r => {
            if (activeStoryId && r.storyId !== activeStoryId) return false
            if (r.hasRoof === false) return false
            if (coveredRoomIds.has(r.id)) return false
            return true
        })

        if (candidateRooms.length === 0) return realPanels

        const virtualPanels = candidateRooms.map(r => {
             const poly = r.polygon
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
        return RoofGenerator.generateFromRoofPanels(visiblePanels, rooms, walls, roofPitch, roofOverhang)
    }, [visiblePanels, walls, rooms, roofPitch, roofOverhang, showRoof])

    // Compute unified footprint for visualization
    const unifiedFootprint = geometry?.footprint || null

    if (!showRoof) return null

    return (
        <Group>
            {/* Unified Footprint — Thick Green (for debugging) */}
            {unifiedFootprint && unifiedFootprint.length >= 3 && (
                <Line
                    points={unifiedFootprint.flatMap(p => [p.x, p.y]).concat([unifiedFootprint[0].x, unifiedFootprint[0].y])}
                    stroke="#00FF00"
                    strokeWidth={0.05}
                    closed={false}
                />
            )}
            
            {geometry && (
                <>
                    {/* Eaves — Light Grey Dashed */}
                    {geometry.eaves.map((edge, i) => (
                        <Line
                            key={`eave-${i}`}
                            points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
                            stroke="#9E9E9E"
                            strokeWidth={0.01}
                            dash={[0.3, 0.1]}
                        />
                    ))}

                    {/* Ridges — Dark Grey */}
                    {geometry.ridges.map((edge, i) => (
                        <Line
                            key={`ridge-${i}`}
                            points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
                            stroke="#555"
                            strokeWidth={0.02}
                            lineCap="round"
                        />
                    ))}

                    {/* Hips — Same as Ridges */}
                    {geometry.hips.map((edge, i) => (
                        <Line
                            key={`hip-${i}`}
                            points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
                            stroke="#555"
                            strokeWidth={0.02}
                            lineCap="round"
                        />
                    ))}

                    {/* Valleys — Blue */}
                    {geometry.valleys.map((edge, i) => (
                        <Line
                            key={`valley-${i}`}
                            points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
                            stroke="#337AB7"
                            strokeWidth={0.02}
                            lineCap="round"
                        />
                    ))}

                    {/* Slope Arrows */}
                    {showRoofSlopeArrows && geometry.slopeArrows?.map((arrow: { position: { x: number; y: number }; vector: { x: number; y: number }; text: string }, i: number) => {
                        const len = 1.0 
                        const halfLen = len / 2
                        
                        // Arrow points from ridge (inward) toward eave (outward) = DOWNHILL
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
