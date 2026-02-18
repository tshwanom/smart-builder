export interface Point3D {
  x: number
  y: number
  z: number
}

export interface Vector3D {
  x: number
  y: number
  z: number
}

export interface WallSegment {
  id: string
  start: Point3D
  end: Point3D
  thickness: number
  height: number
  storyId: string
  // For openings, we might need a separate collection or nested here
  openings?: string[] // IDs of openings
}

export interface Opening3D {
  id: string
  wallId: string
  width: number
  height: number
  sillHeight: number
  center: Point3D
  type: string // 'window' | 'door'
}

export interface RoofPlane3D {
  id: string
  vertices: Point3D[] // 3D polygon
  pitch: number
  material?: string
}

export interface BuildingLayer {
  id: string
  name: string
  elevation: number // Z-height from ground
  height: number    // Wall height for this layer
}

export interface ProjectGeometry {
  layers: BuildingLayer[]
  walls: WallSegment[]
  roofs: RoofPlane3D[]
  openings: Opening3D[]
}
