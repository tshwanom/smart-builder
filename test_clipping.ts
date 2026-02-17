import * as polygonClipping from 'polygon-clipping'

// Test clipping an L-shape face to its eave polygon
const lShape = [
  { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 3 },
  { x: 8, y: 3 }, { x: 8, y: 6 }, { x: 0, y: 6 }
]

// The problematic face F4: (8,6) (6.5,4.5) (3,3) (0,6) - crosses concave area
const face4 = [
  { x: 8, y: 6 }, { x: 6.5, y: 4.5 }, { x: 3, y: 3 }, { x: 0, y: 6 }
]

// Prepare eave ring (closed)
const eaveRing: [number, number][] = lShape.map(p => [p.x, p.y])
eaveRing.push([lShape[0].x, lShape[0].y])

// Prepare face ring (closed)
const faceRing: [number, number][] = face4.map(p => [p.x, p.y])
faceRing.push([face4[0].x, face4[0].y])

console.log('Eave ring:', JSON.stringify(eaveRing))
console.log('Face ring:', JSON.stringify(faceRing))

const result = polygonClipping.intersection(
  [faceRing] as polygonClipping.Polygon,
  [eaveRing] as polygonClipping.Polygon
)

console.log('\nClipping result:')
if (result && result.length > 0) {
  for (const multi of result) {
    for (const ring of multi) {
      const pts = ring.map(([x, y]) => `(${x.toFixed(2)},${y.toFixed(2)})`).join(' ')
      console.log(`  Ring: ${pts}`)
    }
  }
} else {
  console.log('  No result!')
}

// Also test F5: (0,6) (3,3) (0,0) - another problematic face
const face5 = [
  { x: 0, y: 6 }, { x: 3, y: 3 }, { x: 0, y: 0 }
]
const faceRing5: [number, number][] = face5.map(p => [p.x, p.y])
faceRing5.push([face5[0].x, face5[0].y])

const result5 = polygonClipping.intersection(
  [faceRing5] as polygonClipping.Polygon,
  [eaveRing] as polygonClipping.Polygon
)

console.log('\nF5 Clipping result:')
if (result5 && result5.length > 0) {
  for (const multi of result5) {
    for (const ring of multi) {
      const pts = ring.map(([x, y]) => `(${x.toFixed(2)},${y.toFixed(2)})`).join(' ')
      console.log(`  Ring: ${pts}`)
    }
  }
} else {
  console.log('  No result!')
}
