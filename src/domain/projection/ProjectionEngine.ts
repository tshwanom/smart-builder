import { Point3D, Vector3D } from '../types'

export interface Point2D {
  x: number
  y: number
}

export interface ProjectionSettings {
  scale: number
  offsetX: number
  offsetY: number
}

/**
 * Projects a 3D point to a 2D plan view (Top-Down).
 * @param point The 3D point to project
 * @param settings Display settings (scale, pan)
 * @returns 2D coordinates
 */
export function projectToPlan(point: Point3D, settings: ProjectionSettings): Point2D {
  // Plan view ignores Z
  // Screen X = (World X * Scale) + Offset X
  // Screen Y = (World Y * Scale) + Offset Y  (Assuming Y-down screen, Y-up world? Need to clarify coord system)
  // Standard CAD: World Y is UP (Plan "North"), Screen Y is DOWN. 
  // Let's assume input Point3D is standard Cartesian (X right, Y up/forward, Z vertical).
  // If Plan is X-Y plane: 
  // ScreenX = point.x * scale + offsetX
  // ScreenY = -point.y * scale + offsetY // Flip Y for screen coords
  
  return {
    x: point.x * settings.scale + settings.offsetX,
    y: point.y * settings.scale + settings.offsetY // Keeping simple 1:1 for now, will refine based on coord system convention
  }
}

/**
 * Projects a 3D point to an Elevation view.
 * @param point The 3D point
 * @param viewAngle Angle in degrees of the view direction (0 = looking North/Up)
 * @param origin The center point of the view in 3D
 */
export function projectToElevation(point: Point3D, viewAngle: number, settings: ProjectionSettings): Point2D {
  // Convert angle to radians
  const rad = viewAngle * Math.PI / 180
  const viewDir: Vector3D = { x: Math.sin(rad), y: Math.cos(rad), z: 0 }
  
  // View Plane Right Vector (Perpendicular to View Dir)
  // If ViewDir is (0, 1) [North], Right is (1, 0)
  const rightDir: Vector3D = { x: Math.cos(rad), y: -Math.sin(rad), z: 0 }
  
  // Project point onto Right Vector for Screen X
  // Screen X = dot(point, rightDir)
  const localX = point.x * rightDir.x + point.y * rightDir.y
  
  // Screen Y is Z (Height)
  // Screen Y = -point.z (Y-down screen)
  const localY = -point.z 
  
  return {
    x: localX * settings.scale + settings.offsetX,
    y: localY * settings.scale + settings.offsetY
  }
}

/**
 * Projects a 3D point to a Section view.
 * Section view is similar to Elevation, but typically defined by a cutting plane.
 * For simplicity, we treat it as an Elevation View from a specific angle for now.
 * True section logic (cutting geometry) requires boolean operations in a separate engine.
 * @param point The 3D point to project
 * @param cutPlaneNormal Normal vector of the section cut plane
 * @param settings Display settings
 */
export function projectToSection(point: Point3D, cutPlaneAngle: number, settings: ProjectionSettings): Point2D {
    // This is effectively an elevation view from the cut angle
    return projectToElevation(point, cutPlaneAngle, settings)
}
