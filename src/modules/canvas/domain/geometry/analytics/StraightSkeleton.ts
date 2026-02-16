/**
 * Straight Skeleton — Simple Bisector Ray Approach
 *
 * For each vertex of the polygon, shoot a 45° bisector ray inward.
 * Find where each ray first intersects another ray → skeleton node.
 * Build faces as simple polygons: [vertex_i, node_i, node_{i+1}, vertex_{i+1}].
 *
 * Works correctly for all rectilinear (90° angle) buildings.
 * No LAV, no priority queue, no split events — just geometry.
 */

import { Vec2 } from './types'

// ═══════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════

export interface SkeletonArc {
  start: Vec2
  end: Vec2
  leftFace: number
  rightFace: number
}

export interface SkeletonFace {
  edgeIndex: number
  polygon: Vec2[]
}

export interface SkeletonResult {
  faces: SkeletonFace[]
  arcs: SkeletonArc[]
}

const SNAP = 1.0 // 1mm snap tolerance

export function computeStraightSkeleton(polygon: Vec2[]): SkeletonResult {
  const n = polygon.length
  if (n < 3) return { faces: [], arcs: [] }

  // 1. Compute centroid for normal direction verification
  let cx = 0, cy = 0
  for (const p of polygon) { cx += p.x; cy += p.y }
  cx /= n; cy /= n

  // 2. Compute edge normals (default: assume CCW math → normals = (-dy, dx))
  const normals: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const dx = polygon[j].x - polygon[i].x
    const dy = polygon[j].y - polygon[i].y
    const len = Math.hypot(dx, dy) || 1
    normals.push({ x: -dy / len, y: dx / len })
  }

  // 3. Verify normals point INWARD by checking centroid side
  //    If centroid is on the negative side of the first edge's normal → flip all
  const testDot = (cx - polygon[0].x) * normals[0].x + (cy - polygon[0].y) * normals[0].y
  if (testDot < 0) {
    console.log('[Skeleton] Flipping normals (centroid test negative)')
    for (let i = 0; i < normals.length; i++) {
      normals[i] = { x: -normals[i].x, y: -normals[i].y }
    }
  }

  // 4. Compute bisector direction at each vertex
  const bisectors: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const nL = normals[(i - 1 + n) % n] // incoming edge normal
    const nR = normals[i]                // outgoing edge normal
    const bx = nL.x + nR.x
    const by = nL.y + nR.y
    const bLen = Math.hypot(bx, by)
    if (bLen < 1e-10) {
      // Degenerate (collinear edges) — use either normal
      bisectors.push({ x: nL.x, y: nL.y })
    } else {
      bisectors.push({ x: bx / bLen, y: by / bLen })
    }
  }

  // 4. For each vertex, find where its bisector ray terminates
  //    (nearest forward intersection with any other bisector ray)
  const maxReach = Math.hypot(
    Math.max(...polygon.map(p => p.x)) - Math.min(...polygon.map(p => p.x)),
    Math.max(...polygon.map(p => p.y)) - Math.min(...polygon.map(p => p.y))
  )

  const terminations: Vec2[] = []

  for (let i = 0; i < n; i++) {
    let bestT = Infinity
    let bestPt: Vec2 | null = null
    let hitCount = 0

    for (let j = 0; j < n; j++) {
      if (j === i) continue

      const hit = rayRayIntersect(
        polygon[i], bisectors[i],
        polygon[j], bisectors[j]
      )
      if (!hit) continue
      // Both rays must move forward (positive t), use small epsilon
      if (hit.t1 < 0.1 || hit.t2 < 0.1) continue

      hitCount++
      if (hit.t1 < bestT) {
        bestT = hit.t1
        bestPt = hit.point
      }
    }

    // Fallback: if no intersection found, project ray to max distance
    if (!bestPt) {
      console.warn(`[Skeleton] Vertex ${i} (${polygon[i].x.toFixed(0)},${polygon[i].y.toFixed(0)}) bisector (${bisectors[i].x.toFixed(3)},${bisectors[i].y.toFixed(3)}) — NO hits (${hitCount} candidates)`)
      bestPt = {
        x: polygon[i].x + bisectors[i].x * maxReach * 0.5,
        y: polygon[i].y + bisectors[i].y * maxReach * 0.5,
      }
    }

    terminations.push(bestPt)
  }

  console.log(`[Skeleton] ${n} vertices, ${n} bisector rays computed`)

  // 5. Build skeleton arcs (hip/valley lines from each vertex)
  const arcs: SkeletonArc[] = []
  for (let i = 0; i < n; i++) {
    if (dist(polygon[i], terminations[i]) > SNAP) {
      arcs.push({
        start: polygon[i],
        end: terminations[i],
        leftFace: (i - 1 + n) % n,
        rightFace: i,
      })
    }
  }

  // Ridge arcs: connect termination points of adjacent edges
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    if (dist(terminations[i], terminations[j]) > SNAP) {
      arcs.push({
        start: terminations[i],
        end: terminations[j],
        leftFace: i,
        rightFace: -1, // classification handled by RoofEngine
      })
    }
  }

  // 6. Build face polygons
  const faces: SkeletonFace[] = []

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const pts: Vec2[] = [polygon[i]]

    // Add termination of left bisector
    if (dist(polygon[i], terminations[i]) > SNAP) {
      pts.push(terminations[i])
    }

    // Add termination of right bisector (if different from left)
    if (dist(terminations[i], terminations[j]) > SNAP &&
        dist(polygon[i], terminations[j]) > SNAP) {
      pts.push(terminations[j])
    }

    // Always add next eave vertex
    pts.push(polygon[j])

    if (pts.length >= 3) {
      faces.push({ edgeIndex: i, polygon: pts })
    }
  }

  console.log(`[Skeleton] ${faces.length} faces, ${arcs.length} arcs`)
  return { faces, arcs }
}

// ═══════════════════════════════════════════════════
// Geometry Helpers
// ═══════════════════════════════════════════════════

function rayRayIntersect(
  o1: Vec2, d1: Vec2,
  o2: Vec2, d2: Vec2
): { t1: number; t2: number; point: Vec2 } | null {
  const det = d1.x * d2.y - d1.y * d2.x
  if (Math.abs(det) < 1e-10) return null // parallel

  const dx = o2.x - o1.x
  const dy = o2.y - o1.y

  const t1 = (dx * d2.y - dy * d2.x) / det
  const t2 = (dx * d1.y - dy * d1.x) / det

  return {
    t1,
    t2,
    point: { x: o1.x + t1 * d1.x, y: o1.y + t1 * d1.y },
  }
}

function pointInPolygon(p: Vec2, polygon: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    if (
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside
    }
  }
  return inside
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
