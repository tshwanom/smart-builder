import { StructureElementDomain } from '@/modules/structure/domain/StructureTypes'

export interface Point {
  x: number
  y: number
}

export interface Story {
  id: string
  name: string
  height: number // Ceiling height (mm)
  level: number // 0, 1, 2...
  elevation: number // calculated from levels below
}

export interface WallLayer {
  id: string
  type: 'MASONRY' | 'CAVITY' | 'FINISH' | 'MEMBRANE'
  thickness: number
  isStructural: boolean
  materialId: string | null
  material?: {
      id: string
      name: string
      lengthMm: number | null
      widthMm: number | null
      heightMm: number | null
      jointThicknessMm: number | null
  } | null
}

export interface WallTemplate {
  id: string
  name: string
  description: string
  hatchPattern: string
  fillColor: string
  isSystem: boolean
  layers: WallLayer[]
}

export interface Wall {
  id: string
  points: Point[]
  thickness: number
  completed: boolean
  height?: number
  wallType?: 'load-bearing' | 'partition'
  length?: number
  storyId?: string
  
  // New properties for Detailed Wall Structure
  templateId?: string
  templateOverrideId?: string // If user overrides template properties
  
  // Roof Generation Properties
  roofBehavior?: 'hip' | 'gable' | 'none' // Default 'hip'
  roofPitch?: number // Override global pitch if set
  roofOverhang?: number // Override global overhang (in mm) if set
  
  // Volume IX: Material-Based Construction
  construction?: import('../domain/wall/WallTypes').WallConstruction

  // Story Height Control
  heightMode?: 'default' | 'custom' // 'default' means linked to story height
}

export interface Room {
  id: string
  walls: string[]
  polygon: Point[] // Ordered points for rendering
  area: number
  perimeter: number
  storyId?: string
  name?: string
  floorFinish?: string
  wallFinish?: string
  ceilingFinish?: string
  
  // Roof Generation
  hasRoof?: boolean // Default true
  roofBaseline?: Point[] // Custom baseline (defaults to polygon)
  roofPlateHeight?: number // Wall plate height in meters (defaults to story height)
  roofPitch?: number // Room-level pitch override (degrees)
}

export interface Opening {
  id: string
  wallId: string
  storyId?: string
  type: 'window' | 'door'
  width: number
  height: number
  position: number
  sillHeight?: number
  
  // Expanded properties for BOQ and visualization
  subtype?: 'single' | 'double' | 'sliding' | 'folding' | 'pivot' | 'garage_single' | 'garage_double' | 'top_hung' | 'side_hung' | 'stable'
  material?: 'aluminium' | 'steel' | 'wood' | 'frameless'
  lintelType?: 'concrete' | 'steel' | 'timber' | 'none'
  sillType?: 'external_concrete' | 'external_brick' | 'internal_timber' | 'none'
  glazing?: 'single' | 'double' | 'safety'
  
  // Parametric Configuration (all doors and windows)
  panels: number                // Number of panels (default varies by type: 1 for standard, 2 for sliding, 4 for folding)
  openPercentage: number        // 0-100, controls visual animation (default: 0)
  flipSide: 'left' | 'right'    // Direction panels fold/slide or hinges attach (default: 'left')
  hingeType: 'standard' | 'pivot' | 'soft-close' | 'concealed'  // default: 'standard'
  frameThickness: number        // Frame thickness in meters (default: 0.05)
  openingAngle: number          // 0-180, for swing/pivot doors and opening windows (default: 90)
}

export interface RoofPanel {
  id: string
  roomId: string | null // Made nullable for independent roofs
  footprint?: Point[] // Custom footprint
  storyId?: string
  type: 'pitched' | 'flat'
  selected: boolean
  
  // Pitched Roof Configuration
  pitchedConfig?: {
    style: 'gable' | 'hip'
    pitch: number // degrees (15-45)
    trussType: 'timber' | 'steel'
    trussSpacing: 600 | 900 // mm
    sheeting: 'IBR' | 'corrugated' | 'tile'
    insulation: boolean
    ceiling: 'plasterboard' | 'suspended' | 'none'
  }
  
