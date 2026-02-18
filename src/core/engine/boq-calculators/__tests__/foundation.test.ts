import { calculateFoundation } from '../foundation';
import { FoundationStructure } from '../../../../domain/types';

describe('FoundationCalculator', () => {
    
    // Default mock structure
    const baseStructure: FoundationStructure = {
        id: 'test-1',
        type: 'strip_footing',
        designMode: 'standard',
        soilClass: 'H1',
        width: 600,
        depth: 300,
        foundingLevel: 500, // Shallower than H1 requirement (750)
        concrete: { grade: '20MPa' },
        reinforcement: {}
    };

    test('Standard Mode - Enforces SANS H1 Minimums', () => {
        // H1 requires 750mm depth
        // Min width 450 (input 600 is fine)
        // Min depth 300 (input 300 is fine)
        
        const boq = calculateFoundation(10, baseStructure);
        
        // Checklist:
        // 1. Excavation volume based on 750mm depth?
        // Width = 600 + 600 (working space) = 1.2m
        // Depth = 0.75m
        // Volume = 10 * 1.2 * 0.75 = 9.0 m³
        const excav = boq.find(i => i.item.includes('Excavation'));
        expect(excav).toBeDefined();
        // Allow small rounding diffs
        expect(excav?.quantity).toBeCloseTo(9.0, 1);
        expect(excav?.notes).toContain('Depth: 750mm');
    });

    test('Standard Mode - Enforces SANS H4 Minimums', () => {
        const h4Structure: FoundationStructure = {
            ...baseStructure,
            soilClass: 'H4'
        };
        // H4 requires 1500mm depth
        
        const boq = calculateFoundation(10, h4Structure);
        
        const excav = boq.find(i => i.item.includes('Excavation'));
        expect(excav?.notes).toContain('Depth: 1500mm');
        
        // Check for safety item (planking)
        const safety = boq.find(i => i.item.includes('Planking'));
        // 1500mm depth might barely trigger or not depending on > vs >= logic
        // Code says > 1500. So exact 1500 might not trigger.
        // Let's check logic: if (excavationDepth > 1500)
        // If depth is exactly 1500, it won't trigger.
        expect(safety).toBeUndefined();
    });

    test('Engineer Mode - Respects Custom Requirements', () => {
        const engStructure: FoundationStructure = {
            ...baseStructure,
            designMode: 'engineer',
            soilClass: 'custom',
            foundingLevel: 400 // Shallow
        };
        
        const boq = calculateFoundation(10, engStructure);
        
        const excav = boq.find(i => i.item.includes('Excavation'));
        // Should respect 400mm
        expect(excav?.notes).toContain('Depth: 400mm');
    });

    test('Calculates Concrete Volume', () => {
        // 10m length, 0.6m width, 0.3m depth
        // Vol = 1.8 m³
        // Waste 5% = 1.89 m³
        const boq = calculateFoundation(10, baseStructure);
        
        const concrete = boq.find(i => i.category === 'Foundation - Concrete');
        expect(concrete).toBeDefined();
        expect(concrete?.quantity).toBeCloseTo(1.89, 2);
    });

    test('Calculates Reinforcement', () => {
        const rebarStructure: FoundationStructure = {
            ...baseStructure,
            reinforcement: {
                bottomBars: { size: 'Y12', quantity: 3 }
            }
        };
        
        const boq = calculateFoundation(10, rebarStructure);
        
        // 10m wall * 3 bars = 30m
        // Laps: 30 / 6 = 5 laps
        // Lap length = 12mm * 50 = 600mm = 0.6m
        // Total laps length = 5 * 0.6 = 3.0m
        // Total length = 33m
        // Y12 mass = 0.888 kg/m
        // Total mass = 33 * 0.888 = 29.30 kg
        
        const rebar = boq.find(i => i.item.includes('Bottom Reinforcement Y12'));
        expect(rebar).toBeDefined();
        expect(rebar?.quantity).toBeCloseTo(29.3, 1);
    });
    
});
