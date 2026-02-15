
import { Vec2 } from './src/modules/canvas/domain/geometry/roof/Vec2';
import { generateRoof, RoofInput, EdgeDirective } from './src/modules/canvas/domain/geometry/roof/RoofEngine';

// Mock data matching screenshot approximation (mm)
// Main House (approx 8m x 9m)
const p1: Vec2 = { x: 0, y: 0 };
const p2: Vec2 = { x: 8000, y: 0 };
const p3: Vec2 = { x: 8000, y: 9000 };
const p4: Vec2 = { x: 0, y: 9000 };

// Garage (approx 4m x 5m, attached to right side)
const p5: Vec2 = { x: 8000, y: 3000 };
const p6: Vec2 = { x: 12000, y: 3000 };
const p7: Vec2 = { x: 12000, y: 8000 };
const p8: Vec2 = { x: 8000, y: 8000 };

// Footprint: Outer boundary (CCW)
// 0,0 -> 8000,0 -> 8000,3000 -> 12000,3000 -> 12000,8000 -> 8000,8000 -> 8000,9000 -> 0,9000
const footprint: Vec2[] = [
    { x: 0, y: 0 },
    { x: 8000, y: 0 },
    { x: 8000, y: 3000 },
    { x: 12000, y: 3000 },
    { x: 12000, y: 8000 },
    { x: 8000, y: 8000 },
    { x: 8000, y: 9000 },
    { x: 0, y: 9000 }
];

const directives: EdgeDirective[] = footprint.map(() => ({
    behavior: 'hip',
    pitch: 25,
    baselineHeight: 0
}));

const input: RoofInput = {
    footprint,
    edgeDirectives: directives,
    defaultPitch: 25,
    overhang: 600 // mm
};

console.log("--- Starting Roof Test ---");
const result = generateRoof(input);

if (!result) {
    console.log("Result is null!");
} else {
    console.log("Ridges:", result.ridges.length);
    console.log("Hips:", result.hips.length);
    console.log("Valleys:", result.valleys.length);
    console.log("Eaves:", result.eaves.length);
    
    // Check for weird coordinates
    const check = (name: string, arr: {start:Vec2, end:Vec2}[]) => {
        arr.forEach((l, i) => {
            console.log(`${name} ${i}: (${l.start.x.toFixed(1)}, ${l.start.y.toFixed(1)}) -> (${l.end.x.toFixed(1)}, ${l.end.y.toFixed(1)})`);
        });
    };
    
    check("Eave", result.eaves);
    check("Ridge", result.ridges);
    check("Hip", result.hips);
}
