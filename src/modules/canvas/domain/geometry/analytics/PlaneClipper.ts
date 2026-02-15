import { Vec2 } from './types'

// Small epsilon for floating point comparisons
const EPS = 1e-9

export class PlaneClipper {
  /**
   * Clips a polygon against a half-plane defined by Ax + By + C <= 0.
   */
  static clipPolygon(polygon: Vec2[], A: number, B: number, C: number): Vec2[] {
    const inputList = polygon.slice()
    const result: Vec2[] = []
    
    if (inputList.length < 3) return []

    // Ensure polygon is closed for iteration (or handle S=last)
    // We use S=last approach
    
    const isInside = (p: Vec2) => (A * p.x + B * p.y + C) <= EPS

    // Intersection of segment p1-p2 with line Ax+By+C=0
    // t = -(Ax1 + By1 + C) / (A(x2-x1) + B(y2-y1))
    const intersection = (p1: Vec2, p2: Vec2): Vec2 => {
      const num = -(A * p1.x + B * p1.y + C)
      const den = A * (p2.x - p1.x) + B * (p2.y - p1.y)
      if (Math.abs(den) < EPS) return p1 // Parallel? Should not happen if one inside one outside
      const t = num / den
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      }
    }

    let S = inputList[inputList.length - 1]

    for (const E of inputList) {
      if (isInside(E)) {
        if (!isInside(S)) {
          result.push(intersection(S, E))
        }
        result.push(E)
      } else if (isInside(S)) {
        result.push(intersection(S, E))
      }
      S = E
    }

    return result
  }

  // Helper to compute area
  static polygonArea(points: Vec2[]): number {
    let area = 0
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length
        area += points[i].x * points[j].y
        area -= points[j].x * points[i].y
    }
    return Math.abs(area) / 2
  }
}
