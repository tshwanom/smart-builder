
import { Point } from '@/modules/canvas/application/types'

// Simple Manhattan Routing for Volume 14
// In future volumes, this can be upgraded to A* with wall collision awareness
export const RoutingEngine = {
  
  /**
   * Calculates the orthogonal (Manhattan) distance between two points.
   * Adds penalties/vertical drops based on context.
   */
  calculateRouteLength(start: Point, end: Point, verticalDrop: number = 0): number {
    const dx = Math.abs(start.x - end.x)
    const dy = Math.abs(start.y - end.y)
    
    // Manhattan distance: x + y
    // We add vertical drops (e.g. from ceiling to switch, or floor to socket)
    return dx + dy + verticalDrop
  },

  /**
   * Generates a set of points representing the orthogonal path
   * Useful for generating schematic views in the Engineer Modal
   */
  getRoutePath(start: Point, end: Point): Point[] {
    // Simple L-shape route for now
    // Start -> Corner -> End
    return [
      start,
      { x: end.x, y: start.y }, // Corner 1 (Horizontal then Vertical)
      end
    ]
  },
  
  /**
   * Groups points by room for optimized daisy-chaining
   * (Traveling Salesman heuristic)
   */
  sortPointsByProximity(points: Point[]): Point[] {
     if (points.length <= 1) return points
     
     const sorted: Point[] = [points[0]]
     const remaining = [...points.slice(1)]
     
     while (remaining.length > 0) {
         const last = sorted[sorted.length - 1]
         let nearestIndex = 0
         let minDist = Number.MAX_VALUE
         
         remaining.forEach((p, idx) => {
             const dist = Math.hypot(p.x - last.x, p.y - last.y)
             if (dist < minDist) {
                 minDist = dist
                 nearestIndex = idx
             }
         })
         
         sorted.push(remaining[nearestIndex])
         remaining.splice(nearestIndex, 1)
     }
     
     return sorted
  }
}
