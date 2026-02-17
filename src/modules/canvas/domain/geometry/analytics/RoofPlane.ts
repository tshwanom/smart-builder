import { RoofPlane, Vec2 } from './types'
import { sub, normalize, dot } from './Vec2'

/**
 * Creates a RoofPlane definition from a footprint edge.
 * 
 * Convention (Y-Down Screen Coords, CCW-math / CW-screen Polygon):
 *   Edge Vector: (dx, dy) = end - start
 *   Inward Normal: (-dy, dx) normalised — RIGHT of edge in screen space
 *   
 * @param index Identifiable index for the plane.
 * @param start Start point of the edge (CCW).
 * @param end End point of the edge (CCW).
 * @param baselineHeight Z-height of the eave line.
 * @param pitchDegrees Roof pitch in degrees.
 */
export function createRoofPlane(
  index: number | string,
  start: Vec2,
  end: Vec2,
  baselineHeight: number,
  pitchDegrees: number
): RoofPlane {
  const edgeVec = sub(end, start)
  
  // Inward Normal for CW-on-screen polygon (CCW in math):
  // (-dy, dx) = RIGHT of edge direction in Y-down screen coords = INWARD
  let normal = { x: -edgeVec.y, y: edgeVec.x }
  normal = normalize(normal)
  
  // Convert Pitch to Slope (Rise/Run)
  const slopeRise = Math.tan(pitchDegrees * Math.PI / 180)
  
  return {
    id: `plane-${index}`,
    baseline: [start, end],
    baselineRef: start,
    baselineHeight,
    inwardNormal: normal,
    slopeRise,
    trimmedPolygons: [], // Multi-polygon (initially empty, set by RoofEngine)
    equation: calculatePlaneEquation(start, normal, slopeRise, baselineHeight),
    footprintEdgeIndex: typeof index === 'number' ? index : undefined // NEW: Store edge index for adjacency detection
  }
}

function calculatePlaneEquation(ref: Vec2, normal2D: Vec2, slope: number, height: number): { a: number, b: number, c: number, d: number } {
    // 3D Plane Normal:
    // The roof surface rises along inwardNormal at rate `slope`.
    // Surface normal N = (slope*nx, slope*ny, -1)
    // Equation: A*x + B*y + C*z + D = 0
    
    const A = slope * normal2D.x
    const B = slope * normal2D.y
    const C = -1
    
    // Point on plane: (ref.x, ref.y, height)
    const D = -(A * ref.x + B * ref.y + C * height)
    
    return { a: A, b: B, c: C, d: D }
}

/**
 * Evaluates the Z-height of a plane at a given (x, y) point.
 * z = baselineHeight + dot(P - baselineRef, inwardNormal) * slopeRise
 */
export function evalPlaneZ(plane: RoofPlane, p: Vec2): number {
  const dist = dot(sub(p, plane.baselineRef), plane.inwardNormal)
  return plane.baselineHeight + dist * plane.slopeRise
}
