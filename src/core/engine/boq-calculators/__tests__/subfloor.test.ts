import { calculateSubfloor } from '../subfloor';
import { SubfloorStructure } from '../../../../domain/types';

describe('SubfloorCalculator', () => {
    
    // 100m² area for easy maths
    const floorArea = 100;

    test('Slab On Ground - Calculates Concrete and Mesh', () => {
        const structure: SubfloorStructure = {
            id: 'slab-1',
            type: 'slab_on_ground',
            designMode: 'standard',
            naturalGroundLevel: 0,
            finishedFloorLevel: 0,
            slab: { thickness: 100, meshRef: 'Ref 193' }
        };
        
        const boq = calculateSubfloor(floorArea, structure);
        
        // Concrete: 100m² * 0.1m = 10 m³
        const concrete = boq.find(i => i.item.includes('Surface Bed Concrete'));
        expect(concrete?.quantity).toBeCloseTo(10.0, 1);
        
        // Mesh: 100m² * 1.1 (lap) = 110 m²
        const mesh = boq.find(i => i.item.includes('Ref 193 Mesh'));
        expect(mesh?.quantity).toBeCloseTo(110.0, 1);

        // Fill: 100m² * 0.15m * 1.3 = 19.5 m³
        const fill = boq.find(i => i.item.includes('Hardcore Fill'));
        expect(fill?.quantity).toBeCloseTo(19.5, 1);
    });

    test('Beam and Block - Calculates Beams and Blocks', () => {
        const structure: SubfloorStructure = {
            id: 'bnb-1',
            type: 'beam_and_block',
            designMode: 'engineer',
            naturalGroundLevel: 0,
            finishedFloorLevel: 0,
            beamAndBlock: {
                beamType: 'beam_150',
                blockType: 'block_hollow_110',
                beamSpacing: 600
            }
        };
        
        const boq = calculateSubfloor(floorArea, structure);
        
        // Beams:
        // Area / Spacing(m) = Total Length
        // 100 / 0.6 = 166.67m
        const beams = boq.find(i => i.item.includes('Prestressed Concrete Beams'));
        expect(beams?.quantity).toBeCloseTo(166.67, 1);
        
        // Blocks:
        // 10.5 blocks per m² * 100 = 1050 blocks
        const blocks = boq.find(i => i.item.includes('Hollow Concrete Blocks'));
        expect(blocks?.quantity).toBe(1050);
        
        // Topping:
        // 50mm topping -> 100 * 0.05 = 5.0 m³
        const topping = boq.find(i => i.item.includes('Concrete Topping'));
        expect(topping?.quantity).toBeCloseTo(5.0, 1);
    });

    test('Hollow Core - Calculates Slabs and Screed', () => {
        const structure: SubfloorStructure = {
            id: 'hc-1',
            type: 'hollow_core',
            designMode: 'engineer',
            naturalGroundLevel: 0,
            finishedFloorLevel: 0
        };
        
        const boq = calculateSubfloor(floorArea, structure);
        
        // Slabs: 100 m²
        const slabs = boq.find(i => i.item.includes('Hollow Core Slabs'));
        expect(slabs?.quantity).toBe(100);
        
        // Structural Screed: 40mm -> 100 * 0.04 = 4.0 m³
        const screed = boq.find(i => i.item.includes('Structural Screed'));
        expect(screed?.quantity).toBeCloseTo(4.0, 1);
    });
    
});
