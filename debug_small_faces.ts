import { computeStraightSkeleton } from './src/modules/canvas/domain/geometry/analytics/StraightSkeleton'
import { Vec2 } from './src/modules/canvas/domain/geometry/analytics/types'

// User building polygon (cross shape)
const userPoly: Vec2[] = [
  {x:11,y:2},{x:11,y:-2},{x:15,y:-2},{x:15,y:2},
  {x:17,y:2},{x:17,y:7},{x:15,y:7},{x:15,y:9},
  {x:11,y:9},{x:11,y:7},{x:8,y:7},{x:8,y:2}
]

const result = computeStraightSkeleton(userPoly)

console.log('\n=== User Building Faces ===')
for (const face of result.faces) {
  const area = Math.abs(polygonArea(face.polygon))
  const pts = face.polygon.map(p => `(${p.x.toFixed(1)},${p.y.toFixed(1)})`).join(' ')
  console.log(`F${face.edgeIndex}: area=${area.toFixed(2)} — ${pts}`)
}

function polygonArea(points: Vec2[]): number {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return area / 2
}

console.log('\n=== Small Faces (area < 3) ===')
result.faces.filter(f => Math.abs(polygonArea(f.polygon)) < 3).forEach(f => {
  const area = Math.abs(polygonArea(f.polygon))
  console.log(`F${f.edgeIndex}: area=${area.toFixed(2)} — TOO SMALL`)
})