  // Flat Slab Configuration
  flatConfig?: {
    slabType: 'insitu' | 'rib-and-block' | 'prestressed'
    thickness: 150 | 175 | 200 | 225 // mm
    reinforcement: string // e.g., "Y12@200 B/W"
    finish: 'screed' | 'waterproofing'
    fall: '1:80' | '1:100'
  }
  
  area: number
  volume?: number // for slabs (m³)
}

export type ElectricalRoutingMode = 'ceiling' | 'floor'

// Volume 14: MEP Engineering Types

export interface Circuit {
  id: string
  name: string
  breakerAmps: 10 | 20 | 32 | 40 | 63
  phase: 'Red' | 'White' | 'Blue' | 'Single'
  cableSize: '1.5mm' | '2.5mm' | '4mm' | '6mm' | '10mm'
}

export interface ElectricalPoint {
  id: string
  type: 'socket' | 'switch' | 'light' | 'isolator' | 'db_board'
  subtype?: 'single' | 'double' | 'way2' | 'usb' | 'isolator_switch' // etc
  position: Point
  wallId?: string // If attached to a wall
  storyId?: string
  roomId?: string // Context for automation
  height: number // mm from FFL
  isDB?: boolean // Legacy flag, try use type='db_board'

  // Engineering Data (Vol 14)
  circuitId?: string
  loadInWatts?: number
  phase?: 'Red' | 'White' | 'Blue' | 'Single'
  mountingHeight?: number // AFL (duplicate of height, normalize later)
}

export interface PlumbingPoint {
  id: string
  type: 'basin' | 'sink' | 'shower' | 'toilet' | 'bath' | 'washing_machine' | 'source'
  subtype?: string // e.g. 'oval', 'corner', 'pedestal'
  position: Point
  rotation?: number // in degrees (0-360)
  width?: number // mm
  length?: number // mm
  wallId?: string
  storyId?: string
  height?: number
  isSource?: boolean
  
  // Engineering Data (Vol 14)
  reqFlow?: number // L/min
  reqTemp?: 'cold' | 'hot' | 'balanced'
  pipeDiameter?: 15 | 22 | 28 | 32
}

export interface HVACPoint {
  id: string
  type: 'split_indoor' | 'split_outdoor' | 'duct_grille' | 'thermostat'
  position: Point
  wallId?: string
  storyId?: string
  btu?: number // e.g., 9000, 12000, 18000
  pipingLength?: number // Calculated
}

export interface MEPConfig {
  hasCompletedWizard: boolean
  electrical: {
    routingMode: ElectricalRoutingMode
    ceilingHeight: number // default 2400-2700mm
    voltage: number // 230V
    conduitType: 'pvc' | 'bosal'
    wireType: 'house_wire' | 'surfix'
    supplyType?: 'single_phase' | 'three_phase'
  }
  plumbing: {
    supplyType: 'municipal' | 'tank'
    pipeType: 'copper' | 'pex' | 'polycop' | 'pvc'
    pressure?: number // kPa
  }
  hvac?: {
     defaultBrand?: string
  }
}

export interface Staircase {
  id: string
  type: 'straight' | 'l-shape' | 'u-shape' | 'spiral'
  position: Point 
  rotation: number
  storyId?: string 
  topStoryId?: string 
  width: number
  totalRise: number 
  riserHeight?: number 
  treadDepth: number
  landingDepth?: number 
  innerRadius?: number 
  direction: 'left' | 'right' 
  material: 'concrete' | 'timber' | 'steel'
  hasRailing: boolean
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

export interface ProjectData {
  stories?: Story[]
  walls: Wall[]
  rooms: Room[]
  openings: Opening[]
  roofPanels: RoofPanel[]
  electricalPoints: ElectricalPoint[]
  plumbingPoints: PlumbingPoint[]
  hvacPoints?: HVACPoint[]
  mepConfig: MEPConfig
  boqConfig: BOQConfig
  viewport?: {
    scale: number
    offset: Point
  }
  
  // Global Roof Settings
  roofPitch?: number
  roofOverhang?: number
  showRoof?: boolean
  showRoofSlopeArrows?: boolean
  roofArrowOffset?: number
  
  structureElements: StructureElementDomain[]
}
