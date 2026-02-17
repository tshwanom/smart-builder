import { Vec2 } from './src/modules/canvas/domain/geometry/analytics/types'

// Helpers
function subtract(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y } }
function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y)
  return len > 1e-10 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 }
}
function dot(a: Vec2, b: Vec2): number { return a.x * b.x + a.y * b.y }
function isBetween(p: Vec2, a: Vec2, b: Vec2): boolean {
  const ab = subtract(b, a)
  const ap = subtract(p, a)
  const dotVal = dot(ap, ab)
  const abLenSq = dot(ab, ab)
  return dotVal >= -1e-4 && dotVal <= abLenSq + 1e-4
}

const userPoly: Vec2[] = [
  {x:11,y:2},{x:11,y:-2},{x:15,y:-2},{x:15,y:2},
  {x:17,y:2},{x:17,y:7},{x:15,y:7},{x:15,y:9},
  {x:11,y:9},{x:11,y:7},{x:8,y:7},{x:8,y:2}
]

// Simulate V6
const v6Idx = 6
const v6 = userPoly[v6Idx]
const v6Bisector = { x: -1, y: -1 } // Known correct

console.log(`Debug V6 Split Candidates. Point: (${v6.x}, ${v6.y}), B: (${v6Bisector.x}, ${v6Bisector.y})`)

for (let i = 0; i < userPoly.length; i++) {
  const curr = userPoly[i]
  const next = userPoly[(i + 1) % userPoly.length]
  const edgeVec = normalize(subtract(next, curr))
  const edgeNormal = { x: -edgeVec.y, y: edgeVec.x }
  
  // Need bisectors for edge endpoints to check bounds at time T
  // Let's assume standard bisectors for simplicity, or just check line intersection first
  // Standard convex bisector speed is roughly 1.414 or 1.0 depending on angle
  // Let's assume edge moves strictly by normal
  
  const C_e = dot(edgeNormal, curr)
  const numer = C_e - dot(edgeNormal, v6)
  const denom = dot(edgeNormal, v6Bisector) - 1
  
  if (Math.abs(denom) > 1e-8) {
    const t = numer / denom
    const intersectPt = {
      x: v6.x + t * v6Bisector.x,
      y: v6.y + t * v6Bisector.y
    }
    console.log(`Edge ${i} [(${curr.x},${curr.y})->(${next.x},${next.y})]: t=${t.toFixed(4)} Pt=(${intersectPt.x.toFixed(2)}, ${intersectPt.y.toFixed(2)})`)
  } else {
    // console.log(`Edge ${i}: Parallel`)
  }
}
