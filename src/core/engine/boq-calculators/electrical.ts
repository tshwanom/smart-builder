import { BOQItem, BOQCalculationInput } from './types'
import { calculateElectricalRouting, ElectricalPoint } from '@/core/engine/mep-routing'

export const calculateElectrical = (
    points: NonNullable<BOQCalculationInput['electricalPoints']> = [],
    config: NonNullable<BOQCalculationInput['mepConfig']>['electrical'],
    rooms: any[] = [] // Should be Room[] but strict typing might require importing Room. using any for safety with existing types
): BOQItem[] => {
    const items: BOQItem[] = []
    
    // 1. Count Points
    const counts: Record<string, number> = {}
    let dbPoint: ElectricalPoint | undefined = undefined
    
    // Cast points to compatible type for routing engine
    const castPoints: ElectricalPoint[] = points.map(p => ({
        ...p,
        type: p.type as any 
    }))
    
    castPoints.forEach(p => {
        counts[p.type] = (counts[p.type] || 0) + 1
        if (p.type === 'db') dbPoint = p
    })
    
    // Add point items
    Object.entries(counts).forEach(([type, count]) => {
        let name = 'Unknown Electrical Item'
        const unit = 'No.'
        const category = 'Electrical'
        
        switch(type) {
            case 'socket': name = 'Double Socket Outlet (SANS approved)'; break;
            case 'switch': name = 'Light Switch (1-Lever)'; break;
            case 'light': name = 'Light Point (Holder & Bulb)'; break;
            case 'db': name = 'Distribution Board (Flush mounted)'; break;
            case 'isolator': name = 'Isolator Switch (Stove/Geyser)'; break;
        }
        
        items.push({
            id: `elec-${type}`,
            item: name,
            quantity: count,
            unit,
            category,
            rate: 0 // To be filled from price list
        })
        
        // Add boxes for switches and sockets
        if (['socket', 'switch', 'isolator'].includes(type)) {
             items.push({
                id: `elec-box-${type}`,
                item: `Galvanized Box 4x${type === 'socket' ? '4' : '2'}`,
                quantity: count,
                unit: 'No.',
                category: 'Electrical',
                rate: 0
            })
        }
    })
    
    // 2. Calculate Cabling using Intelligent Routing
    if (dbPoint) {
        // Use shared routing engine with ROOM CONTEXT
        const routes = calculateElectricalRouting(castPoints, dbPoint, rooms)
        
        let totalConduitLength = 0
        let totalWireLength = 0
        
        const verticalDrop = config.routingMode === 'ceiling' ? 2.4 : 0.3 // Average drop/rise
        
        routes.forEach(route => {
            // Horizontal distance (m)
            // Assuming points are in meters (based on canvas usage)
            // If previous code divided by 1000, it thought they were mm.
            // But canvas usually uses meters. 
            // We will trust the raw distance for now, assuming consistency with the Visualizer.
            // If the visualizer looks right, this dist is right.
            const dist = Math.sqrt(
                Math.pow(route.from.x - route.to.x, 2) + 
                Math.pow(route.from.y - route.to.y, 2)
            ) 
            
            const len = dist 
            
            // Add vertical runs logic
            // 'main' routes (to DB) usually have vertical drop at both ends?
            // 'sub' routes (daisy chain) usually have vertical drop at both ends (ceiling -> point -> ceiling).
            // Simplified: 
            const run = len + (verticalDrop * 2)
            
            totalConduitLength += run
            
            // Wire: 3 wires (L, N, E) for sockets/isolators
            // Lights in daisy chain often have 2 or 3 + switch wire. 
            // Simplified average: 3 wires
            totalWireLength += (run * 3) 
        })
        
        // Add 10% waste
        totalConduitLength *= 1.1
        totalWireLength *= 1.1
        
        items.push({
            id: 'elec-conduit',
            item: 'PVC Conduit 20mm',
            quantity: Math.ceil(totalConduitLength),
            unit: 'm',
            category: 'Electrical',
            rate: 0
        })
        
        items.push({
            id: 'elec-wire',
            item: `House Wire ${config.routingMode === 'ceiling' ? '1.5mm' : '2.5mm'} (Red/Black/Earth)`,
            quantity: Math.ceil(totalWireLength),
            unit: 'm',
            category: 'Electrical',
            rate: 0
        })
    }
    
    return items
}
