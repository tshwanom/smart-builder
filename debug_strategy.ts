import { MasonryStrategy } from './src/modules/canvas/domain/wall/strategies/MasonryStrategy';
import { DrywallStrategy } from './src/modules/canvas/domain/wall/strategies/DrywallStrategy';
import { Wall } from './src/modules/canvas/application/types';
import { WallConstruction } from './src/modules/canvas/domain/wall/WallTypes';
import { IOpeningDimensions } from './src/modules/canvas/domain/wall/strategies/IWallStrategy';


const mockWall: Wall = {
    id: 'w1',
    thickness: 0.23,
    height: 2.7,
    length: 10,
    storyId: 's1',
    points: [{x:0, y:0}, {x:10, y:0}],
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

const openings: IOpeningDimensions[] = [
    { width: 1.0, height: 2.1, type: 'door' }
]

console.log('--- Masonry Strategy Test ---');
try {
    const masonry = new MasonryStrategy();
    const items = masonry.calculate(mockWall, mockMasonry, []);
    console.log('Items Count:', items.length);
    items.forEach(i => console.log(`- ${i.item}: ${i.quantity} ${i.unit}`));
    
    const bricks = items.filter(i => i.item.includes('Bricks')).reduce((s, i) => s + i.quantity, 0);
    console.log('Total Bricks:', bricks);
} catch (e) {
    console.error('Masonry Error:', e);
}

console.log('--- Drywall Strategy Test ---');
try {
    const drywall = new DrywallStrategy();
    // Fix mockDrywall if needed
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
    
    const dwStrategy = new DrywallStrategy();
    const items = dwStrategy.calculate(mockWall, mockDrywall, []);
    console.log('Items Count:', items.length);
    items.forEach(i => console.log(`- ${i.item}: ${i.quantity} ${i.unit}`));
} catch (e) {
    console.error('Drywall Error:', e);
}
