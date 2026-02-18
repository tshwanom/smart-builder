import { ConcreteMaterial, ReinforcementMaterial, MasonryMaterial, MortarMaterial, PlasterMaterial } from '../../domain/materialTypes'

// Defines the standard materials available in the system (SANS compliant)

export const CONCRETE_TYPES: ConcreteMaterial[] = [
  {
    id: 'conc_15mpa',
    name: 'Concrete 15MPa (Standard Foundation)',
    category: 'concrete',
    grade: '15MPa',
    maxAggregateSize: 19,
    cost: { unit: 'm3', price: 1850 } 
  },
  {
    id: 'conc_20mpa',
    name: 'Concrete 20MPa (SANS Foundation)',
    category: 'concrete',
    grade: '20MPa',
    maxAggregateSize: 19,
    cost: { unit: 'm3', price: 1950 }
  },
  {
    id: 'conc_25mpa',
    name: 'Concrete 25MPa (Structural)',
    category: 'concrete',
    grade: '25MPa',
    maxAggregateSize: 19,
    cost: { unit: 'm3', price: 2100 }
  },
  {
    id: 'conc_30mpa',
    name: 'Concrete 30MPa (Heavy Duty)',
    category: 'concrete',
    grade: '30MPa',
    maxAggregateSize: 19,
    cost: { unit: 'm3', price: 2350 }
  },
  {
    id: 'conc_40mpa',
    name: 'Concrete 40MPa (Precast/High Strength)',
    category: 'concrete',
    grade: '40MPa',
    maxAggregateSize: 19,
    cost: { unit: 'm3', price: 2600 }
  }
]

export const REINFORCEMENT_TYPES: ReinforcementMaterial[] = [
  {
    id: 'rebar_y10',
    name: 'Y10 High Yield Bar',
    category: 'reinforcement',
    type: 'high_yield',
    diameter: 10,
    massPerMeter: 0.617,
    cost: { unit: 'kg', price: 28 } // approx R28/kg installed
  },
  {
    id: 'rebar_y12',
    name: 'Y12 High Yield Bar',
    category: 'reinforcement',
    type: 'high_yield',
    diameter: 12,
    massPerMeter: 0.888,
    cost: { unit: 'kg', price: 28 }
  },
  {
    id: 'rebar_y16',
    name: 'Y16 High Yield Bar',
    category: 'reinforcement',
    type: 'high_yield',
    diameter: 16,
    massPerMeter: 1.58,
    cost: { unit: 'kg', price: 28 }
  },
  {
    id: 'rebar_y20',
    name: 'Y20 High Yield Bar',
    category: 'reinforcement',
    type: 'high_yield',
    diameter: 20,
    massPerMeter: 2.47,
    cost: { unit: 'kg', price: 29 }
  },
  {
    id: 'rebar_y25',
    name: 'Y25 High Yield Bar',
    category: 'reinforcement',
    type: 'high_yield',
    diameter: 25,
    massPerMeter: 3.85,
    cost: { unit: 'kg', price: 30 }
  },
  {
    id: 'mesh_ref193',
    name: 'Ref 193 Mesh',
    category: 'reinforcement',
    type: 'mesh',
    diameter: 5.6,
    massPerMeter: 1.93, // kg/m2 nominal
    cost: { unit: 'm2', price: 85 }
  }
]

export const MASONRY_TYPES: MasonryMaterial[] = [
  {
    id: 'brick_clay_stock',
    name: 'Clay Stock Brick (Imperial)',
    category: 'masonry_unit',
    type: 'solid',
    dimensions: { length: 222, width: 106, height: 73 },
    compressiveStrength: 14,
    cost: { unit: '1000', price: 2500 } // R2.50 each
  },
  {
    id: 'brick_clay_maxi',
    name: 'Clay Maxi Brick',
    category: 'masonry_unit',
    type: 'solid',
    dimensions: { length: 290, width: 140, height: 90 },
    compressiveStrength: 14,
    cost: { unit: '1000', price: 4500 }
  },
  {
    id: 'block_cement_m140',
    name: 'Cement Block M140',
    category: 'masonry_unit',
    type: 'hollow',
    dimensions: { length: 390, width: 140, height: 190 },
    compressiveStrength: 7,
    cost: { unit: '1000', price: 12000 }
  },
  {
    id: 'block_cement_m190',
    name: 'Cement Block M190',
    category: 'masonry_unit',
    type: 'hollow',
    dimensions: { length: 390, width: 190, height: 190 },
    compressiveStrength: 7,
    cost: { unit: '1000', price: 15000 }
  }
]

