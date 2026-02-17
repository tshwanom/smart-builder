import { computeStraightSkeleton } from './src/modules/canvas/domain/geometry/analytics/StraightSkeleton'
import * as fs from 'fs'

const log = (s: string) => console.log(s)

// Plus Shape (CCW)
// Arms length 4, width 4. Center 4x4 box.
// Coordinates adjusted to be clear.
// Top Arm Top-Right: (2, 6)
const plusShape = [
  { x: 2, y: 6 },
  { x: -2, y: 6 },
  { x: -2, y: 2 },  // Reflex
  { x: -6, y: 2 },
  { x: -6, y: -2 },
  { x: -2, y: -2 }, // Reflex
  { x: -2, y: -6 },
  { x: 2, y: -6 },
  { x: 2, y: -2 },  // Reflex
  { x: 6, y: -2 },
  { x: 6, y: 2 },
  { x: 2, y: 2 }    // Reflex
]

log('=== RUNNING PLUS SHAPE REPRO ===')
const result = computeStraightSkeleton(plusShape)

log(`Generated ${result.faces.length} faces and ${result.arcs.length} arcs`)

// Check for face connectivity
let openFaces = 0
result.faces.forEach(f => {
  const pts = f.polygon
  if (pts.length < 3) {
    log(`Face ${f.edgeIndex} has <3 points!`)
    openFaces++
    return
  }
  const start = pts[0]
  const end = pts[pts.length - 1]
  const dist = Math.hypot(start.x - end.x, start.y - end.y)
  if (dist > 1e-3) {
    log(`Face ${f.edgeIndex} is OPEN. Gap: ${dist.toFixed(4)}`)
    openFaces++
  }
})

if (openFaces === 0) {
  log('All faces are closed.')
} else {
  log(`Found ${openFaces} OPEN faces.`)
}

// Check for suspicious crossing arcs (simple heuristic: bounding box)
// or just dump arcs to visualize mentally
log('\nArcs:')
result.arcs.forEach((a, i) => {
  log(`  Arc ${i}: (${a.start.x.toFixed(2)},${a.start.y.toFixed(2)}) -> (${a.end.x.toFixed(2)},${a.end.y.toFixed(2)}) [L${a.leftFace}|R${a.rightFace}]`)
})
