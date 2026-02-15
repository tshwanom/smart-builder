import { Room } from '@/modules/canvas/application/types'

export interface FoundationCalculation {
  excavationVolume: number // m³
  concreteVolume: number // m³
  steelWeight: number // kg
  formworkArea: number // m²
  footprintArea: number // m²
}

export interface FoundationConfig {
  excavationDepth: number // meters
  slabThickness: number // meters
  steelDensity: number // kg/m²
  foundationWidth: number // meters (for strip foundations)
}

const DEFAULT_CONFIG: FoundationConfig = {
  excavationDepth: 0.6, // 600mm
  slabThickness: 0.15, // 150mm
  steelDensity: 8, // 8kg/m² for mesh reinforcement
  foundationWidth: 0.5 // 500mm strip foundation
}

export class FoundationCalculator {
  private config: FoundationConfig

  constructor(config?: Partial<FoundationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  calculateFromRooms(rooms: Room[]): FoundationCalculation {
    // Calculate total footprint area
    const footprintArea = rooms.reduce((sum, room) => sum + room.area, 0)
    
    // Calculate perimeter for strip foundations
    const totalPerimeter = rooms.reduce((sum, room) => sum + room.perimeter, 0)
    
    // Excavation volume: footprint area × depth
    const excavationVolume = footprintArea * this.config.excavationDepth
    
    // Concrete volume: slab + strip foundations
    const slabVolume = footprintArea * this.config.slabThickness
    const stripVolume = totalPerimeter * this.config.foundationWidth * this.config.excavationDepth
    const concreteVolume = slabVolume + stripVolume
    
    // Steel reinforcement
    const steelWeight = footprintArea * this.config.steelDensity
    
    // Formwork area (perimeter × depth)
    const formworkArea = totalPerimeter * this.config.excavationDepth
    
    return {
      excavationVolume,
      concreteVolume,
      steelWeight,
      formworkArea,
      footprintArea
    }
  }

  // Calculate for a single room
  calculateForRoom(room: Room): FoundationCalculation {
    const excavationVolume = room.area * this.config.excavationDepth
    const slabVolume = room.area * this.config.slabThickness
    const stripVolume = room.perimeter * this.config.foundationWidth * this.config.excavationDepth
    const concreteVolume = slabVolume + stripVolume
    const steelWeight = room.area * this.config.steelDensity
    const formworkArea = room.perimeter * this.config.excavationDepth
    
    return {
      excavationVolume,
      concreteVolume,
      steelWeight,
      formworkArea,
      footprintArea: room.area
    }
  }

  // Get material breakdown
  getMaterialBreakdown(calculation: FoundationCalculation) {
    return {
      excavation: {
        description: 'Excavation for foundations',
        quantity: calculation.excavationVolume,
        unit: 'm³'
      },
      concrete: {
        description: 'Concrete for slab and strip foundations',
        quantity: calculation.concreteVolume,
        unit: 'm³'
      },
      steel: {
        description: 'Steel reinforcement mesh',
        quantity: calculation.steelWeight,
        unit: 'kg'
      },
      formwork: {
        description: 'Formwork for foundations',
        quantity: calculation.formworkArea,
        unit: 'm²'
      }
    }
  }
}
