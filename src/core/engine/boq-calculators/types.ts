/**
 * BOQ Types and Interfaces
 */

import { Wall, Room, Opening, ElectricalPoint, PlumbingPoint, HVACPoint, MEPConfig, BOQConfig, Story, Staircase } from '@/modules/canvas/application/types'

export interface BOQItem {
  id?: string
  category: string
  name?: string // Alias for item
  item: string
  description?: string
  quantity: number
  unit: string
  rate: number // Standardized price per unit
  totalPrice?: number
  notes?: string
  storyId?: string
  storyName?: string
  phase?: string
}

export type { Opening }

export interface BOQCalculationInput {
  wallLength: number
  wallArea: number
  floorArea: number
  wallHeight?: number
  wallThickness?: number
  foundationDepth?: number
  roofType?: 'gable' | 'flat' | 'hip'
  roofPitch?: number
  openings?: Opening[]
  brickType?: 'clay' | 'cement' | 'maxi'
  finishes?: BOQConfig['finishes']
  mepConfig?: {
      electrical: MEPConfig['electrical']
      plumbing: MEPConfig['plumbing']
      hvac?: MEPConfig['hvac']
  }
  electricalPoints?: ElectricalPoint[]
  plumbingPoints?: PlumbingPoint[]
  hvacPoints?: HVACPoint[]
  rooms?: Room[]
  staircases?: Staircase[]
}
