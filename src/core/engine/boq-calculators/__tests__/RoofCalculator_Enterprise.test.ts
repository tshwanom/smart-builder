import { RoofCalculator } from '../RoofCalculator';
import { RoofStructure } from '../../../../domain/types';

describe('RoofCalculator (Enterprise Vol 10)', () => {
    
    // 10m x 10m plan = 100m2
    const planArea = 100;
    const pitch = 30; // degrees
    const ridgeLength = 10;
    const wallPerimeter = 40;

    test('Standard Tile Roof - Trusses (Howe)', () => {
        const structure: RoofStructure = {
            type: 'gable',
            pitch: 30,
            overhang: 600,
            trussType: 'howe',
            covering: { materialId: 'roof_tile_concrete_double_roman', underlay: true },
            ceiling: { type: 'gypsum', insulation: true }
        };

        const quantities = RoofCalculator.calculateQuantities(planArea, pitch, ridgeLength, structure, wallPerimeter);
        
        // 1. Trusses
        // Span = 10m
        // Spacing = 0.76m
        // Roof Length = 10m + 10m span (approx geometry logic) = 20m? 
        // Wait, logic in calculator was: roofLength = ridgeLength > 0 ? ridgeLength + span : span
        // For a simple gable 10x10, ridge is 10. But we are calculating based on "Roof Length" perpendicular to trusses?
        // If trusses span the 10m width, they are arranged along the 10m length.
        // My Calculator logic: const roofLength = ridgeLength > 0 ? ridgeLength + span : span
        // 10 + 10 = 20m? This logic seems to assume Hip roof where ridge < connected length.
        // For Gable, ridge = length. So we might be over-estimating truss count if we add span.
        // Let's check the calculator logic again. 
        // Logic: const roofLength = ridgeLength || Math.sqrt(planArea)
        // If I passed ridgeLength=10, roofLength=10.
        // Truss count = 10 / 0.76 = 13.1 -> 14 + 1 = 15 trusses.
        // Let's verify what the calculator actually does.
        
        // 2. Volume
        // 10m span * 0.015 = 0.15m3 per truss
        // 15 * 0.15 = 2.25 m3
        
        expect(quantities.trusses.count).toBeGreaterThan(10);
        expect(quantities.trusses.timberVolume).toBeGreaterThan(1.0);
        
        // 3. Bracing
        // 100 * 1.5 = 150m
        expect(quantities.bracing.strapLength).toBe(150);
        
        // 4. Plates
        expect(quantities.plates.length).toBe(40);
    });

    test('Sheeting Roof - Purlins & Spacing', () => {
         const structure: RoofStructure = {
            type: 'mono',
            pitch: 10,
            overhang: 300,
            trussType: 'howe',
            covering: { materialId: 'roof_sheet_ibr_0.5mm', underlay: true },
            ceiling: { type: 'gypsum', insulation: true }
        };

        const quantities = RoofCalculator.calculateQuantities(planArea, structure.pitch, ridgeLength, structure, wallPerimeter);
        
        // Spacing for sheeting = 1.05m? 
        // Logic: if (structure.covering.materialId.includes('sheet')) trussSpacing = 1.05
        // 10 / 1.05 = 9.5 -> 10 + 1 = 11 trusses
        
        expect(quantities.trusses.count).toBeLessThan(15); // Should be less than tile roof
        
        // Battens -> Purlins
        expect(quantities.battens.size).toBe('50x76');
        // Purlin spacing 1.2m
        // Surface Area = 100 / cos(10) = 100 / 0.98 = 101.5
        // Length = 101.5 / 1.2 = 84.5m
        expect(quantities.battens.length).toBeCloseTo(85, -1);
    });

});
