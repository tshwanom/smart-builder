export interface Vec2 {
  x: number
  y: number
}

// Vector operations
export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s }
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function cross(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x
}

export function len(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

export function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function normalize(v: Vec2): Vec2 {
  const l = len(v)
  if (l < 1e-12) return { x: 0, y: 0 }
  return { x: v.x / l, y: v.y / l }
}

export function eq(a: Vec2, b: Vec2, eps: number = 1e-6): boolean {
  return dist(a, b) < eps
}
