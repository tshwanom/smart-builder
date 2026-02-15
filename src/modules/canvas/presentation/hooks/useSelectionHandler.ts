import { useCallback } from 'react'
import { KonvaEventObject } from 'konva/lib/Node'
import { useCanvasStore } from '../../application/store'

export const useSelectionHandler = () => {
    const { currentTool, clearSelection } = useCanvasStore()

    const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
        // Only handle if tool is 'select'
        if (currentTool !== 'select') return

        const stage = e.target.getStage()
        if (!stage) return

        // If clicked on empty space (Stage), clear selection
        const clickedOnStage = e.target === stage || e.target.name() === 'grid-background'
        if (clickedOnStage) {
            clearSelection()
        }
    }, [currentTool, clearSelection])

    return {
        handleStageClick
    }
}