export const MORTAR_TYPES: import('../../domain/materialTypes').MortarMaterial[] = [
  {
    id: 'mortar_class_ii',
    name: 'Class II Mortar (General Purpose)',
    category: 'mortar',
    class: 'II',
    mixRatio: '1:6',
    cost: { unit: 'm3', price: 1200 }
  }
]

export const PLASTER_TYPES: import('../../domain/materialTypes').PlasterMaterial[] = [
  {
    id: 'plaster_cement_smooth',
    name: 'Cement Plaster (Smooth)',
    category: 'plaster',
    type: 'cement',
    mixRatio: '1:6',
    cost: { unit: 'm2', price: 85 } // Estimated rate/m2 @ 15mm
  }
]


export const ROOF_COVERING_TYPES: import('../../domain/materialTypes').RoofCovering[] = [
  {
      id: 'tile_concrete_double_roman',
      name: 'Concrete Roof Tile (Double Roman)',
      category: 'roof_covering',
      type: 'tile',
      profile: 'double_roman',
      dimensions: { width: 300, length: 420 }, // Effective width often ~300
      massPerArea: 54, // kg/m2 approx
      minPitch: 17.5,
      cost: { unit: '1000', price: 9500 } // R9.50 each
  },
  {
      id: 'sheeting_ibr_058',
      name: 'IBR Sheeting 0.58mm',
      category: 'roof_covering',
      type: 'sheeting',
      profile: 'ibr',
      dimensions: { width: 686 }, // Effective cover
      massPerArea: 5.2, // kg/m2
      minPitch: 5,
      cost: { unit: 'm', price: 145 } // R145 per meter
  },
  {
      id: 'sheeting_corrugated_047',
      name: 'Corrugated Iron 0.47mm',
      category: 'roof_covering',
      type: 'sheeting',
      profile: 'corrugated',
      dimensions: { width: 762 },
      massPerArea: 4.8,
      minPitch: 10,
      cost: { unit: 'm', price: 120 }
  }
]

export const TIMBER_TYPES: import('../../domain/materialTypes').TimberMember[] = [
  {
      id: 'timber_38x38_s5',
      name: 'S5 Timber 38x38 (Batten)',
      category: 'timber',
      grade: 'S5',
      dimensions: { width: 38, depth: 38 },
      cost: { unit: 'm', price: 12 }
  },
  {
      id: 'timber_38x114_s5',
      name: 'S5 Timber 38x114 (Truss)',
      category: 'timber',
      grade: 'S5',
      dimensions: { width: 38, depth: 114 },
      cost: { unit: 'm', price: 45 }
  },
  {
      id: 'timber_50x76_s5',
      name: 'S5 Timber 50x76 (Purlin)',
      category: 'timber',
      grade: 'S5',
      dimensions: { width: 50, depth: 76 },
      cost: { unit: 'm', price: 38 }
  },
  {
      id: 'timber_38x152_s5',
      name: 'S5 Timber 38x152 (Tie Beam)',
      category: 'timber',
      grade: 'S5',
      dimensions: { width: 38, depth: 152 },
      cost: { unit: 'm', price: 65 }
  },
  {
      id: 'timber_38x228_s5',
      name: 'S5 Timber 38x228 (Valley Rafter)',
      category: 'timber',
      grade: 'S5',
      dimensions: { width: 38, depth: 228 },
      cost: { unit: 'm', price: 95 }
  },
  {
      id: 'timber_50x228_s5',
      name: 'S5 Timber 50x228 (Hip Rafter)',
      category: 'timber',
      grade: 'S5',
      dimensions: { width: 50, depth: 228 },
      cost: { unit: 'm', price: 120 }
  }
]

