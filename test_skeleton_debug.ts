import { computeStraightSkeleton } from './src/modules/canvas/domain/geometry/analytics/StraightSkeleton'
import * as fs from 'fs'

let out = ''
const log = (s: string) => { out += s + '\n'; console.log(s) }

// ─── Test 1: Simple Rectangle ───
log('=== TEST 1: Rectangle (4m × 3m) ===')
const rect = [
  { x: 0, y: 0 }, { x: 4, y: 0 },
  { x: 4, y: 3 }, { x: 0, y: 3 }
]
const r1 = computeStraightSkeleton(rect)
log(`Faces: ${r1.faces.length}, Arcs: ${r1.arcs.length}`)
for (const f of r1.faces) {
  const pts = f.polygon.map(p => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).join(' ')
  log(`  F${f.edgeIndex}: ${pts}`)
}
log(`  EXPECTED: 4 faces, each a trapezoid/triangle`)
log('')

// ─── Test 2: L-Shape (like user's building) ───
log('=== TEST 2: L-Shape ===')
// Simple L:
//   (0,0)─────(5,0)
//     │          │
//     │   (5,3)──(8,3)
//     │     │       │
//   (0,6)──(5,6)──(8,6)
// Wait, that's not an L. Let me draw it properly:
//
//   (0,0)───(5,0)
//     │        │
//     │      (5,3)───(8,3)
//     │               │
//   (0,6)────────────(8,6)
//
// Vertices CCW:
const lShape = [
  { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 3 },
  { x: 8, y: 3 }, { x: 8, y: 6 }, { x: 0, y: 6 }
]
const r2 = computeStraightSkeleton(lShape)
log(`Faces: ${r2.faces.length}, Arcs: ${r2.arcs.length}`)
for (const f of r2.faces) {
  const pts = f.polygon.map(p => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).join(' ')
  log(`  F${f.edgeIndex}: ${pts}`)
}
log(`  EXPECTED: 6 faces (one per edge), valley at internal corner (5,3)`)
log('')

// ─── Test 3: User's actual building (eave polygon from console) ───
log('=== TEST 3: User Building (meters) ===')
const userBuilding = [
  { x: 11, y: 2 }, { x: 11, y: -2 }, { x: 15, y: -2 }, { x: 15, y: 2 },
  { x: 17, y: 2 }, { x: 17, y: 7 }, { x: 15, y: 7 }, { x: 15, y: 9 },
  { x: 11, y: 9 }, { x: 11, y: 7 }, { x: 8, y: 7 }, { x: 8, y: 2 }
]
const r3 = computeStraightSkeleton(userBuilding)
log(`Faces: ${r3.faces.length}, Arcs: ${r3.arcs.length}`)
for (const f of r3.faces) {
  const pts = f.polygon.map(p => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).join(' ')
  log(`  F${f.edgeIndex}: ${pts}`)
}
log(`  EXPECTED: 12 faces (one per edge), no holes`)
log('')

// ─── Test 4: L-Shape (user's current test - from screenshot) ───
// From the screenshot, the L-shape looks like:
//   Top-left rectangle: roughly 5m × 12m
//   Bottom-right rectangle: roughly 4m × 4m
// Let me approximate from the screenshot dimensions:
log('=== TEST 4: L-Shape (Screenshot Approximation) ===')
const lUser = [
  { x: 0, y: 0 },   { x: 5, y: 0 },    // top edge
  { x: 5, y: 8 },                         // right edge of upper wing
  { x: 9, y: 8 },                         // corridor going right
  { x: 9, y: 12 },                        // bottom of lower-right
  { x: 0, y: 12 }                         // left edge going back up
]
const r4 = computeStraightSkeleton(lUser)
log(`Faces: ${r4.faces.length}, Arcs: ${r4.arcs.length}`)
for (const f of r4.faces) {
  const pts = f.polygon.map(p => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).join(' ')
  log(`  F${f.edgeIndex}: ${pts}`)
}
log(`  EXPECTED: 6 faces, valley from concave corner`)
log('')

// ─── Validation: Check all faces cover the polygon ───
log('=== VALIDATION ===')
function signedArea(pts: { x: number; y: number }[]): number {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y
  }
  return a / 2
}

for (const [name, result] of [['Rect', r1], ['L-Shape', r2], ['User', r3], ['L-User', r4]] as const) {
  let totalFaceArea = 0
  const areas: number[] = []
  for (const f of result.faces) {
    const a = Math.abs(signedArea(f.polygon))
    totalFaceArea += a
    areas.push(a)
  }
  log(`${name}: totalFaceArea=${totalFaceArea.toFixed(2)}, per face: [${areas.map(a => a.toFixed(2)).join(', ')}]`)
}

fs.writeFileSync('skeleton_debug_output.txt', out)
log('\nWritten to skeleton_debug_output.txt')
