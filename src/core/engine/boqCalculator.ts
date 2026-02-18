/**
 * Main BOQ Calculator
 * Orchestrates all calculation modules
 */

import { BOQItem, BOQCalculationInput } from './boq-calculators/types'
import { ProjectGeometry } from '../../domain/types'
import { adaptGeometryToBOQInput } from '../../application/adapters/boqAdapter'
import { calculateFoundation } from './boq-calculators/foundation'
import { calculateSubfloor } from './boq-calculators/subfloor'
import { calculateWalling } from './boq-calculators/walling'
import { calculateFinishes } from './boq-calculators/finishes'
import { calculatePitchedRoof, calculateFlatRoof } from './boq-calculators/roof'
import { calculateOpenings } from './boq-calculators/openings'
import { calculateDPC } from './boq-calculators/misc'
import { calculateElectrical } from './boq-calculators/electrical'
import { calculatePlumbing } from './boq-calculators/plumbing'
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
  const foundationItems = calculateFoundation(wallLength, wallThickness, foundationDepth, floorArea)
  boq.push(...foundationItems)

  // 2. SUBFLOOR (ground floor slab)
  const subfloorItems = calculateSubfloor(floorArea)
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

  // 7. FINISHES
  if (finishes) {
    const ceilingArea = floorArea
    const finishItems = calculateFinishes(floorArea, wallArea, ceilingArea, wallLength, finishes)
    boq.push(...finishItems)
  }

  // 8. MEP (Electrical & Plumbing)
  if (input.mepConfig) {
      if (input.electricalPoints && input.electricalPoints.length > 0) {
          const elecItems = calculateElectrical(input.electricalPoints, input.mepConfig.electrical, input.rooms)
          boq.push(...elecItems)
      }
      
      if (input.plumbingPoints && input.plumbingPoints.length > 0) {
          const plumbItems = calculatePlumbing(input.plumbingPoints, input.mepConfig.plumbing)
          boq.push(...plumbItems)
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
export function calculateProjectBOQ(project: ProjectGeometry): BOQItem[] {
  const partialInput = adaptGeometryToBOQInput(project)
  
  // Fill missing required fields with defaults
  const fullInput: BOQCalculationInput = {
    wallLength: partialInput.wallLength || 0,
    wallArea: partialInput.wallArea || 0,
    floorArea: partialInput.floorArea || 0,
    openings: partialInput.openings || [],
    roofType: partialInput.roofType || 'gable',
    roofPitch: partialInput.roofPitch || 0,
    brickType: 'clay', // Default
    // TODO: Map other fields like MEP if/when available in ProjectGeometry
  }

  return calculateBOQ(fullInput)
}
