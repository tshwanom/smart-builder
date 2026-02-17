import { computeStraightSkeleton } from './src/modules/canvas/domain/geometry/analytics/StraightSkeleton'
import * as fs from 'fs'

let out = ''
const log = (s: string) => { out += s + '\n'; console.log(s) }

// ─── Deep debug: L-Shape ───
// Polygon:
//   (0,0)───(5,0)
//     │        │
//     │      (5,3)───(8,3)
//     │               │
//   (0,6)────────────(8,6)
//
// Vertices (CCW): 0=(0,0) 1=(5,0) 2=(5,3) 3=(8,3) 4=(8,6) 5=(0,6)
//
// Edges:
//   E0: (0,0)→(5,0)  horizontal, normal should point inward (down → +y)
//   E1: (5,0)→(5,3)  vertical, normal should point inward (to left → -x)
//   E2: (5,3)→(8,3)  horizontal, normal should point inward (down → +y)
//   E3: (8,3)→(8,6)  vertical, normal should point inward (to left → -x)
//   E4: (8,6)→(0,6)  horizontal, normal should point inward (up → -y)
//   E5: (0,6)→(0,0)  vertical, normal should point inward (right → +x)
//
// Correct normals (inward):
//   E0: (0, 1)   (pointing down/into polygon)
//   E1: (-1, 0)  (pointing left/into polygon)
//   E2: (0, 1)   (pointing down/into polygon)
//   E3: (-1, 0)  (pointing left/into polygon)
//   E4: (0, -1)  (pointing up/into polygon)
//   E5: (1, 0)   (pointing right/into polygon)
//
// Bisectors at each vertex (sum of adjacent edge normals):
//   V0: nL=E5=(1,0), nR=E0=(0,1) → bisector=(1,1)/√2 → (0.707, 0.707) ← inward diagonal
//   V1: nL=E0=(0,1), nR=E1=(-1,0) → bisector=(-1,1)/√2 → (-0.707, 0.707) ← inward diagonal
//   V2: nL=E1=(-1,0), nR=E2=(0,1) → bisector=(-1,1)/√2 → (-0.707, 0.707) ← OUTWARD! concave vertex
//   V3: nL=E2=(0,1), nR=E3=(-1,0) → bisector=(-1,1)/√2 → (-0.707, 0.707) ← inward diagonal
//   V4: nL=E3=(-1,0), nR=E4=(0,-1) → bisector=(-1,-1)/√2 → (-0.707, -0.707) ← inward diagonal
//   V5: nL=E4=(0,-1), nR=E5=(1,0) → bisector=(1,-1)/√2 → (0.707, -0.707) ← inward diagonal
//
// Wait — V2 at (5,3) is a CONCAVE vertex. The bisector should point outward (away from polygon).
// For the correct skeleton, V2's bisector should find where it hits adjacEnt edges or
// bisectors that create a valley line.
//
// CORRECT SKELETON for L-shape:
//   - V0 (0,0) bisector → terminates at ridge point ~(2.5, 2.5)
//   - V1 (5,0) bisector → terminates at ridge point ~(2.5, 2.5)
//   - V2 (5,3) concave → valley line going diagonally into polygon
//   - V3 (8,3) bisector → terminates at ridge point ~(6.5, 4.5)
//   - V4 (8,6) bisector → terminates at ridge point ~(6.5, 4.5)
//   - V5 (0,6) bisector → connects via V2's valley
//
// The key insight is that at V2 (concave corner), the bisector goes at 45° toward (4,4), (3,5), ...
// This forms a VALLEY line. Along this valley, two roof planes from E1 and E2 meet.

const lShape = [
  { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 3 },
  { x: 8, y: 3 }, { x: 8, y: 6 }, { x: 0, y: 6 }
]

// Manually compute what the algorithm does
const n = lShape.length
const polygon = lShape

