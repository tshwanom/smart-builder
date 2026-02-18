import { WallCalculator } from '../WallCalculator';
import { WallStructure } from '../../../../domain/types';

describe('WallCalculator (Modern Systems)', () => {
    
    // 10m long, 2.7m high wall = 27m2
    const length = 10;
    const height = 2.7;
    const area = 27;

    test('Drywall - Calculates Studs, Tracks, Boards', () => {
        const drywall: WallStructure = {
            type: 'drywall',
            drywall: {
                studSize: 64,
                studSpacing: 600,
                boardType: 'gypsum_12mm',
                insulation: true
            }
        };

        const items = WallCalculator.calculateWallItems(area, length, height, drywall);
        
        // 1. Studs
        // 10m / 0.6 = 16.6 -> 17 spaces -> 18 studs + starters? 
        // Logic was: Math.ceil((length * 1000) / spacing) + 2
        // ceil(10000 / 600) + 2 = 17 + 2 = 19 studs
        // Total length = 19 * 2.7m = 51.3m
        const studs = items.find(i => i.item === 'Steel Stud 64mm');
        expect(studs?.quantity).toBeCloseTo(51.3, 1);
        
        // 2. Tracks
        // 10m * 2 = 20m
        const tracks = items.find(i => i.item === 'Steel Track 64mm');
        expect(tracks?.quantity).toBe(20);
        
        // 3. Boards
        // 27m2 * 2 sides * 1.1 waste = 59.4 m2
        const boards = items.find(i => i.item === 'Gypsum Board 12mm');
        expect(boards?.quantity).toBeCloseTo(59.4, 1);
        
        // 4. Insulation
        // 27m2
        const insulation = items.find(i => i.item.includes('Insulation'));
        expect(insulation?.quantity).toBe(27);
    });

    test('ICF - Calculates Blocks, Concrete, Rebar', () => {
        const icf: WallStructure = {
            type: 'icf',
            icf: {
                coreWidth: 150,
                blockType: 'icf_block_standard'
            }
        };

        const items = WallCalculator.calculateWallItems(area, length, height, icf);
        
        // 1. Blocks
        // 27m2 / 0.36 = 75 blocks
        const blocks = items.find(i => i.item.includes('ICF Block'));
        expect(blocks?.quantity).toBe(75);
        
        // 2. Concrete
        // 27 * 0.15 = 4.05 m3
        const concrete = items.find(i => i.item.includes('Concrete 30MPa'));
        expect(concrete?.quantity).toBeCloseTo(4.05, 2);
        
        // 3. Rebar
        // 27 * 8kg = 216kg
        const rebar = items.find(i => i.item.includes('Rebar'));
        expect(rebar?.quantity).toBe(216);
    });

    test('Masonry Default - Still works', () => {
        const masonry: WallStructure = {
            type: 'masonry',
            skins: [{ materialId: 'brick_clay_stock', orientation: 'stretcher' }],
            plaster: { internal: 'p1', external: 'p1', thickness: 15 }
        };

        const items = WallCalculator.calculateWallItems(area, length, height, masonry);
        
        const bricks = items.find(i => i.item === 'Masonry Unit');
        expect(bricks).toBeDefined();
        // 27 * 52 = 1404
        expect(bricks?.quantity).toBeGreaterThan(1400);
    });

});
