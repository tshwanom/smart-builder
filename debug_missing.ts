import { computeStraightSkeleton } from './src/modules/canvas/domain/geometry/analytics/StraightSkeleton'
import { Vec2 } from './src/modules/canvas/domain/geometry/analytics/types'

// L-shape: (0,0)(5,0)(5,3)(8,3)(8,6)(0,6)
const lPoly: Vec2[] = [
  {x:0,y:0},{x:5,y:0},{x:5,y:3},{x:8,y:3},{x:8,y:6},{x:0,y:6}
]

const result = computeStraightSkeleton(lPoly)

console.log('\n=== L-Shape Edges ===')
for (let i = 0; i < lPoly.length; i++) {
  const v1 = lPoly[i]
  const v2 = lPoly[(i + 1) % lPoly.length]
  const face = result.faces.find(f => f.edgeIndex === i)
  console.log(`E${i}: (${v1.x},${v1.y})→(${v2.x},${v2.y}) — ${face ? `Face with ${face.polygon.length} pts` : 'NO FACE'}`)
}
