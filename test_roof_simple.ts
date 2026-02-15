
import { generateRoof, RoofInput } from './src/modules/canvas/domain/geometry/roof/RoofEngine';
import { Vec2 } from './src/modules/canvas/domain/geometry/roof/Vec2';

// Standard 5m x 5m rectangle (in mm)
const footprint: Vec2[] = [
    { x: 0, y: 0 },
    { x: 5000, y: 0 },
    { x: 5000, y: 5000 },
    { x: 0, y: 5000 }
];

// Simple gable/hip directives
const edgeDirectives = footprint.map(() => ({ type: 'Hip', pitch: 25 } as any));

const input: RoofInput = {
    footprint: footprint,
    edgeDirectives: edgeDirectives,
    defaultPitch: 25,
    overhang: 500 // 500mm
};

console.log("Generating Roof for 5000x5000 rectangle...");
try {
    const result = generateRoof(input);
    if (!result) {
        console.error("Result is null!");
    } else {
        console.log("Ridges:", result.ridges.length);
        console.log("Hips:", result.hips.length);
        console.log("Valleys:", result.valleys.length);
        
        if (result.valleys.length > 0) {
            console.error("ERROR: Found Valleys in a convex rectangle!");
            console.log(JSON.stringify(result.valleys, null, 2));
        }

        // Check for infinite coordinates
        const allLines = [...result.ridges, ...result.hips, ...result.valleys, ...result.eaves];
        let hasInf = false;
        for (const line of allLines) {
            if (!isFinite(line.start.x) || !isFinite(line.start.y) || !isFinite(line.end.x) || !isFinite(line.end.y)) {
                console.error("ERROR: Infinite coordinate found:", line);
                hasInf = true;
            }
            if (Math.abs(line.start.x) > 100000 || Math.abs(line.start.y) > 100000) {
                 console.warn("WARNING: Extremely large coordinate:", line);
            }
        }
        if (!hasInf) console.log("Coordinates look sane.");
    }
} catch (e) {
    console.error("Exception:", e);
}
