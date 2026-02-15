
import { RoofGenerator } from './src/modules/canvas/domain/geometry/RoofGenerator';
import { Wall, Point } from './src/modules/canvas/application/types';

// Mock L-Shaped Building
// (0,0) -> (10,0) -> (10,5) -> (5,5) -> (5,10) -> (0,10) -> (0,0)
// Interior corner at (5,5)

const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 5 },
    { x: 5, y: 5 },  // Interior corner
    { x: 5, y: 10 },
    { x: 0, y: 10 }
];

// Create walls from points
const walls: Wall[] = points.map((p, i) => {
    const nextP = points[(i + 1) % points.length];
    return {
        id: `w${i}`,
        points: [p, nextP],
        thickness: 0.2,
        completed: true,
        roofBehavior: 'hip', // All hip for now
        roofPitch: 25,
        roofOverhang: 600 // mm
    } as Wall;
});

// Create room
const room = {
    id: 'r1',
    walls: walls.map(w => w.id),
    polygon: points,
    area: 75,
    perimeter: 40,
    hasRoof: true,
    roofPitch: 25,
    roofPlateHeight: 2.7
};

console.log("--- Testing Per-Wall Roof Generation (L-Shape) ---");

// Call RoofGenerator
// Note: We pass rooms array to assume room detection happened
const result = RoofGenerator.generate(
    walls,
    25, // global pitch
    600, // global overhang
    [room] // Mocked room
);

if (!result) {
    console.log("❌ Result is null!");
} else {
    console.log("✅ Roof generated successfully!");
    console.log(`Ridges: ${result.ridges.length}`);
    console.log(`Hips: ${result.hips.length}`);
    console.log(`Valleys: ${result.valleys.length}`);
    console.log(`Eaves: ${result.eaves.length}`);

    // Analyze Valley
    // We expect a valley starting near (5,5) - actually (5,5) offset by overhang?
    // In per-wall plane logic, the valley is the intersection of planes.
    // The interior corner wall 3 (10,5)->(5,5) and wall 4 (5,5)->(5,10) meet at (5,5).
    // Their planes slope UP and AWAY from the eave.
    // So the valley should extend from the corner INWARD.
    
    console.log("\n--- Valleys ---");
    result.valleys.forEach((v, i) => {
        console.log(`Valley ${i}: (${v.start.x.toFixed(3)}, ${v.start.y.toFixed(3)}) -> (${v.end.x.toFixed(3)}, ${v.end.y.toFixed(3)})`);
    });

    console.log("\n--- Ridges ---");
    result.ridges.forEach((r, i) => {
        console.log(`Ridge ${i}: (${r.start.x.toFixed(3)}, ${r.start.y.toFixed(3)}) -> (${r.end.x.toFixed(3)}, ${r.end.y.toFixed(3)})`);
    });
}
