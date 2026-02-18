
import { ElectricalPoint, MEPConfig } from '@/modules/canvas/application/types'
import { RoutingEngine } from './RoutingEngine'

interface ElectricalResult {
    wireLength: number
    conduitLength: number
    points: Record<string, number>
    dbComponents: {
        activeBreakers: number
        slotsUsed: number
    }
}

export const ElectricalCalculator = {
    calculate(points: ElectricalPoint[], config: MEPConfig['electrical']): ElectricalResult {
        const result: ElectricalResult = {
            wireLength: 0,
            conduitLength: 0,
            points: {},
            dbComponents: { activeBreakers: 0, slotsUsed: 0 }
        }

        // 1. Count Items
        points.forEach(p => {
             const typeKey = p.subtype ? `${p.type}_${p.subtype}` : p.type
             result.points[typeKey] = (result.points[typeKey] || 0) + 1
        })
        
        // 2. Identify DB(s)
        const dbs = points.filter(p => p.type === 'db_board' || p.isDB)
        const db = dbs.length > 0 ? dbs[0] : null
        
        const otherPoints = points.filter(p => p.type !== 'db_board' && !p.isDB)

        if (db && otherPoints.length > 0) {
             // 3. Simple Circuit Simulation (One big daisy chain for Vol 14 base)
             // In future: Group by 'circuitId'
             
             // Sort by proximity to minimize cable run
             const sortedPoints = RoutingEngine.sortPointsByProximity([db.position, ...otherPoints.map(p => p.position)])
             
             // Remove DB from start and map back to full objects if needed, 
             // but here we just need distances between the sorted positions.
             
             for (let i = 0; i < sortedPoints.length - 1; i++) {
                 const start = sortedPoints[i]
                 const end = sortedPoints[i+1]
                 
                 // Vertical Drop Logic
                 // Ceiling Mode: Up to ceiling, across, down to point
                 // Floor Mode: Down to slab, across, up to point
                 // Using config.ceilingHeight and default mounting heights
                 
                 const mountingHeight = 300 // default socket
                 // Switch ~1200, Light ~Ceiling
                 
                 // Simplified vertical adder: 2.5m (approx ceiling height)
                 const verticalAdder = 2.5 
                 
                 const segmentDist = RoutingEngine.calculateRouteLength(start, end, verticalAdder)
                 
                 result.conduitLength += segmentDist
                 result.wireLength += (segmentDist * 3) // Live, Neutral, Earth
             }
        }
        
        // wastage factors
        result.conduitLength *= 1.10
        result.wireLength *= 1.10
        
        // DB Sizing
        // 1 Circuit per 10 items (Rough rule of thumb for auto-sizing)
        const numCircuits = Math.ceil(otherPoints.length / 10)
        result.dbComponents.activeBreakers = numCircuits
        result.dbComponents.slotsUsed = numCircuits + 2 // + Main Switch + Earth Leakage
        
        return result
    }
}
