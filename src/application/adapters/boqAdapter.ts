import { ProjectGeometry } from '../../domain/types'
import { BOQCalculationInput, Opening } from '../../core/engine/boq-calculators/types'

/**
 * Adapts the 3D Project Geometry into the input format required by the legacy BOQ Calculator.
 * @param geometry The 3D project geometry
 * @returns Partial BOQ input covering walls, openings, and basic areas.
 */
export function adaptGeometryToBOQInput(geometry: ProjectGeometry): Partial<BOQCalculationInput> {
  const { walls, openings, roofs } = geometry

  // 1. Calculate Wall Metrics
  let totalWallLength = 0
  let totalWallArea = 0
  
  walls.forEach(wall => {
    // Length in 3D (horizontal distance)
    const dx = wall.end.x - wall.start.x
    const dy = wall.end.y - wall.start.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    totalWallLength += length
    totalWallArea += length * wall.height
  })

  // 2. Map Openings
  const mappedOpenings: Opening[] = openings.map(o => ({
    id: o.id,
    type: o.type as any,
    width: o.width,
    height: o.height,
    sillHeight: o.sillHeight,
    wallId: o.wallId,
    position: 0, // Not used for BOQ
    storyId: undefined,
    subtype: 'single', // Default
    panels: 1,
    openPercentage: 0,
    flipSide: 'left',
    hingeType: 'standard',
    frameThickness: 0.05,
    openingAngle: 0
  } as Opening))

  // 3. Roof - rudimentary mapping
  // If we have roofs, we assume pitched unless specified otherwise
  const hasPitchedRoof = roofs.some(r => r.pitch > 0)
  const roofType = hasPitchedRoof ? 'gable' : 'flat'
  const avgPitch = hasPitchedRoof 
    ? roofs.reduce((acc, r) => acc + r.pitch, 0) / roofs.length 
    : 0

  return {
    wallLength: totalWallLength,
    wallArea: totalWallArea,
    // Floor area hard to derive without rooms/slabs in geometry yet.
    // We'll set 0 or expect it to be merged from another source.
    floorArea: 0, 
    openings: mappedOpenings,
    roofType,
    roofPitch: avgPitch
  }
}
