export type MaterialCategory = 
  | 'concrete' 
  | 'masonry_unit' 
  | 'mortar' 
  | 'plaster'
  | 'reinforcement'
  | 'insulation'
  | 'roof_covering'
  | 'timber'
  | 'dpc'
  | 'fill'
  | 'precast'
  | 'lining'
  | 'steel_section'
  | 'icf_unit'
  | 'hardware'

export interface MaterialBase {
  id: string
  name: string
  category: MaterialCategory
  cost: {
    unit: string // 'm3', 'm2', 'kg', 'item'
    price: number // ZAR
  }
}

export interface ConcreteMaterial extends MaterialBase {
  category: 'concrete'
  grade: string // '15MPa', '25MPa', '30MPa'
  maxAggregateSize: number // mm
}

export interface ReinforcementMaterial extends MaterialBase {
  category: 'reinforcement'
  type: 'high_yield' | 'mild_steel' | 'mesh'
  diameter: number // mm
  massPerMeter: number // kg/m
}

export interface MasonryMaterial extends MaterialBase {
  category: 'masonry_unit'
  type: 'solid' | 'hollow'
  dimensions: {
    length: number
    width: number
    height: number
  }
  compressiveStrength: number // MPa
}

export interface MortarMaterial extends MaterialBase {
  category: 'mortar'
  class: 'I' | 'II' // SANS 2001-CM1
  mixRatio: string // e.g. "1:3"
}

export interface PlasterMaterial extends MaterialBase {
  category: 'plaster'
  type: 'cement' | 'gypsum' | 'lime'
  mixRatio: string
}


export interface RoofCovering extends MaterialBase {
  category: 'roof_covering'
  type: 'tile' | 'sheeting' | 'slate' | 'thatch' // SANS 10400-L
  profile?: string // e.g. 'double_roman', 'ibr'
  dimensions?: {
      width: number // Effective cover width (mm)
      length?: number // Tile length (mm)
  }
  massPerArea: number // kg/m2 (for load calcs)
  minPitch: number // degrees (SANS limit)
}

export interface TimberMember extends MaterialBase {
  category: 'timber'
  grade: 'S5' | 'S7' // SANS 1783
  dimensions: {
      width: number
      depth: number
  }
}

export interface DampProofingMaterial extends MaterialBase {
  category: 'dpc'
  thickness: number // microns
  width?: number // mm (for DPC strip)
  materialType: 'polythene' | 'bitumen' | 'modified_bitumen'
}

export interface FillMaterial extends MaterialBase {
  category: 'fill'
  type: 'hardcore' | 'sand' | 'g5' | 'g7'
  compactionFactor: number // e.g. 1.3
}

export interface PrecastMaterial extends MaterialBase {
  category: 'precast'
  type: 'beam' | 'block' | 'hollow_core_slab'
  dimensions: {
      length?: number // mm (for beams/slabs, often variable)
      width: number   // mm
      height: number  // mm
  }
  massPerMeter?: number // kg/m (for beams)
  massPerArea?: number  // kg/m2 (for slabs)
}

export interface InsulationMaterial extends MaterialBase {
  category: 'insulation'
  type: 'roll' | 'board' | 'spray'
  rValue: number
  thickness: number
}

export interface LiningMaterial extends MaterialBase {
  category: 'lining'
  type: 'gypsum' | 'fiber_cement' | 'wood'
  thickness: number
  dimensions: { length: number, width: number }
}

export interface SteelSectionMaterial extends MaterialBase {
  category: 'steel_section' 
  type: 'stud' | 'track' | 'channel'
  profile: string // e.g. '64mm stud'
  length?: number
}

export interface ICFMaterial extends MaterialBase {
    category: 'icf_unit'
    coreWidth: number
    dimensions: { length: number, height: number, width: number }
}

export interface HardwareMaterial extends MaterialBase {
    category: 'hardware'
    type: 'fastener' | 'connector' | 'bracing'
    unitSpec?: string // e.g. "30x1.2mm"
}

export type Material = 
  | ConcreteMaterial 
  | ReinforcementMaterial 
  | MasonryMaterial
  | MortarMaterial
  | PlasterMaterial
  | RoofCovering
  | TimberMember
  | DampProofingMaterial
  | FillMaterial
  | PrecastMaterial
  | InsulationMaterial
  | LiningMaterial
  | SteelSectionMaterial
  | ICFMaterial
  | HardwareMaterial
