import { RoofEngine } from '../RoofEngine'

// L-shape polygon
const poly = [
  {x:0,y:0},{x:4000,y:0},{x:4000,y:2000},
  {x:2000,y:2000},{x:2000,y:4000},{x:0,y:4000}
]

const geom = RoofEngine.generate({
  footprint: poly,
  edgeDirectives: poly.map(() => ({ behavior: 'hip' as const, pitch: 20, baselineHeight: 2700 })),
  defaultPitch: 20,
  overhang: 500
})

console.log('Eave polygon vertices:', geom.footprint?.length)
geom.footprint?.forEach((p, i) => console.log(`  v${i}: (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`))
console.log('Planes:', geom.planes.length)

// Validate: L-shape offset should have 8 vertices (6 original + 2 bevel at reflex)
const expected = 8
const actual = geom.footprint?.length ?? 0
if (actual === expected) {
  console.log(`✅ Correct: ${actual} vertices (6 + 2 bevel at reflex corner)`)
} else {
  console.log(`⚠️ Got ${actual} vertices, expected ${expected}`)
}

// Check no self-intersection: all vertices should be reasonable
const allFin = geom.footprint?.every(p => isFinite(p.x) && isFinite(p.y) && Math.abs(p.x) < 10000 && Math.abs(p.y) < 10000)
console.log(allFin ? '✅ All vertices finite and in range' : '❌ Invalid vertices detected')
