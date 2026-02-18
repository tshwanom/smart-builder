/**
 * Main BOQ Calculator
 * Orchestrates all calculation modules
 */

import { BOQItem, BOQCalculationInput } from './boq-calculators/types'
import { ProjectGeometry, FoundationStructure, SubfloorStructure } from '../../domain/types'
import { adaptGeometryToBOQInput } from '../../application/adapters/boqAdapter'
import { calculateFoundation } from './boq-calculators/foundation'
import { calculateSubfloor } from './boq-calculators/subfloor'
import { calculateWalling } from './boq-calculators/walling'
// import { calculateFinishes } from './boq-calculators/finishes'
import { calculatePitchedRoof, calculateFlatRoof } from './boq-calculators/roof'
import { calculateOpenings } from './boq-calculators/openings'
import { calculateDPC } from './boq-calculators/misc'
import { calculateElectrical } from './boq-calculators/electrical'
import { calculatePlumbing } from './boq-calculators/plumbing'
import { calculateHVAC } from './boq-calculators/hvac'
import { calculateStaircase } from './boq-calculators/staircase'

// Re-export types
export type { BOQItem, BOQCalculationInput, Opening } from './boq-calculators/types'

/**
 * Calculate complete BOQ for a construction project
 */
export function calculateBOQ(input: BOQCalculationInput): BOQItem[] {
  const {
    wallArea,
    wallLength,
    floorArea,
    wallHeight = 2.7,
    wallThickness = 0.23,
    foundationDepth = 0.6,
    roofType = 'gable',
    roofPitch = 30,
    openings = [],
    brickType = 'clay',
    finishes
  } = input

  const boq: BOQItem[] = []

  // 1. FOUNDATION
  const defaultFoundation: FoundationStructure = {
      id: 'default',
      type: 'strip_footing',
      designMode: 'standard',
      soilClass: 'H1',
      width: (wallThickness + 0.6) * 1000, 
      depth: foundationDepth * 1000,
      foundingLevel: foundationDepth * 1000,
      concrete: { grade: '20MPa' },
      reinforcement: {
          bottomBars: { size: 'Y12', quantity: 4 }
      }
  }
  const foundationItems = calculateFoundation(wallLength, defaultFoundation)
  boq.push(...foundationItems)

  // 2. SUBFLOOR (ground floor slab)
  const defaultSubfloor: SubfloorStructure = {
      id: 'default-subfloor',
      type: 'slab_on_ground',
      designMode: 'standard',
      naturalGroundLevel: 0,
      finishedFloorLevel: 0,
      slab: { thickness: 100, meshRef: 'Ref 193' }
  }
  const subfloorItems = calculateSubfloor(floorArea, defaultSubfloor)
  boq.push(...subfloorItems)

  // 3. WALLING
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wallingItems = calculateWalling(wallArea, wallHeight, openings, brickType as any)
  boq.push(...wallingItems)

  // 4. OPENINGS (Doors, Windows, Lintels, Sills)
  if (openings.length > 0) {
    const openingItems = calculateOpenings(openings)
    boq.push(...openingItems)
  }

  // 5. DPC (Damp Proof Course)
  const dpcItems = calculateDPC(wallLength, wallThickness)
  boq.push(...dpcItems)

  // 6. ROOF
  const roofItems = roofType === 'flat' 
    ? calculateFlatRoof(floorArea)
    : calculatePitchedRoof(floorArea, roofType, roofPitch)
  boq.push(...roofItems)

  // 7. FINISHES (Legacy - Moved to Volume 13)
  /*
  if (finishes) {
    const ceilingArea = floorArea
    // const finishItems = calculateFinishes(floorArea, wallArea, ceilingArea, wallLength, finishes)
    // boq.push(...finishItems)
  }
  */

  // 8. MEP (Electrical, Plumbing, HVAC)
  if (input.mepConfig) {
      if (input.electricalPoints && input.electricalPoints.length > 0) {
          const elecItems = calculateElectrical(input.electricalPoints, input.mepConfig.electrical, input.rooms)
          boq.push(...elecItems)
      }
      
      if (input.plumbingPoints && input.plumbingPoints.length > 0) {
          const plumbItems = calculatePlumbing(input.plumbingPoints, input.mepConfig.plumbing)
          boq.push(...plumbItems)
      }
      
      // Volume 14 HVAC
      if (input.hvacPoints && input.hvacPoints.length > 0) {
           const hvacItems = calculateHVAC(input.hvacPoints, input.mepConfig.hvac)
           boq.push(...hvacItems)
      }
  }

  // 9. STAIRCASES
  if (input.staircases && input.staircases.length > 0) {
      const stairItems = calculateStaircase(input.staircases)
      boq.push(...stairItems)
  }

  return boq
}

/**
 * Calculate total cost (if prices provided)
 */
export function calculateTotalCost(boq: BOQItem[]): number {
  return boq.reduce((total, item) => {
    return total + (item.totalPrice || 0)
  }, 0)
}

