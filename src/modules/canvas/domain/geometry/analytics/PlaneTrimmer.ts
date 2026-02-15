import { RoofPlane, Vec2 } from './types'
import { PlaneClipper } from './PlaneClipper'

/**
 * Trims a single plane against all other planes in the set.
 * Returns the final polygon for this plane.
 */
export function trimPlane(
  targetIndex: number,
  planes: RoofPlane[],
  initialBoundary: Vec2[]
): Vec2[] {
  const target = planes[targetIndex]
  let currentPoly = [...initialBoundary] // Start with the global footprint/overhang

  for (let i = 0; i < planes.length; i++) {
    if (i === targetIndex) continue
    
    const other = planes[i]
    
    // Define the half-plane constraint: z_target(x,y) <= z_other(x,y)
    // equation: zT - zO <= 0
    // (hT + dT*sT) - (hO + dO*sO) <= 0
    
    // dT = dot(P - refT, nT)
    // dO = dot(P - refO, nO)
    
    // A*x + B*y + C <= 0
    
    const nT = target.inwardNormal
    const nO = other.inwardNormal
    const sT = target.slopeRise
    const sO = other.slopeRise
    
    const refT = target.baselineRef
    const refO = other.baselineRef
    
    const A = sT * nT.x - sO * nO.x
    const B = sT * nT.y - sO * nO.y
    
    const C = (target.baselineHeight - other.baselineHeight)
             - (sT * (refT.x * nT.x + refT.y * nT.y))
             + (sO * (refO.x * nO.x + refO.y * nO.y))
             
    // Clip
    if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) {
        // Parallel planes (same slope/direction)
        // If C > 0 => target is strictly above other. Removes everything.
        if (C > 1e-4) return []
        // Else target is below, keep everything (no constraint).
    } else {
        currentPoly = PlaneClipper.clipPolygon(currentPoly, A, B, C)
    }
    
    if (currentPoly.length < 3) return []
  }

  return currentPoly
}
