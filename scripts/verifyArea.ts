
interface Point { x: number, y: number }

function calculatePolygonArea(points: Point[]): number {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return area / 2 // Returns SIGNED area
}

// 1. Clockwise Square (Standard Canvas coords: Y-down)
// TL(0,0) -> TR(10,0) -> BR(10,10) -> BL(0,10) -> TL(0,0)
const cwSquare = [
    {x:0, y:0}, {x:10, y:0}, {x:10, y:10}, {x:0, y:10}
]

// 2. Counter-Clockwise Square
// TL(0,0) -> BL(0,10) -> BR(10,10) -> TR(10,0) -> TL(0,0)
const ccwSquare = [
    {x:0, y:0}, {x:0, y:10}, {x:10, y:10}, {x:10, y:0}
]

console.log('Clockwise Area:', calculatePolygonArea(cwSquare))
console.log('Counter-Clockwise Area:', calculatePolygonArea(ccwSquare))
