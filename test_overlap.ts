import * as polygonClipping from 'polygon-clipping'

// L-shape polygon
const lShape: [number, number][] = [[0,0],[5,0],[5,3],[8,3],[8,6],[0,6],[0,0]]

// Face F4 from skeleton: (0,6) (3,3) (6.5,4.5) (8,6)
const f4: [number, number][] = [[0,6],[3,3],[6.5,4.5],[8,6],[0,6]]

// Does the edge (3,3)→(6.5,4.5) cross outside the L polygon?
// At x=5, the edge (3,3)→(6.5,4.5) has y = 3 + (4.5-3)*(5-3)/(6.5-3) = 3 + 1.5*2/3.5 = 3 + 0.857 = 3.857
// At x=5 in the L-shape, the boundary is:
//   - Top of lower wing: y=3 (edge from (5,3) to (8,3))
//   - Bottom of upper wing: y=6 (edge from (0,6) to (8,6))
// Wait, but at x=5, the L-shape has:
//   - Left rectangle: x=0..5, y=0..6  
//   - Right rectangle: x=5..8, y=3..6
// So at x=5, valid y range is 0..6 (full height of left rectangle)
// The edge from (3,3) to (6.5,4.5) at x=5 gives y≈3.86 which IS inside.
// 
// Hmm, the L-shape polygon covers ALL of 0≤x≤5, 0≤y≤6
// So (3,3) to (6.5,4.5) passes through x=5 at y≈3.86, which is inside because
// at x=5, the L-shape includes y=0 to y=6.
// At x=5.5, the L-shape only includes y=3 to y=6. Edge gives y≈3.86+0.5*(1.5/3.5)≈4.07, which IS inside.
// 
// So actually the face F4 IS entirely inside the L-shape! The problem is not clipping,
// but that the face is too LARGE and covers area that should belong to other faces.

console.log('=== Face F4 intersection with L-shape ===')
const result = polygonClipping.intersection([f4], [lShape])
console.log('Result:', JSON.stringify(result))

// Check: does face F4 overlap with face F2?
// F2: (5,3) (4,4) (6.5,4.5) (8,3) - these together should tile the L-shape
const f2: [number, number][] = [[5,3],[4,4],[6.5,4.5],[8,3],[5,3]]
const overlap = polygonClipping.intersection([f4], [f2])
console.log('\nF4∩F2 overlap:', JSON.stringify(overlap))
if (overlap && overlap.length > 0) {
  const overlapArea = shoelaceArea(overlap[0][0])
  console.log(`Overlap area: ${overlapArea.toFixed(4)}`)
}

// Check: does face F4 overlap with face F1?
const f1: [number, number][] = [[5,0],[2.5,2.5],[4,4],[5,3],[5,0]]
const overlap1 = polygonClipping.intersection([f4], [f1])
console.log('\nF4∩F1 overlap:', JSON.stringify(overlap1))
if (overlap1 && overlap1.length > 0) {
  const overlapArea = shoelaceArea(overlap1[0][0])
  console.log(`Overlap area: ${overlapArea.toFixed(4)}`)
}

function shoelaceArea(ring: [number, number][]): number {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i+1][1] - ring[i+1][0] * ring[i][1]
  }
  return Math.abs(a) / 2
}
