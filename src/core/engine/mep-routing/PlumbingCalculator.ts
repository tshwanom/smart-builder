
import { PlumbingPoint, MEPConfig } from '@/modules/canvas/application/types'
import { RoutingEngine } from './RoutingEngine'

interface PlumbingResult {
    pipeLengthCold: number
    pipeLengthHot: number
    pipeLengthWaste: number
    fittings: number
    points: Record<string, number>
}

export const PlumbingCalculator = {
    calculate(points: PlumbingPoint[], config: MEPConfig['plumbing']): PlumbingResult {
        const result: PlumbingResult = {
            pipeLengthCold: 0,
            pipeLengthHot: 0,
            pipeLengthWaste: 0,
            fittings: 0,
            points: {}
        }

        // 1. Count Items
        points.forEach(p => {
             result.points[p.type] = (result.points[p.type] || 0) + 1
        })

        // 2. Topology
        const source = points.find(p => p.type === 'source')
        const fixtures = points.filter(p => p.type !== 'source')

        if (source && fixtures.length > 0) {
            // Star Topology for Water Supply (Typical for PEX)
            // Or Tree for Copper. let's assume Tree (Daisy Chain) for general conservative estimate
            
             // Sort by proximity
            const sorted = RoutingEngine.sortPointsByProximity([source.position, ...fixtures.map(f => f.position)])
            
            for (let i = 0; i < sorted.length - 1; i++) {
                 const start = sorted[i]
                 const end = sorted[i+1]
                 
                 // Vertical drops (Floor to Tap height ~1m)
                 const segmentDist = RoutingEngine.calculateRouteLength(start, end, 1.0)
                 
                 // Assume balanced supply (Hot & Cold run together)
                 result.pipeLengthCold += segmentDist
                 result.pipeLengthHot += segmentDist
            }
            
            // Waste Pipe (Drainage)
            // Usually direct to exterior wall, not daisy chained like supply. 
            // Estimate: Distance to nearest wall? 
            // For now, simplify as: 3m per fixture + main stack
            result.pipeLengthWaste = (fixtures.length * 3)
            
            // Fittings Estimation
            // 2 elbows + 1 tee per fixture pair
            result.fittings = fixtures.length * 4 
        }

        // Wastage
        result.pipeLengthCold *= 1.1
        result.pipeLengthHot *= 1.1
        result.pipeLengthWaste *= 1.1

        return result
    }
}
