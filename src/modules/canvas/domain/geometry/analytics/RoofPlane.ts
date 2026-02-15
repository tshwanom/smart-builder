import { RoofPlane, Vec2 } from './types'
import { sub, normalize, dot } from './Vec2'

/**
 * Creates a RoofPlane definition from a footprint edge.
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
  // Assuming Y-Down CCW Polygon:
  // Edge Vector (dx, dy). Inward Normal is Left: (dy, -dx)
  let normal = { x: edgeVec.y, y: -edgeVec.x }
  normal = normalize(normal)
  
  // Convert Pitch to Slope (Rise/Run)
  // pitch is in degrees. slope = tan(pitch)
  const slopeRise = Math.tan(pitchDegrees * Math.PI / 180)
  
  return {
    id: `plane-${index}`,
    baseline: [start, end],
    baselineRef: start, // Can be any point on the line
    baselineHeight,
    inwardNormal: normal,
    slopeRise,
    trimmedPolygon: [], // Initially empty, will conform to footprint
    equation: calculatePlaneEquation(start, normal, slopeRise, baselineHeight)
  }
}

function calculatePlaneEquation(ref: Vec2, normal2D: Vec2, slope: number, height: number): { a: number, b: number, c: number, d: number } {
    // 3D Normal Construction
    // 2D Normal (nx, ny) points INWARD (Up the slope).
    // Slope s = rise/run.
    // The vector pointing UP the roof is (nx, ny, s).
    // The vector along the eave is (-ny, nx, 0).
    // The actual Plane Normal (perpendicular to surface) can be found by cross product.
    // U = (nx, ny, s)
    // V = (-ny, nx, 0)
    // N = V x U = (nx*s - 0, 0 - (-ny*s), -ny*ny - nx*nx)
    // N = (s*nx, s*ny, -1)   (Since nx^2 + ny^2 = 1)
    
    // So Normal N = (s*nx, s*ny, -1)
    // Equation: A*x + B*y + C*z + D = 0
    
    // A = s * nx
    // B = s * ny
    // C = -1
    
    // Find D using a point on the plane.
    // Point P = (ref.x, ref.y, height) lies on the plane.
    // A*px + B*py + C*pz + D = 0
    // D = -(A*px + B*py + C*pz)
    
    const A = slope * normal2D.x
    const B = slope * normal2D.y
    const C = -1
    
    const D = -(A * ref.x + B * ref.y + C * height)
    
    // Normalize? Not strictly necessary for intersections but good practice
    // const len = Math.sqrt(A*A + B*B + C*C)
    // return { a: A/len, b: B/len, c: C/len, d: D/len }
    
    return { a: A, b: B, c: C, d: D }
}

/**
 * Evaluates the Z-height of a plane at a given (x, y) point.
 * z = baselineHeight + (dist_from_baseline) * slopeRise
 * dist = dot(P - baselineRef, inwardNormal)
 */
export function evalPlaneZ(plane: RoofPlane, p: Vec2): number {
  const dist = dot(sub(p, plane.baselineRef), plane.inwardNormal)
  return plane.baselineHeight + dist * plane.slopeRise
}
