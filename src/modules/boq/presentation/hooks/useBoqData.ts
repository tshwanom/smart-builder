import { useMemo } from 'react'
import { useGeometryStore } from '../../../../application/store/geometryStore'
import { adaptGeometryToBOQInput } from '../../../../application/adapters/boqAdapter'
import { calculateBOQ } from '../../../../core/engine/boqCalculator'
import { BOQCalculationInput } from '../../../../core/engine/boq-calculators/types'

// Helper to synthesize floor area if not explicitly defined
// Accessing the findOuterLoop logic from RoofGenerator would be ideal, 
// strictly speaking we should move that logic to a shared geometry service.
// For now, let's duplicate the simple area approximation or import if possible.
import { ProjectGeometry } from '../../../../domain/types'
// We'll trust adaptGeometryToBOQInput to handle most, but we might need to enhance it here.

export function useBoqData() {
    const { project } = useGeometryStore()
    
    const boqItems = useMemo(() => {
        // 1. Adapt Data
        const partialInput = adaptGeometryToBOQInput(project)
        
        // 2. Synthesize missing data (like floor area from walls if 0)
        let floorArea = partialInput.floorArea || 0
        if (floorArea === 0 && project.walls.length > 2) {
            // Rough approximation: Bounding box? Or specific loop area?
            // Let's use bounding box for v1 if exact loop is expensive to re-import
            // Actually, let's keep it 0 if we can't be precise, or maybe walls * width?
            // Better: Let's assume the user will define rooms later, or we use a simplistic wall-enclosed area.
            // For now, let's leave it as 0 to avoid misleading costs, or maybe 
            // the adapter should have handled it? 
            // The adapter sets it to 0. 
            // In the legacy app, floorArea came from 'rooms'. We don't have rooms yet.
            // Let's assume a standard dummy area for testing if walls exist? 
            // No, accuracy is key.
        }

        const fullInput: BOQCalculationInput = {
            wallLength: partialInput.wallLength || 0,
            wallArea: partialInput.wallArea || 0,
            floorArea: floorArea,
            openings: partialInput.openings || [],
            roofType: project.boqConfig.roofType || 'gable',
            roofPitch: project.boqConfig.roofPitch ?? 30,
            brickType: 'clay', // Could be in boqConfig
            finishes: project.boqConfig.finishes,
            
            // Map MEP if present (stub for now, need adapter update for MEP)
            mepConfig: project.mepConfig ? {
                electrical: {
                    ...project.mepConfig.electrical
                },
                plumbing: {
                    ...project.mepConfig.plumbing
                }
            } : undefined,
            electricalPoints: [], // Need to map from geometry if we add them
            plumbingPoints: [],
            rooms: [], // Need synthesized rooms
            staircases: []
        }

        return calculateBOQ(fullInput)
    }, [project])

    return {
        boqItems,
        isLoading: false,
        config: project.boqConfig
    }
}
