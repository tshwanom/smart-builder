import React from 'react'
import { Rect } from 'react-konva'
import { Point } from '../../../application/types'

interface BoxSelectOverlayProps {
    start: Point | null
    end: Point | null
    visible: boolean
}

export const BoxSelectOverlay: React.FC<BoxSelectOverlayProps> = ({ start, end, visible }) => {
    if (!visible || !start || !end) return null

    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)

    return (
        <Rect
             x={x}
             y={y}
             width={width}
             height={height}
             fill="rgba(59, 130, 246, 0.1)"
             stroke="#3b82f6"
             strokeWidth={0.02} // Meters? Assuming scale is roughly 1m ~ 50px? 0.02 is 2cm.
             dash={[0.1, 0.1]}
             listening={false} // Pass events through
        />
    )
}
