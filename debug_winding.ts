import { Vec2 } from './src/modules/canvas/domain/geometry/analytics/types'

// Helpers
function cross(a: Vec2, b: Vec2): number { return a.x * b.y - a.y * b.x }
function signedArea(pts: Vec2[]): number {
  let area = 0
  for(let i=0; i<pts.length; i++) area += cross(pts[i], pts[(i+1)%pts.length])
  return area / 2
}

const userPoly: Vec2[] = [
  {x:11,y:2},{x:11,y:-2},{x:15,y:-2},{x:15,y:2},
  {x:17,y:2},{x:17,y:7},{x:15,y:7},{x:15,y:9},
  {x:11,y:9},{x:11,y:7},{x:8,y:7},{x:8,y:2}
]

const area = signedArea(userPoly)
console.log(`Signed Area: ${area}`)
console.log(`Winding: ${area > 0 ? 'CCW' : 'CW'}`)
