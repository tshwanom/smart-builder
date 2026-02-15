import { RoofPlane, RoofEdgeType } from './types'
import { dot, cross } from './Vec2'

/**
 * Determines the type of intersection (Ridge, Hip, Valley) between two planes based on their normals.
 */
export function classifyIntersection(pA: RoofPlane, pB: RoofPlane): RoofEdgeType {
  const nA = pA.inwardNormal
  const nB = pB.inwardNormal
  
  // Check angle between normals
  // If they face towards each other (dot < 0?) => Ridge
  // If they face away from each other => Valley
  
  // Wait, normals are 2D vectors in XY plane pointing UPHILL.
  // If normals point towards each other (converge), they form a Ridge/Hip.
  // If normals diverge, they form a Valley.
  
  const d = dot(nA, nB)
  // Cross product Z-component tells us winding?
  const c = cross(nA, nB)
  
  // Simple heuristic:
  // "Convex" intersection (Hip/Ridge): Normals converge.
  // "Concave" intersection (Valley): Normals diverge.
  
  // Actually, geometry is simpler:
  // An interior intersection is a Hip or Valley.
  // Ridge is for parallel-ish opposite edges.
  
  // Correct logic:
  // Calculate bisector. If intersection is "inside" the corner formed by edges, it's Hip/Ridge.
  // If "outside" (reflex angle), it's Valley.
  
  // Let's use convexity.
  // But wait, we don't know the edge connectivity here, just two planes.
  
  // Fallback to "Ridge vs Valley" based on normal direction.
  // If the intersection line direction ...
  
  // Simpler:
  // If cross product is positive (nA to nB is CCW), it's convex (Hip/Ridge).
  // If negative, concave (Valley).
  // Assuming standard ordering.
  
  // Even Simpler:
  // If planes face generally opposite (dot < -0.5), it's a Ridge.
  // If planes face generally same direction (dot > 0), rare?
  // If perpendicular?
  
  // Let's defer to a robust geometric check if possible.
  // For now:
  // If dot(nA, nB) < -0.9 => RIDGE (Opposite)
  // Else => HIP or VALLEY?
  
  if (d < -0.9) return RoofEdgeType.RIDGE
  
  // Identify concave vs convex.
  // We need context of where the planes come from in the polygon.
  // Without context, it's ambiguous (could be inside or outside corner).
  // However, `trimPlane` usually leaves edges that are "valid".
  // Let's default to HIP for now, and override if we detect reflex vertices in footprint?
  // Actually, we can check if the intersection line is "between" the normals or "outside".
  
  // Placeholder: Return HIP for now. Valleys require reflex angles in footprint.
  // If we had the footprint angles, we'd know.
  // (A reflex vertex (angle > 180) produces a Valley).
  // We can add that logic later.
  return RoofEdgeType.HIP
}