// 1. Centroid
let cx = 0, cy = 0
for (const p of polygon) { cx += p.x; cy += p.y }
cx /= n; cy /= n
log(`Centroid: (${cx.toFixed(2)}, ${cy.toFixed(2)})`)

// 2. Edge normals (default CCW: (-dy, dx))
const normals: { x: number; y: number }[] = []
for (let i = 0; i < n; i++) {
  const j = (i + 1) % n
  const dx = polygon[j].x - polygon[i].x
  const dy = polygon[j].y - polygon[i].y
  const len = Math.hypot(dx, dy)
  normals.push({ x: -dy / len, y: dx / len })
}
log('\nRaw normals:')
for (let i = 0; i < n; i++) {
  log(`  E${i}: (${normals[i].x.toFixed(3)}, ${normals[i].y.toFixed(3)})`)
}

// 3. Centroid test
const testDot = (cx - polygon[0].x) * normals[0].x + (cy - polygon[0].y) * normals[0].y
log(`\nCentroid test dot: ${testDot.toFixed(3)} (${testDot < 0 ? 'FLIP' : 'OK'})`)

if (testDot < 0) {
  for (let i = 0; i < normals.length; i++) {
    normals[i] = { x: -normals[i].x, y: -normals[i].y }
  }
  log('Flipped normals:')
  for (let i = 0; i < n; i++) {
    log(`  E${i}: (${normals[i].x.toFixed(3)}, ${normals[i].y.toFixed(3)})`)
  }
}

// 4. Bisectors
log('\nBisectors:')
for (let i = 0; i < n; i++) {
  const nL = normals[(i - 1 + n) % n]
  const nR = normals[i]
  const bx = nL.x + nR.x
  const by = nL.y + nR.y
  const bLen = Math.hypot(bx, by)
  const bisector = bLen < 1e-10 ? nL : { x: bx / bLen, y: by / bLen }
  
  // Check if vertex is convex or concave
  const cross = (polygon[(i+1)%n].x - polygon[i].x) * (polygon[(i-1+n)%n].y - polygon[i].y) -
                (polygon[(i+1)%n].y - polygon[i].y) * (polygon[(i-1+n)%n].x - polygon[i].x)
  
  log(`  V${i} (${polygon[i].x},${polygon[i].y}): bisector=(${bisector.x.toFixed(3)}, ${bisector.y.toFixed(3)}) [nL=E${(i-1+n)%n} nR=E${i}]`)
  
  // Check: project bisector a small distance, is result inside polygon?
  const testPt = { x: polygon[i].x + bisector.x * 0.1, y: polygon[i].y + bisector.y * 0.1 }
  log(`    Test point (${testPt.x.toFixed(2)},${testPt.y.toFixed(2)}) inside? ${pointInPolygon(testPt, polygon)}`)
}

// 5. Run skeleton and show results
log('\n=== SKELETON OUTPUT ===')
const result = computeStraightSkeleton(lShape)
log(`Faces: ${result.faces.length}, Arcs: ${result.arcs.length}`)
for (const f of result.faces) {
  const pts = f.polygon.map(p => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).join(' ')
  log(`  F${f.edgeIndex}: ${pts}`)
}
log('\nArcs:')
for (const a of result.arcs) {
  log(`  (${a.start.x.toFixed(2)},${a.start.y.toFixed(2)}) → (${a.end.x.toFixed(2)},${a.end.y.toFixed(2)})`)
}

function pointInPolygon(p: { x: number; y: number }, poly: { x: number; y: number }[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (
      poly[i].y > p.y !== poly[j].y > p.y &&
      p.x < ((poly[j].x - poly[i].x) * (p.y - poly[i].y)) / (poly[j].y - poly[i].y) + poly[i].x
    ) {
      inside = !inside
    }
  }
  return inside
}

fs.writeFileSync('skeleton_lshape_debug.txt', out)
log('\nWritten to skeleton_lshape_debug.txt')
