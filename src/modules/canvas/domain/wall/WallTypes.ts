
// Volume IX: Wall System Types
// Supports Material-Based Construction (Masonry) and Modern Systems (Drywall, ICF, Panels)

/**
 * Base Material Interface
 */
export interface MaterialBase {
  id: string
  name: string
  cost: {
    unit: string // 'm2', 'm3', 'kg', 'no', 'm'
    rate: number // ZAR
  }
}

/** 
 * specialized material types
 */

// --- Masonry Materials ---
export interface BrickType extends MaterialBase {
  category: 'clay' | 'concrete' | 'calcium_silicate'
  dimensions: {
    length: number // mm (work size)
    width: number  // mm (work size)
    height: number // mm (work size)
  }
  coordinating: {
    length: number // mm (work + joint)
    height: number // mm (work + joint)
  }
  strength: {
    grade: string
    compressiveStrength: number // MPa
  }
}

export interface MortarType extends MaterialBase {
  mix: string // "1:4"
  classification: 'I' | 'II' | 'III' | 'IV'
  jointThickness: {
    typical: number // mm
  }
}

export interface PlasterType extends MaterialBase {
  mix: string
  thickness: {
    typical: number // mm
    min: number
    max: number
  }
  application: 'internal' | 'external' | 'both'
}

// --- Drywall Framework Materials ---
export interface TimberStudType extends MaterialBase {
  dimensions: { width: number; depth: number } // mm
  grade: string
  treatment: string
}

export interface SteelStudType extends MaterialBase {
  dimensions: { width: number; depth: number; thickness: number } // mm
  profile: 'C_section' | 'U_track' | 'top_hat'
  material: {
    coating: string
    yieldStrength: number
  }
}

// --- Sheathing / Board Materials ---
export interface GypsumBoardType extends MaterialBase {
  type: 'standard' | 'moisture_resistant' | 'fire_rated' | 'impact_resistant' | 'sound_dampening'
  dimensions: {
    thickness: number // mm
    width: number
    length: number
  }
  performance: {
    fireRating: number // minutes
    soundReduction: number // dB
    moistureResistant: boolean
  }
}

// --- Insulation Materials ---
export interface InsulationType extends MaterialBase {
  material: 'glasswool' | 'polyester' | 'mineral_wool' | 'EPS' | 'XPS'
  form: 'batt' | 'roll' | 'board' | 'loose_fill'
  dimensions?: {
    thickness: number // mm
    width: number
  }
  thermal: {
    rValue: number
    conductivity: number
  }
}

// --- ICF & Panels ---
export interface ICFBlockType extends MaterialBase {
  blockDimensions: {
    length: number
    height: number
    totalThickness: number
  }
  wallComposition: {
    coreThickness: number // mm
    insulationThickness: number // combined mm
  }
}

/**
 * Wall Layer Definition
 */
export type WallLayerType = 
  | 'masonry_skin' 
  | 'cavity' 
  | 'plaster' 
  | 'drywall_frame' 
  | 'gypsum_board' 
  | 'insulation' 
  | 'icf_core' 
  | 'panel' 
  | 'air_gap' 
  | 'membrane'

export interface WallLayer {
  id: string
  sequence: number // 1 = Exterior, N = Interior
  type: WallLayerType
  thickness: number // mm (Auto-calculated from material usually)
  
  // Specific Data based on Type
  masonry?: {
    materialId: string // BrickType ID
    bond: 'stretcher' | 'english' | 'flemish' | 'stack'
    mortarId: string
    jointThickness: number // mm
  }
  
  plaster?: {
    typeId: string // PlasterType ID
    coats: number
  }
  
  drywallFrame?: {
    studId: string // TimberStudType | SteelStudType ID
    spacing: number // mm
    noggings?: boolean
  }
  
  gypsumBoard?: {
    boardId: string // GypsumBoardType ID
    orientation: 'vertical' | 'horizontal'
    layers: number
  }

  insulation?: {
    materialId: string
    rValue?: number
  }
  
  icf?: {
    blockId: string
    concreteGrade: string
  }
  
  cavity?: {
    width: number // mm
    ventilated: boolean
    tiesId?: string
  }
}

/**
 * Wall Construction Definition
 */
export interface WallConstruction {
  id: string
  name: string
  category: 'masonry' | 'drywall' | 'icf' | 'panel' | 'hybrid'
  
  layers: WallLayer[]
  
  // Computed Properties (Read Only - Calculated from Layers)
  totalThickness: number // mm
  
  // Compliance Data
  standardRef: string // e.g. "SANS_10400"
  fireRating: number // minutes
  acousticRating: number // dB
  thermal: {
     uValue: number
     rValue: number
  }
}