export const HARDWARE_TYPES: import('../../domain/materialTypes').HardwareMaterial[] = [
    {
        id: 'hardware_hurricane_clip',
        name: 'Hurricane Clip (Truss Hanger)',
        category: 'hardware',
        type: 'connector',
        cost: { unit: 'No', price: 15 }
    },
    {
        id: 'hardware_gangnail_plate',
        name: 'Gangnail Plate',
        category: 'hardware',
        type: 'connector',
        cost: { unit: 'No', price: 8 }
    },
    {
        id: 'hardware_bracing_strap',
        name: 'Galvanised Bracing Strap 30x1.2mm',
        category: 'hardware',
        type: 'bracing',
        unitSpec: '30m Roll',
        cost: { unit: 'm', price: 18 }
    }
]

export const DPC_TYPES: import('../../domain/materialTypes').DampProofingMaterial[] = [
  {
      id: 'dpc_250',
      name: 'DPC 250 micron',
      category: 'dpc',
      thickness: 250,
      materialType: 'polythene',
      cost: { unit: 'm2', price: 12 }
  },
  {
      id: 'dpc_375',
      name: 'DPC 375 micron (SANS Standard)',
      category: 'dpc',
      thickness: 375,
      materialType: 'polythene',
      cost: { unit: 'm2', price: 15 }
  },
  {
      id: 'dpm_250',
      name: 'DPM 250 micron (Underfloor)',
      category: 'dpc',
      thickness: 250,
      materialType: 'polythene',
      cost: { unit: 'm2', price: 12 }
  }
]

export const FILL_TYPES: import('../../domain/materialTypes').FillMaterial[] = [
  {
      id: 'fill_hardcore',
      name: 'Hardcore Fill (G5)',
      category: 'fill',
      type: 'g5',
      compactionFactor: 1.3,
      cost: { unit: 'm3', price: 450 }
  },
  {
      id: 'fill_sand',
      name: 'Filling Sand',
      category: 'fill',
      type: 'sand',
      compactionFactor: 1.1,
      cost: { unit: 'm3', price: 250 }
  }
]


export const PRECAST_TYPES: import('../../domain/materialTypes').PrecastMaterial[] = [
  // Beam & Block Components
  {
      id: 'beam_150',
      name: 'Prestressed Concrete Beam 150mm',
      category: 'precast',
      type: 'beam',
      dimensions: { width: 110, height: 150 },
      massPerMeter: 35,
      cost: { unit: 'm', price: 180 }
  },
  {
      id: 'block_hollow_110',
      name: 'Hollow Concrete Block 440x215x110',
      category: 'precast',
      type: 'block',
      dimensions: { length: 440, width: 215, height: 110 },
      cost: { unit: '1000', price: 14000 } // R14 each
  },
  {
      id: 'polystyrene_block_110',
      name: 'Polystyrene Void Former 110mm',
      category: 'precast', // Using precast category for simplicity
      type: 'block',
      dimensions: { length: 1200, width: 440, height: 110 },
      cost: { unit: 'm', price: 95 }
  },
  
  // Hollow Core Slabs
  {
      id: 'hollow_core_150',
      name: 'Hollow Core Slab 150mm',
      category: 'precast',
      type: 'hollow_core_slab',
      dimensions: { width: 1200, height: 150 },
      massPerArea: 250,
      cost: { unit: 'm2', price: 850 }
  },
  {
      id: 'hollow_core_200',
      name: 'Hollow Core Slab 200mm',
      category: 'precast',
      type: 'hollow_core_slab',
      dimensions: { width: 1200, height: 200 },
      massPerArea: 320,
      cost: { unit: 'm2', price: 1100 }
  }
]

export const LINING_TYPES: import('../../domain/materialTypes').LiningMaterial[] = [
  {
      id: 'gypsum_12mm',
      name: 'Gypsum Board 12mm (Standard)',
      category: 'lining',
      type: 'gypsum',
      thickness: 12,
      dimensions: { length: 3000, width: 1200 },
      cost: { unit: 'm2', price: 65 }
  },
  {
      id: 'gypsum_15mm_fire',
      name: 'FireRated Gypsum Board 15mm',
      category: 'lining',
      type: 'gypsum',
      thickness: 15,
      dimensions: { length: 3000, width: 1200 },
      cost: { unit: 'm2', price: 95 }
  },
  {
      id: 'gypsum_moisture',
      name: 'MoistureResistant Gypsum Board 12mm',
      category: 'lining',
      type: 'gypsum',
      thickness: 12,
      dimensions: { length: 3000, width: 1200 },
      cost: { unit: 'm2', price: 85 }
  }
]

