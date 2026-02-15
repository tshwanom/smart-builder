import { Vec2, sub, cross, add, scale, len } from './Vec2'

export interface Line2D {
  origin: Vec2
  dir: Vec2 // Normalized direction
}

const EPS = 1e-9

/**
 * Intersect two infinite lines: P + t*DirP and Q + u*DirQ
 */
export function lineLineIntersection(L1: Line2D, L2: Line2D): Vec2 | null {
  const p = L1.origin
  const r = L1.dir
  const q = L2.origin
  const s = L2.dir
  
  const rxs = cross(r, s)
  if (Math.abs(rxs) < EPS) return null // Parallel
  
  const qmp = sub(q, p)
  const t = cross(qmp, s) / rxs
  
  return add(p, scale(r, t))
}

/**
 * Intersect two segments: p-p2 and q-q2
 */
export function segSegIntersection(p: Vec2, p2: Vec2, q: Vec2, q2: Vec2): Vec2 | null {
  const r = sub(p2, p)
  const s = sub(q2, q)
  
  const rxs = cross(r, s)
  const qmp = sub(q, p)
  
  if (Math.abs(rxs) < EPS) return null
  
  const t = cross(qmp, s) / rxs
  const u = cross(qmp, r) / rxs
  
  if (t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS) {
      return add(p, scale(r, t))
  }
  
  return null
}
