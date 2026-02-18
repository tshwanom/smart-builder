import { MasonryStrategy } from '../../../../modules/canvas/domain/wall/strategies/MasonryStrategy';
import { DrywallStrategy } from '../../../../modules/canvas/domain/wall/strategies/DrywallStrategy';
import { WallConstruction } from '../../../../modules/canvas/domain/wall/WallTypes';
import { Wall } from '../../../../modules/canvas/application/types';
import { IOpeningDimensions } from '../../../../modules/canvas/domain/wall/strategies/IWallStrategy';

describe('WallBOQStrategies', () => {
    
    // Mock Data
    const mockWall: Wall = {
        id: 'w1',
        points: [{x:0, y:0}, {x:10, y:0}],
        thickness: 0.23,
        height: 2.7,
        length: 10,
        storyId: 's1',
        completed: true
    }

    const mockMasonry: WallConstruction = {
        id: 'const-masonry',
        name: 'Double Brick',
        category: 'masonry',
        standardRef: 'SANS',
        totalThickness: 220,
        fireRating: 0, acousticRating: 0, thermal: { uValue: 0, rValue: 0 },
        layers: [
            { id: 'l1', sequence: 1, type: 'masonry_skin', thickness: 110, masonry: { materialId: 'brick_clay_stock' } as any },
            { id: 'l2', sequence: 2, type: 'masonry_skin', thickness: 110, masonry: { materialId: 'brick_clay_stock' } as any }
        ]
    }

    const mockDrywall: WallConstruction = {
        id: 'const-drywall',
        name: 'Drywall 90',
        category: 'drywall',
        standardRef: 'SANS',
        totalThickness: 90,
        fireRating: 0, acousticRating: 0, thermal: { uValue: 0, rValue: 0 },
        layers: [
             { id: 'd1', sequence: 1, type: 'drywall_frame', thickness: 63 } as any,
             { id: 'd2', sequence: 2, type: 'gypsum_board', thickness: 12 } as any
        ]
    }

    const openings: IOpeningDimensions[] = [
        { width: 1.0, height: 2.1, type: 'door' }
    ]

    test('MasonryStrategy calculates bricks correctly', () => {
        const strategy = new MasonryStrategy();
        const items = strategy.calculate(mockWall, mockMasonry, []);
        
        // Sum all brick items
        const totalBricks = items
            .filter(i => i.item.includes('Bricks'))
            .reduce((sum, i) => sum + i.quantity, 0);
            
        // 10m x 2.7m = 27m2
        // Bricks: ~52 * 27 * 1.05 = ~1474 per skin
        // 2 skins = ~2948 total
        expect(totalBricks).toBeGreaterThan(2800);
    });

    test('MasonryStrategy handles openings', () => {
        const strategy = new MasonryStrategy();
        const items = strategy.calculate(mockWall, mockMasonry, openings);
        
        const totalBricks = items
            .filter(i => i.item.includes('Bricks'))
            .reduce((sum, i) => sum + i.quantity, 0);

        // Should be less than full wall
        expect(totalBricks).toBeLessThan(2900); 
    });

    test('DrywallStrategy calculates studs', () => {
        const strategy = new DrywallStrategy();
        const items = strategy.calculate(mockWall, mockDrywall, []);
        
        // Length 10m. Spacing 600mm.
        // Studs ~ 10/0.6 = 16.6 -> 17 + 1 = 18.
        // Corners +10% -> 19.8 -> 20? 
        // Logic: ceil(length/spacing) + 1 + openings*2
        // ceil(studs * 1.1)
        
        const studsItem = items.find(i => i.item.includes('Stud'));
        expect(studsItem).toBeDefined();
        // Allow range due to rounding
        expect(studsItem?.quantity).toBeGreaterThanOrEqual(18);
        expect(studsItem?.quantity).toBeLessThan(25);
    });
});
