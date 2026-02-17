import { BOQItem, BOQCalculationInput } from './types'

export const calculatePlumbing = (
    points: NonNullable<BOQCalculationInput['plumbingPoints']> = [],
    config: NonNullable<BOQCalculationInput['mepConfig']>['plumbing']
): BOQItem[] => {
    const items: BOQItem[] = []
    
    // 1. Count Points
    const counts: Record<string, number> = {}
    let sourcePoint = null
    
    points.forEach(p => {
        counts[p.type] = (counts[p.type] || 0) + 1
        if (p.isSource) sourcePoint = p
    })
    
    // Add point items
    Object.entries(counts).forEach(([type, count]) => {
        let name = 'Unknown Plumbing Item'
        const unit = 'No.'
        const category = 'Plumbing'
        
        switch(type) {
            case 'basin': name = 'Basin Mixer & Waste'; break;
            case 'sink': name = 'Kitchen Sink Mixer & Waste'; break;
            case 'shower': name = 'Shower Rose & Mixer'; break;
            case 'toilet': name = 'Toilet Suite (Cistern & Pan)'; break;
            case 'bath': name = 'Bath Mixer & Waste'; break;
            case 'washing_machine': name = 'Washing Machine Point (Tap & Drain)'; break;
            case 'source': name = 'Main Connection Point'; break;
        }
        
        items.push({
            id: `plumb-${type}`,
            item: name,
            quantity: count,
            unit,
            category,
            rate: 0
        })
    })
    
    // 2. Calculate Piping
    if (sourcePoint) {
        let totalPipeLength = 0
        
        // Simple star topology estimation
        points.forEach(p => {
            if (p.id === sourcePoint!.id) return
            
            const dist = Math.sqrt(
                Math.pow(p.position.x - sourcePoint!.position.x, 2) + 
                Math.pow(p.position.y - sourcePoint!.position.y, 2)
            ) / 1000 // mm to m
            
            // Add vertical runs (average 1.5m per point)
            const run = dist + 1.5
            
            totalPipeLength += run
        })
        
        // Add 10% waste
        totalPipeLength *= 1.1
        
        const pipeName = config.pipeType === 'copper' ? 'Copper Pipe 15mm/22mm' : 
                         config.pipeType === 'pex' ? 'PEX Pipe 15mm' : 'PVC Pipe 50mm/110mm'
        
        items.push({
            id: 'plumb-pipe',
            item: pipeName,
            quantity: Math.ceil(totalPipeLength),
            unit: 'm',
            category: 'Plumbing',
            rate: 0
        })
        
        // Estimate fittings (approx 4 per point)
        items.push({
            id: 'plumb-fittings',
            item: 'Assorted Fittings (Elbows, Tees, Connectors)',
            quantity: points.length * 4,
            unit: 'No.',
            category: 'Plumbing',
            rate: 0
        })
    }
    
    return items
}
