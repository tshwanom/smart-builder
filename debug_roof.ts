
// Run with: npx ts-node debug_roof.ts

import { RoofGenerator } from './src/modules/canvas/domain/geometry/RoofGenerator';
import { Wall, Point } from './src/modules/canvas/application/types';

// Mock Point
const p = (x: number, y: number) => ({ x, y });

// Define Walls for an L-Shape
// Room 1 (Main): 0,0 to 10,20
// Room 2 (Ext): 10,10 to 15,15
// Walls go CCW around the rooms? Or separate loops.
// Let's create walls as if dragged on canvas.
const walls: any[] = [
    // Main Vertical Rect (0,0 -> 10,20)
    { id: 'w1', points: [p(0,0), p(10,0)], roofBehavior: 'hip' },
    { id: 'w2', points: [p(10,0), p(10,20)], roofBehavior: 'hip' }, // Overlaps with extension?
    { id: 'w3', points: [p(10,20), p(0,20)], roofBehavior: 'hip' },
    { id: 'w4', points: [p(0,20), p(0,0)], roofBehavior: 'hip' },
    
    // Extension (10,10 -> 15,15)
    // The wall at x=10, y=10..15 is shared?
    // User draws Room 2 attached.
    { id: 'w5', points: [p(10,10), p(15,10)], roofBehavior: 'hip' },
    { id: 'w6', points: [p(15,10), p(15,15)], roofBehavior: 'hip' },
    { id: 'w7', points: [p(15,15), p(10,15)], roofBehavior: 'hip' },
    // The closing wall of extension is (10,15)->(10,10). 
    // This overlaps w2 a bit.
    { id: 'w8', points: [p(10,15), p(10,10)], roofBehavior: 'hip' }
];

import * as fs from 'fs';

// Capture logs
const logs: string[] = [];
const originalLog = console.log;
console.log = (...args) => {
    logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    originalLog(...args);
};

console.log("--- Starting Roof Generation Debug ---");
try {
    const roof = RoofGenerator.generate(walls as Wall[], 30, 0.5);
    
    console.log("\n--- Result ---");
    if (roof) {
        console.log(`Ridges: ${roof.ridges.length}`);
        console.log(`Hips: ${roof.hips.length}`);
        console.log(`Valleys: ${roof.valleys.length}`);
        console.log(`Eaves: ${roof.eaves.length}`);
        
        console.log("Valleys:", JSON.stringify(roof.valleys, null, 2));
    } else {
        console.log("Roof Generation Failed (null).");
    }
    
    fs.writeFileSync('debug_log.json', JSON.stringify(logs, null, 2));
} catch (e) {
    console.error("Error:", e);
    logs.push("Error: " + e);
    fs.writeFileSync('debug_log.json', JSON.stringify(logs, null, 2));
}
