import { BOQItem, BOQCalculationInput } from './types'
import { ElectricalCalculator } from '../mep-routing/ElectricalCalculator'

export const calculateElectrical = (
    points: NonNullable<BOQCalculationInput['electricalPoints']> = [],
    config: NonNullable<BOQCalculationInput['mepConfig']>['electrical'],
    rooms: any[] = [] 
): BOQItem[] => {
    const items: BOQItem[] = []
    
    // Delegate to Vol 14 Logic
    const calc = ElectricalCalculator.calculate(points, config)
    
    // 1. Points & Accessories
    Object.entries(calc.points).forEach(([typeKey, count]) => {
        // Parse subtype if needed
        // typeKey might be "socket_double" or just "light"
        let name = 'Unknown Electrical Item'
        const type = typeKey.split('_')[0]
        
        switch(type) {
            case 'socket': name = 'Double Socket Outlet (SANS approved)'; break;
            case 'switch': name = 'Light Switch (1-Lever)'; break;
            case 'light': name = 'Light Point (Holder & Bulb)'; break;
            case 'db': 
            case 'db_board': name = 'Distribution Board (Flush mounted)'; break;
            case 'isolator': name = 'Isolator Switch (Stove/Geyser)'; break;
        }
        
        items.push({
            id: `elec-${typeKey}`,
            item: name,
            quantity: count,
            unit: 'No.',
            category: 'Electrical',
            rate: 0
        })
        
        // Boxes
        if (['socket', 'switch', 'isolator'].includes(type)) {
             items.push({
                id: `elec-box-${typeKey}`,
                item: `Galvanized Box 4x${type === 'socket' ? '4' : '2'}`,
                quantity: count,
                unit: 'No.',
                category: 'Electrical',
                rate: 0
            })
        }
    })
    
    // 2. Cabling & Conduit
    if (calc.wireLength > 0) {
        items.push({
            id: 'elec-conduit',
            item: `PVC Conduit 20mm (${config.conduitType})`,
            quantity: Math.ceil(calc.conduitLength),
            unit: 'm',
            category: 'Electrical',
            rate: 0
        })
        
        items.push({
            id: 'elec-wire',
            item: `House Wire ${config.wireType === 'house_wire' ? '2.5mm' : 'Surfix'} (Red/Black/Earth)`,
            quantity: Math.ceil(calc.wireLength),
            unit: 'm',
            category: 'Electrical',
            rate: 0
        })
    }
    
    // 3. DB Components
    if (calc.dbComponents.activeBreakers > 0) {
        items.push({
            id: 'elec-breakers',
            item: 'Circuit Breakers (20A SP)',
            quantity: calc.dbComponents.activeBreakers,
            unit: 'No.',
            category: 'Electrical',
            rate: 0
        })
        items.push({
             id: 'elec-earth-leakage',
             item: 'Earth Leakage Unit (63A)',
             quantity: 1, // Per DB, roughly
             unit: 'No.',
             category: 'Electrical',
             rate: 0
        })
    }
    
    return items
}
