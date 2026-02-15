export interface Vec2 {
  x: number
  y: number
}

export interface RoofPlane {
  id: string
  baseline: [Vec2, Vec2]
  baselineRef: Vec2
  baselineHeight: number
  inwardNormal: Vec2
  slopeRise: number // tan(pitch)
  trimmedPolygon?: Vec2[] // The final visible polygon
  area?: number
  // Geometric Equation: ax + by + cz + d = 0
  // Normal (a,b,c) points UP (out of roof)
  equation: { a: number, b: number, c: number, d: number }
}

// Edge types derived from plane trimming
export enum RoofEdgeType {
  EAVE = 'EAVE',
  RIDGE = 'RIDGE',
  VALLEY = 'VALLEY',
  HIP = 'HIP',
  GABLE = 'GABLE'
}

export interface RoofEdge {
  start: Vec2
  end: Vec2
  type: RoofEdgeType
  planeA: string // ID of plane A
  planeB?: string // ID of plane B (if shared)
}

export interface RoofGeometry {
  planes: RoofPlane[]
  edges: RoofEdge[]
  
  // Specific geometry for rendering
  ridges: { start: Vec2; end: Vec2 }[]
  hips: { start: Vec2; end: Vec2 }[]
  valleys: { start: Vec2; end: Vec2 }[]
  eaves: { start: Vec2; end: Vec2 }[]
  slopeArrows: { position: Vec2; vector: Vec2; text: string }[]
}
