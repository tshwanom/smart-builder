import { RoofStructure } from '../../../domain/types'
import { MaterialDatabase } from '../../../application/services/MaterialDatabase'
import { RoofCovering } from '../../../domain/materialTypes'

interface RoofQuantities {
    trusses: {
        count: number
        type: string
        timberVolume: number // m3
        plateCount: number // Gangnail plates
    }
    battens: {
        length: number // m
        size: string
    }
    covering: {
        count: number // tiles
        area: number // m2 (sheeting)
        ridges: number // m
    }
    bracing: {
        strapLength: number // m
    }
    plates: {
        length: number // m (Wall plates)
        size: string
    }
}

export const RoofCalculator = {
    
    calculateSurfaceArea: (planArea: number, pitchDegrees: number): number => {
        const rads = pitchDegrees * (Math.PI / 180)
        return planArea / Math.cos(rads)
    },

    calculateQuantities: (
        planArea: number, 
        pitch: number, 
        ridgeLength: number,
        structure: RoofStructure,
        wallPerimeter: number = 0
    ): RoofQuantities => {
        
        const surfaceArea = RoofCalculator.calculateSurfaceArea(planArea, pitch)
        
        // 1. Trusses
        // Est Span = sqrt(planArea)
        const span = Math.sqrt(planArea)
        // Spacing: 760mm or 1050mm
        let trussSpacing = 0.76 
        if (structure.covering.materialId.includes('sheet')) trussSpacing = 1.05
        
        // Roof Length Logic
        // For Gable: Roof Length is roughly the Ridge Length (perpendicular to truss span)
        // For Hip: Roof Length is Ridge + Span (roughly)
        let roofLength = span
        if (ridgeLength > 0) {
            if (structure.type === 'gable') {
                roofLength = ridgeLength
            } else {
                roofLength = ridgeLength + (span * 0.5) // Hips extend approx half span each side? No, simpler approx
                // Hip roof 10x10, ridge is tiny. Length is 10.
                // Let's just use max(ridge, span) for now as a safer baseline, or sqrt(area)
                roofLength = Math.max(ridgeLength, span)
            }
        }
        
        const trussCount = Math.ceil(roofLength / trussSpacing) + 1
        
        // Volume: Empirical formula for Howe Truss S5 Timber
        // Vol = Span (m) * 0.015 (factor)
        // e.g. 10m span -> 0.15m3
        // 6m span -> 0.09m3
        const volPerTruss = span * 0.015
        
        // Gangnail plates: Approx 16 per truss
        const plateCount = trussCount * 16

        // 2. Wall Plates
        // Along two sides of proper length (assuming square for now if perimeter 0)
        const plateLen = wallPerimeter > 0 ? wallPerimeter : span * 2

        // 3. Bracing (SANS 10400-L)
        // Cross bracing every 3-4 trusses
        // Longitudinal bracing per truss node
        // Approx 1.5m bracing strap per m2 of plan area
        const strapLength = planArea * 1.5

        // 4. Covering & Battens
        const coveringMat = MaterialDatabase.getMaterial(structure.covering.materialId) as RoofCovering
        
        let battenLength = 0
        let tileCount = 0
        let sheetArea = 0
        
        if (coveringMat) {
            if (coveringMat.type === 'tile') {
                const battenSpacing = 0.32 
                battenLength = surfaceArea / battenSpacing
                
                const tileWidth = (coveringMat.dimensions?.width || 300) / 1000
                const tileLength = (coveringMat.dimensions?.length || 420) / 1000
                const overlap = 0.100 
                const effectiveArea = tileWidth * (tileLength - overlap)
                tileCount = Math.ceil(surfaceArea / effectiveArea)
            } else if (coveringMat.type === 'sheeting') {
                // Purlins @ 1.2m
                battenLength = surfaceArea / 1.2 
                sheetArea = surfaceArea * 1.08 // +8% overlaps
            }
        } else {
             // Fallback
             if (structure.covering.materialId.includes('sheet')) {
                 battenLength = surfaceArea / 1.2
                 sheetArea = surfaceArea * 1.05
             } else {
                 tileCount = Math.ceil(surfaceArea * 10.5)
             }
        }
        
        return {
            trusses: {
                count: trussCount,
                type: structure.trussType,
                timberVolume: parseFloat((trussCount * volPerTruss).toFixed(3)),
                plateCount: plateCount
            },
            battens: {
                length: Math.ceil(battenLength),
                size: (coveringMat?.type === 'sheeting' || structure.covering.materialId.includes('sheet')) ? '50x76' : '38x38'
            },
            covering: {
                count: tileCount,
                area: parseFloat(sheetArea.toFixed(2)),
                ridges: ridgeLength
            },
            bracing: {
                strapLength: Math.ceil(strapLength)
            },
            plates: {
                length: Math.ceil(plateLen),
                size: '38x114'
            }
        }
    }
}
