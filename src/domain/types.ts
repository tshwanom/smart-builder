import { StructureElementDomain } from '../modules/structure/domain/StructureTypes'

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

import { WallConstruction } from '../modules/canvas/domain/wall/WallTypes'

export interface WallSegment {
  id: string
  start: Point3D
  end: Point3D
  thickness: number
  height: number
  storyId: string
  // For openings, we might need a separate collection or nested here
  openings?: string[] // IDs of openings
  templateId?: string
  wallType?: 'load-bearing' | 'partition'
  // Roof properties for this wall
  roofBehavior?: 'gable' | 'hip' | 'none'
  roofPitch?: number
  roofOverhang?: number
  
  // Foundation properties
  foundation?: FoundationConfig
  
  // Wall Structure (Legacy / Simple)
  structure?: WallStructure
  
  // Volume IX: Material-Based Construction
  construction?: WallConstruction

  heightMode?: 'default' | 'custom'

  // Roof Structure (Material Based)
  roofStructure?: RoofStructure
}

export interface RoofStructure {
  type: 'gable' | 'hip' | 'mono' | 'flat'
  pitch: number // degrees
  overhang: number // mm
  trussType: 'howe' | 'king_post' | 'fink' | 'attic'
  covering: {
      materialId: string // e.g. 'tile_concrete_double_roman'
      underlay: boolean // SANS requires for certain pitches
  }
  ceiling: {
      type: 'gypsum' | 'pvc' | 'iso_board'
      insulation: boolean // SANS 10400-XA
  }
}

export type WallSystemType = 'masonry' | 'drywall' | 'icf' | 'composite'

export interface DrywallConfig {
  studSize: 64 | 102
  studSpacing: 400 | 600
  boardType: string // e.g. 'gypsum_12mm'
  insulation: boolean
}

export interface ICFConfig {
  coreWidth: number // mm
  blockType: string // e.g. 'icf_block_standard'
}

export interface WallStructure {
  type: WallSystemType
  // Masonry properties (Legacy / Masonry Type)
  skins?: SkinConfig[]
  cavityWidth?: number 
  
  // Drywall properties
  drywall?: DrywallConfig
  
  // ICF properties
  icf?: ICFConfig
  
  plaster?: {
    internal: string 
    external: string
    thickness: number
  }
}

export interface SkinConfig {
  materialId: string // e.g. 'brick_clay_stock'
  orientation: 'stretcher' | 'header' | 'soldier'
}

export type DesignMode = 'standard' | 'engineer'

export type SoilClass = 'H1' | 'H2' | 'H3' | 'H4' | 'S' | 'custom'

export type FoundationType = 
  | 'strip_footing' 
  | 'pad_footing' 
  | 'raft' 
  | 'pile' 
  | 'slab_on_ground'

export interface RebarSpec {
  size: string        // e.g. 'Y12'
  spacing?: number    // mm c/c
  cover?: number      // mm
  length?: number     // mm
  quantity?: number   // count
}

export interface FoundationStructure {
  id: string
  type: FoundationType
  designMode: DesignMode
  soilClass: SoilClass
  
  // Geometry
  width: number       // mm
  depth: number       // mm
  foundingLevel: number // mm below NGL
  
  // Concrete
  concrete: {
    grade: string     // e.g. '20MPa'
    overbreakAllowance?: number // % (Standard 7.5%)
  }
  
  // Reinforcement
  reinforcement: {
    bottomBars?: RebarSpec
    topBars?: RebarSpec
    starterBars?: RebarSpec
  }
}

export type SubfloorSystemType = 
  | 'beam_and_block'
  | 'hollow_core'
  | 'slab_on_ground'

export interface SubfloorStructure {
  id: string
  type: SubfloorSystemType
  designMode: DesignMode
  
  // Levels
  naturalGroundLevel: number
  finishedFloorLevel: number
  
  // Beam & Block
  beamAndBlock?: {
    beamType: string
    blockType: string
    beamSpacing: number // mm
  }
  
  // General Slab Logic (used for slab_on_ground too)
  slab?: {
      thickness: number
      meshRef: string
  }
}


export interface FoundationConfig {
  type: 'strip' | 'pad' | 'raft'
  width: number      // mm (e.g. 600)
  depth: number      // mm (e.g. 230)
  offset: number     // mm (from wall center, usually 0)
  
  // Concrete specs
  concreteGrade: string // e.g. "25MPa"
  
  // Reinforcement
  reinforcement: {
    mainBars: string    // e.g. "Y12"
    mainBarCount: number 
    stirrups: string    // e.g. "R8"
    stirrupSpacing: number // mm
  }
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
  structure?: RoofStructure // Detailed engineering config
}

export interface BuildingLayer {
  id: string
  name: string
  elevation: number // Z-height from ground
  height: number    // Wall height for this layer
}



export interface BOQConfig {
  roofType: 'flat' | 'gable' | 'hip'
  roofPitch: number
  finishes: {
    floor: 'tiles' | 'screed' | 'vinyl'
    walls: 'paint' | 'plaster' | 'tiles'
    ceiling: 'paint' | 'suspended'
  }
}

import { RoomFinishDomain } from '../modules/finishes/domain/FinishTypes'
import { Room, ElectricalPoint, PlumbingPoint, HVACPoint, MEPConfig, ElectricalRoutingMode } from '../modules/canvas/application/types'

export type { ElectricalRoutingMode }

export interface ProjectMetadata {
    name: string
    currency: string
    currencySymbol: string
}

export interface ProjectGeometry {
  layers: BuildingLayer[]
  stories?: import('../modules/canvas/application/types').Story[]
  walls: WallSegment[]
  roofs: RoofPlane3D[]
  openings: Opening3D[]
  structureElements: StructureElementDomain[]
  
  // Volume 13
  rooms?: Room[]
  finishSchedules?: RoomFinishDomain[]
  finishProducts?: any[] // FinishProduct from Prisma (loose type to avoid import cycle)

  boqConfig: BOQConfig
  
  // Volume 14: MEP
  electricalPoints?: ElectricalPoint[] // electricalPoints from canvas types
  plumbingPoints?: PlumbingPoint[]
  hvacPoints?: HVACPoint[]
  mepConfig?: MEPConfig
  
  // Metadata (Volume 15)
  meta?: ProjectMetadata
}
