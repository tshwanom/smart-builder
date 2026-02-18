import { BOQItem, BOQCalculationInput } from './types'
import { PlumbingCalculator } from '../mep-routing/PlumbingCalculator'

export const calculatePlumbing = (
    points: NonNullable<BOQCalculationInput['plumbingPoints']> = [],
    config: NonNullable<BOQCalculationInput['mepConfig']>['plumbing']
): BOQItem[] => {
    const items: BOQItem[] = []
    
    const calc = PlumbingCalculator.calculate(points, config)
    
    // 1. Fixtures
    Object.entries(calc.points).forEach(([type, count]) => {
         let name = 'Unknown Plumbing Item'
         
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
            unit: 'No.',
            category: 'Plumbing',
            rate: 0
        })
    })
    
    // 2. Piping
    if (calc.pipeLengthCold > 0 || calc.pipeLengthHot > 0) {
        const pipeName = config.pipeType === 'copper' ? 'Copper Pipe' : 'PEX Pipe'
        
        if (calc.pipeLengthCold > 0) {
            items.push({
                id: 'plumb-pipe-cold',
                item: `${pipeName} (Cold Water Supply)`,
                quantity: Math.ceil(calc.pipeLengthCold),
                unit: 'm',
                category: 'Plumbing',
                rate: 0
            })
        }
        
        if (calc.pipeLengthHot > 0) {
            items.push({
                id: 'plumb-pipe-hot',
                item: `${pipeName} (Hot Water Supply)`,
                quantity: Math.ceil(calc.pipeLengthHot),
                unit: 'm',
                category: 'Plumbing',
                rate: 0
            })
             items.push({
                id: 'plumb-pipe-insulation',
                item: `Pipe Insulation (Hot Lines)`,
                quantity: Math.ceil(calc.pipeLengthHot),
                unit: 'm',
                category: 'Plumbing',
                rate: 0
            })
        }
    }
    
    if (calc.pipeLengthWaste > 0) {
        items.push({
            id: 'plumb-pipe-waste',
            item: `PVC Waste Pipe 40mm/50mm`,
            quantity: Math.ceil(calc.pipeLengthWaste),
            unit: 'm',
            category: 'Plumbing',
            rate: 0
        })
    }
    
    // 3. Fittings
    if (calc.fittings > 0) {
        items.push({
            id: 'plumb-fittings',
            item: 'Assorted Fittings (Elbows, Tees, Connectors)',
            quantity: calc.fittings,
            unit: 'No.',
            category: 'Plumbing',
            rate: 0
        })
    }

    return items
}
