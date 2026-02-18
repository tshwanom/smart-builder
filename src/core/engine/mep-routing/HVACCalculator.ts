
import { HVACPoint, MEPConfig } from '@/modules/canvas/application/types'
import { RoutingEngine } from './RoutingEngine'

interface HVACResult {
    pipingSetLength: number // Copper Pair + Insulation
    drainPipeLength: number
    units: Record<string, number>
}

export const HVACCalculator = {
    calculate(points: HVACPoint[], config: MEPConfig['hvac']): HVACResult {
        const result: HVACResult = {
            pipingSetLength: 0,
            drainPipeLength: 0,
            units: {}
        }
        
        // 1. Count Units
        const indoorUnits = points.filter(p => p.type === 'split_indoor')
        const outdoorUnits = points.filter(p => p.type === 'split_outdoor')
        
        // Count
        indoorUnits.forEach(u => {
            // Try match with outdoor unit
            // Simple logic: Find nearest outdoor unit that isn't excessively far
             result.units['split_ac'] = (result.units['split_ac'] || 0) + 1
        })
        
        // 2. Piping
        // For each indoor unit, find nearest outdoor unit
        // If no outdoor unit, assume 5m default run
        
        indoorUnits.forEach(indoor => {
            let minDist = 5 // Default assumption if no outdoor unit drawn
            
            if ( outdoorUnits.length > 0 ) {
                 // Find nearest
                 const distances = outdoorUnits.map(od => 
                    RoutingEngine.calculateRouteLength(indoor.position, od.position, 2.5) // 2.5m vertical drop
                 )
                 minDist = Math.min(...distances)
            }
            
            result.pipingSetLength += minDist
            result.drainPipeLength += minDist // Condensate often follows refrigerant or goes to ground
        })
        
        // Wastage
        result.pipingSetLength *= 1.1
        result.drainPipeLength *= 1.1
        
        return result
    }
}
