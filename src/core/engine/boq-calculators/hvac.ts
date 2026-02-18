
import { BOQItem, BOQCalculationInput } from './types'
import { HVACCalculator } from '../mep-routing/HVACCalculator'

export const calculateHVAC = (
    points: NonNullable<BOQCalculationInput['hvacPoints']> = [],
    config: NonNullable<BOQCalculationInput['mepConfig']>['hvac']
): BOQItem[] => {
    const items: BOQItem[] = []
    
    // Delegate to the core logic
    const calc = HVACCalculator.calculate(points, config || {})
    
    // Create BOQ Items
    
    // 1. Units
    if (calc.units['split_ac']) {
        items.push({
            id: 'hvac-split-unit',
            item: 'Split Air Conditioning Unit (Indoor + Outdoor)',
            quantity: calc.units['split_ac'],
            unit: 'No.',
            category: 'HVAC',
            rate: 0
        })
    }
    
    // 2. Piping
    if (calc.pipingSetLength > 0) {
        items.push({
            id: 'hvac-pipe-set',
            item: 'Insulated Copper Piping Pair (Liquid/Gas)',
            quantity: Math.ceil(calc.pipingSetLength),
            unit: 'm',
            category: 'HVAC',
            rate: 0
        })
        
        items.push({
             id: 'hvac-drain',
             item: 'PVC Condensate Drain Pipe 20mm',
             quantity: Math.ceil(calc.drainPipeLength),
             unit: 'm',
             category: 'HVAC',
             rate: 0
        })
    }
    
    return items
}
