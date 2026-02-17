import { Vec2 } from './types'

/**
 * Utility class for polygon calculations used by the roof system.
 */
export class PlaneClipper {
  /** Compute the area of a polygon using the shoelace formula */
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