export const STEEL_SECTION_TYPES: import('../../domain/materialTypes').SteelSectionMaterial[] = [
  {
      id: 'stud_64',
      name: 'Steel Stud 64mm',
      category: 'steel_section',
      type: 'stud',
      profile: '64mm',
      length: 3000,
      cost: { unit: 'm', price: 28 }
  },
  {
      id: 'track_64',
      name: 'Steel Track 64mm',
      category: 'steel_section',
      type: 'track',
      profile: '64mm',
      length: 3000,
      cost: { unit: 'm', price: 26 }
  },
  {
      id: 'stud_102',
      name: 'Steel Stud 102mm',
      category: 'steel_section',
      type: 'stud',
      profile: '102mm',
      length: 3000,
      cost: { unit: 'm', price: 38 }
  },
  {
      id: 'track_102',
      name: 'Steel Track 102mm',
      category: 'steel_section',
      type: 'track',
      profile: '102mm',
      length: 3000,
      cost: { unit: 'm', price: 35 }
  }
]

export const INSULATION_TYPES: import('../../domain/materialTypes').InsulationMaterial[] = [
  {
      id: 'insulation_cavity_50',
      name: 'Cavity Batt Insulation 51mm',
      category: 'insulation',
      type: 'board',
      rValue: 1.34,
      thickness: 51,
      cost: { unit: 'm2', price: 55 }
  },
  {
      id: 'insulation_cavity_63',
      name: 'Cavity Batt Insulation 63mm',
      category: 'insulation',
      type: 'board',
      rValue: 1.6,
      thickness: 63,
      cost: { unit: 'm2', price: 65 }
  }
]

export const ICF_TYPES: import('../../domain/materialTypes').ICFMaterial[] = [
  {
      id: 'icf_block_standard',
      name: 'Standard ICF Block',
      category: 'icf_unit',
      coreWidth: 150,
      dimensions: { length: 1200, height: 300, width: 280 }, // 65mm panels + 150 core
      cost: { unit: 'm2', price: 450 } // Price per m2 of wall area
  },
  {
      id: 'icf_block_corner',
      name: 'Corner ICF Block',
      category: 'icf_unit',
      coreWidth: 150,
      dimensions: { length: 800, height: 300, width: 280 },
      cost: { unit: 'No', price: 180 }
  }
]

export const MaterialDatabase = {
  concrete: CONCRETE_TYPES,
  reinforcement: REINFORCEMENT_TYPES,
  masonry: MASONRY_TYPES,
  mortar: MORTAR_TYPES,
  plaster: PLASTER_TYPES,
  roofing: ROOF_COVERING_TYPES,
  timber: TIMBER_TYPES,
  dpc: DPC_TYPES,
  fill: FILL_TYPES,
  precast: PRECAST_TYPES,
  lining: LINING_TYPES,
  steel_section: STEEL_SECTION_TYPES,
  insulation: INSULATION_TYPES,
  icf: ICF_TYPES,
  hardware: HARDWARE_TYPES,
  
  getMaterial: (id: string) => {
    const all = [
        ...CONCRETE_TYPES, 
        ...REINFORCEMENT_TYPES, 
        ...MASONRY_TYPES, 
        ...MORTAR_TYPES, 
        ...PLASTER_TYPES,
        ...ROOF_COVERING_TYPES,
        ...TIMBER_TYPES,
        ...DPC_TYPES,
        ...FILL_TYPES,
        ...PRECAST_TYPES,
        ...LINING_TYPES,
        ...STEEL_SECTION_TYPES,
        ...INSULATION_TYPES,
        ...ICF_TYPES,
        ...HARDWARE_TYPES
    ]
    // @ts-ignore
    return all.find(m => m.id === id)
  }
}