/**
 * Calculate BOQ directly from Project Geometry (New Architecture)
 */
import { WallCalculator } from './boq-calculators/WallCalculator'
import { RoofCalculator } from './boq-calculators/RoofCalculator'
import { StructureCalculator } from './boq-calculators/structure'
import { FinishesCalculator } from './boq-calculators/finishes'
import { Point3D } from '../../domain/types'

function calculatePolygonArea(vertices: Point3D[]): number {
    if (vertices.length < 3) return 0
    let area = 0
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length
        area += vertices[i].x * vertices[j].y
        area -= vertices[j].x * vertices[i].y
    }
    return Math.abs(area) / 2
}

/**
 * Calculate BOQ directly from Project Geometry (New Architecture)
 */
export function calculateProjectBOQ(project: ProjectGeometry): BOQItem[] {
  const { walls, openings, roofs, structureElements } = project
  const boq: BOQItem[] = []

  // 0. Structural Skeleton (Volume 12)
  if (structureElements && structureElements.length > 0) {
      const structItems = StructureCalculator.calculate(structureElements)
      boq.push(...structItems)
  }

  // 0.5 Architectural Finishes (Volume 13)
  if (project.rooms && project.finishSchedules && project.finishProducts) {
      project.rooms.forEach(room => {
          const schedule = project.finishSchedules?.find(s => s.roomId === room.id)
          if (schedule) {
              const finishItems = FinishesCalculator.calculate(room, schedule, project.finishProducts || [])
              boq.push(...finishItems)
          }
      })
  }

  // 1. Calculate Walls & Foundations (Detailed)
  walls.forEach(wall => {
      // Calculate Net Area
      const dx = wall.end.x - wall.start.x
      const dy = wall.end.y - wall.start.y
      const length = Math.sqrt(dx * dx + dy * dy)
      const grossArea = length * wall.height
      
      // Subtract openings attached to this wall
      const wallOpenings = openings.filter(o => o.wallId === wall.id)
      const openingArea = wallOpenings.reduce((sum, o) => sum + (o.width * o.height), 0)
      const netArea = Math.max(0, grossArea - openingArea)

      // A. Superstructure (Legacy or New)
      if (wall.structure || wall.construction) {
          // ensure structure is passed if present, or empty object/undefined if not used by new strategies?
          // The function signature expects structure. 
          // If structure is undefined but construction is present, we might need a dummy structure?
          // However, WallCalculator uses structure for fallback.
          // Let's pass 'wall.structure!' if strict, but 'wall.structure || {} as any' if safe.
          // Ideally WallCalculator handles undefined structure if construction is present.
          // Let's assume structure is present or check strategies.
          
          const wallItems = WallCalculator.calculateWallItems(
              netArea, 
              length, 
              wall.height, 
              wall.structure || { type: 'masonry', skins: [] } as any, // fallback dummy
              wall.construction,
              wallOpenings
          )
          
          // Add IDs to items
          const itemsWithIds = wallItems.map((item, index) => ({
              ...item,
              id: `wall-${wall.id}-${index}`,
              totalPrice: item.quantity * (item.rate || 0)
          }))
          
          boq.push(...itemsWithIds)

      } else {
          // Fallback legacy calculation for this wall
          boq.push({
              id: `wall-basic-${wall.id}`,
              category: 'Superstructure',
              item: 'Wall (Standard)',
              description: `Wall ${wall.thickness * 1000}mm (Basic)`,
              quantity: parseFloat(netArea.toFixed(2)),
              unit: 'm²',
              rate: wall.thickness > 0.15 ? 850 : 450,
              totalPrice: netArea * (wall.thickness > 0.15 ? 850 : 450)
          })
      }


// ... (inside calculateProjectBOQ loop)

      // B. Foundations
      if (wall.foundation) {
          // Adapt old config to new Structure 
          // (Temporary adapter until WallSegment is fully migrated)
          const structure: FoundationStructure = {
              id: wall.id,
              type: 'strip_footing',
              designMode: 'standard',
              soilClass: 'H1', // Default to H1
              width: wall.foundation.width || 600,
              depth: wall.foundation.depth || 300,
              foundingLevel: wall.foundation.depth || 750,
              concrete: { 
                  grade: wall.foundation.concreteGrade || '20MPa' 
              },
              reinforcement: {
                   // Map legacy reinforcement if present
                   bottomBars: wall.foundation.reinforcement ? {
                       size: wall.foundation.reinforcement.mainBars || 'Y12',
                       quantity: wall.foundation.reinforcement.mainBarCount || 4,
                       spacing: 200
                   } : undefined
              }
          }

          const items = calculateFoundation(length, structure)
          boq.push(...items)
      }
  })

  // 1.5 Roofs (Detailed)
  roofs.forEach((roof, index) => {
      // Estimate Plan Area (ignoring Z for now)
      const planArea = calculatePolygonArea(roof.vertices)
      
      if (roof.structure && planArea > 0) {
           const quantities = RoofCalculator.calculateQuantities(
               planArea, 
               roof.pitch, 
               0, 
               roof.structure
           )

           // Trusses
           boq.push({
                id: `roof-truss-${index}`,
                category: 'Roof Structure',
                item: 'Roof Trusses',
                description: `Prefabricated Timber Trusses (${roof.structure.trussType})`,
                quantity: quantities.trusses.count,
                unit: 'No',
                rate: 1500, // Est
                totalPrice: quantities.trusses.count * 1500
           })
           
           boq.push({
                id: `roof-timber-${index}`,
                category: 'Roof Structure',
                item: 'Structural Timber',
                description: 'S5 Timber Volume (Est)',
                quantity: parseFloat(quantities.trusses.timberVolume.toFixed(3)),
                unit: 'm³',
                rate: 8500,
                totalPrice: quantities.trusses.timberVolume * 8500
           })

           // Battens/Purlins
           boq.push({
                id: `roof-batten-${index}`,
                category: 'Roof Structure',
                item: 'Battens / Purlins',
                description: `Timber ${quantities.battens.size}`,
                quantity: quantities.battens.length,
                unit: 'm',
                rate: 12,
                totalPrice: quantities.battens.length * 12
           })

           // Covering
           if (quantities.covering.count > 0) {
                boq.push({
                    id: `roof-tile-${index}`,
                    category: 'Roof Covering',
                    item: 'Roof Tiles',
                    description: `Concrete Tiles (${roof.structure.covering.materialId})`,
                    quantity: quantities.covering.count,
                    unit: 'No',
                    rate: 12,
                    totalPrice: quantities.covering.count * 12
                })
           } else if (quantities.covering.area > 0) {
               boq.push({
                    id: `roof-sheet-${index}`,
                    category: 'Roof Covering',
                    item: 'Roof Sheeting',
                    description: `Metal Sheeting (${roof.structure.covering.materialId})`,
                    quantity: quantities.covering.area,
                    unit: 'm²',
                    rate: 180,
                    totalPrice: quantities.covering.area * 180
                })
           }

           // Bracing
           if (quantities.bracing.strapLength > 0) {
                boq.push({
                    id: `roof-bracing-${index}`,
                    category: 'Roof Structure',
                    item: 'Bracing Strap',
                    description: 'Galvanised Bracing Strap 30x1.2mm',
                    quantity: quantities.bracing.strapLength,
                    unit: 'm',
                    rate: 18,
                    totalPrice: quantities.bracing.strapLength * 18
                })
           }

           // Wall Plates
           if (quantities.plates.length > 0) {
                boq.push({
                    id: `roof-plate-${index}`,
                    category: 'Roof Structure',
                    item: 'Wall Plate',
                    description: `S5 Timber ${quantities.plates.size}`,
                    quantity: quantities.plates.length,
                    unit: 'm',
                    rate: 45,
                    totalPrice: quantities.plates.length * 45
                })
           }

           // Gangnail Plates
           if (quantities.trusses.plateCount > 0) {
                boq.push({
                    id: `roof-gangnail-${index}`,
                    category: 'Roof Structure',
                    item: 'Gangnail Plate',
                    description: 'Truss Connector',
                    quantity: quantities.trusses.plateCount,
                    unit: 'No',
                    rate: 8,
                    totalPrice: quantities.trusses.plateCount * 8
                })
           }
      }
  })

  // 2. Other Elements
  // We use the legacy calculator but zero-out the walls
  const partialInput = adaptGeometryToBOQInput(project)
  const fullInput: BOQCalculationInput = {
    ...partialInput,
    openings: partialInput.openings || [],
    wallLength: 0, 
    wallArea: 0,   
    floorArea: partialInput.floorArea || 0,
    roofType: partialInput.roofType || 'gable',
    roofPitch: partialInput.roofPitch || 0,
  }
  
  const otherItems = calculateBOQ(fullInput)
  
  const filteredOther = otherItems.filter(i => 
    i.category !== 'Superstructure' && 
    i.category !== 'Foundations' && 
    i.category !== 'DPC' &&
    !i.category.startsWith('Roof') // Filter legacy roof items
  )
  
  // DPC Calc
  walls.forEach(wall => {
      const dx = wall.end.x - wall.start.x
      const dy = wall.end.y - wall.start.y
      const length = Math.sqrt(dx * dx + dy * dy)
      
      boq.push({
          id: `dpc-${wall.id}`,
          category: 'Foundations',
          item: 'Damp Proof Course', 
          description: `DPC ${wall.thickness * 1000}mm width`,
          quantity: parseFloat(length.toFixed(2)),
          unit: 'm',
          rate: 45,
          totalPrice: length * 45
      })
  })

  return [...boq, ...filteredOther]
}
