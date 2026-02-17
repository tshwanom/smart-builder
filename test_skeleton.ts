import { computeStraightSkeleton } from './src/modules/canvas/domain/geometry/analytics/StraightSkeleton'
import * as fs from 'fs'

const rect = [
  { x: 0, y: 0 }, { x: 4000, y: 0 },
  { x: 4000, y: 3000 }, { x: 0, y: 3000 }
]

const hShape = [
  { x: 0, y: 0 }, { x: 3700, y: 0 },
  { x: 3700, y: 2500 }, { x: 6100, y: 2500 },
  { x: 6100, y: 0 }, { x: 10000, y: 0 },
  { x: 10000, y: 7000 }, { x: 6100, y: 7000 },
  { x: 6100, y: 4500 }, { x: 3700, y: 4500 },
  { x: 3700, y: 7000 }, { x: 0, y: 7000 },
]

let out = ''
const log = (s: string) => { out += s + '\n'; console.log(s) }

log('=== RECTANGLE ===')
const r1 = computeStraightSkeleton(rect)
log(`Faces: ${r1.faces.length}, Arcs: ${r1.arcs.length}`)
for (const f of r1.faces) {
  const pts = f.polygon.map(p => `(${Math.round(p.x)},${Math.round(p.y)})`).join(' ')
  log(`  F${f.edgeIndex}: ${pts}`)
}

log('\n=== H-SHAPE ===')
const r2 = computeStraightSkeleton(hShape)
log(`Faces: ${r2.faces.length}, Arcs: ${r2.arcs.length}`)
for (const f of r2.faces) {
  const pts = f.polygon.map(p => `(${Math.round(p.x)},${Math.round(p.y)})`).join(' ')
  log(`  F${f.edgeIndex}: ${pts}`)
}

fs.writeFileSync('skeleton_test_output.txt', out)
log('\nWritten to skeleton_test_output.txt')
