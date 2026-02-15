import { useCallback } from 'react'
import { useCanvasStore } from '../../application/store'
import { Point } from '../../application/types'

export const useCanvasCoordinates = () => {
    const { viewport, snapPoint } = useCanvasStore()

    const screenToWorld = useCallback((screenPoint: Point): Point => {
        return {
            x: (screenPoint.x - viewport.offset.x) / viewport.scale,
            y: (screenPoint.y - viewport.offset.y) / viewport.scale
        }
    }, [viewport])

    return { screenToWorld, snapPoint }
}
