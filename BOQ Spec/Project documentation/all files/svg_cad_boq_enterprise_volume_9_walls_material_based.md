# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification
## Volume IX — Wall Systems: Material-Based Parametric Construction & BOQ Integration

**Version:** 9.0  
**Revision Date:** 2026-02-18  
**Document Type:** Enterprise Engineering Specification  

---

# 1. Document Control

- **Version:** 9.0
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** __________________

---

# 2. Scope

Volume IX defines the **Complete Wall System with Material-Based Parametric Construction** for the SVG-Based Parametric CAD & BOQ Platform.

This document establishes:

- **Material-First Architecture**: Wall thickness calculated from actual brick/block dimensions, mortar joints, and plaster
- **Real Construction Sequences**: DPC placement, cavity formation, insulation, ties
- **Dual-Mode System**: Standard (auto SANS-compliant) and Engineer (custom structural)
- **Complete Material Library**: All South African brick/block types with actual dimensions
- **SANS Construction Compliance**: Mortar joints, DPC, cavity walls, ties, lintels
- **Accurate BOQ Generation**: Based on actual unit counts, mortar volumes, plaster areas
- **Multi-Skin Walls**: Single skin, cavity walls, double skin, with accurate calculations
- **Wall Opening Integration**: Lintels, sills, reveals with proper construction details

---

# 3. Strategic Objective

The wall system must:

- **Build walls from actual materials** - not abstract thickness values
- **Calculate thickness automatically** from brick + mortar + plaster + cavity dimensions
- **Follow real construction sequences** - foundation → DPC → brickwork → cavity → ties → plaster
- **Generate accurate material quantities** - brick count, mortar volume, plaster area
- **Ensure SANS compliance** at every construction stage
- **Support both standard and engineered walls** with appropriate parameters
- **Integrate with foundations** (starter bars, DPC continuity)
- **Integrate with openings** (lintels, reveals, sills)
- **Provide construction details** in section views

---

# 4. Material Library - Actual Dimensions

## 4.1 Brick Types (South African Standard)

```ts
interface BrickType {
  id: string;
  name: string;
  category: 'clay' | 'concrete' | 'calcium_silicate';
  
  // Actual work size (industry standard in SA)
  dimensions: {
    length: number;      // mm (work size)
    width: number;       // mm (work size)  
    height: number;      // mm (work size)
  };
  
  // Coordinating size (work size + mortar)
  coordinating: {
    length: number;      // mm (typically work + 10mm joint)
    height: number;      // mm (typically work + 10mm joint)
  };
  
  strength: {
    grade: '3.5MPa' | '7MPa' | '10MPa' | '14MPa' | '20MPa';
    compressiveStrength: number; // MPa
  };
  
  weight: {
    dry: number;         // kg per unit
    saturated: number;   // kg per unit
  };
  
  absorption: number;    // % water absorption
  
  thermal: {
    conductivity: number; // W/mK
    resistance: number;   // m²K/W
  };
  
  cost: {
    unitPrice: number;   // ZAR per brick
    per1000: number;     // ZAR per 1000 bricks
  };
}

// Expanded to include ALL wall system types
type WallSystemCategory = 
  | 'masonry'           // Brick/block traditional
  | 'drywall'           // Timber/steel frame + gypsum
  | 'concrete_panel'    // Precast/tilt-up
  | 'icf'               // Insulated concrete forms
  | 'steel_frame'       // Light steel frame
  | 'timber_frame'      // Timber frame
  | 'sandwich_panel'    // Composite panels
  | 'curtain_wall'      // Glass/metal facades
  | 'rammed_earth'      // Alternative construction
  | 'sip';              // Structural insulated panels

const BRICK_LIBRARY: BrickType[] = [
  {
    id: 'clay_stock_brick',
    name: 'Clay Stock Brick',
    category: 'clay',
    dimensions: {
      length: 222,  // mm work size
      width: 106,   // mm work size
      height: 73    // mm work size
    },
    coordinating: {
      length: 232,  // mm (222 + 10mm joint)
      height: 83    // mm (73 + 10mm joint)
    },
    strength: {
      grade: '7MPa',
      compressiveStrength: 7
    },
    weight: {
      dry: 3.1,
      saturated: 3.5
    },
    absorption: 12,
    thermal: {
      conductivity: 0.77,
      resistance: 0.138
    },
    cost: {
      unitPrice: 2.50,
      per1000: 2400
    }
  },
  
  {
    id: 'clay_face_brick',
    name: 'Clay Face Brick (Standard)',
    category: 'clay',
    dimensions: {
      length: 222,
      width: 106,
      height: 73
    },
    coordinating: {
      length: 232,
      height: 83
    },
    strength: {
      grade: '10MPa',
      compressiveStrength: 10
    },
    weight: {
      dry: 3.2,
      saturated: 3.6
    },
    absorption: 10,
    thermal: {
      conductivity: 0.84,
      resistance: 0.126
    },
    cost: {
      unitPrice: 4.20,
      per1000: 4100
    }
  },
  
  {
    id: 'clay_face_brick_maxi',
    name: 'Clay Face Brick (Maxi)',
    category: 'clay',
    dimensions: {
      length: 290,  // Larger format
      width: 140,
      height: 90
    },
    coordinating: {
      length: 300,
      height: 100
    },
    strength: {
      grade: '14MPa',
      compressiveStrength: 14
    },
    weight: {
      dry: 5.8,
      saturated: 6.4
    },
    absorption: 8,
    thermal: {
      conductivity: 0.84,
      resistance: 0.167
    },
    cost: {
      unitPrice: 6.80,
      per1000: 6600
    }
  },
  
  {
    id: 'concrete_block_standard',
    name: 'Concrete Block (Standard Hollow)',
    category: 'concrete',
    dimensions: {
      length: 390,  // Standard SA block
      width: 140,
      height: 190
    },
    coordinating: {
      length: 400,
      height: 200
    },
    strength: {
      grade: '7MPa',
      compressiveStrength: 7
    },
    weight: {
      dry: 16.5,
      saturated: 18.2
    },
    absorption: 10,
    thermal: {
      conductivity: 0.51,
      resistance: 0.275
    },
    cost: {
      unitPrice: 12.50,
      per1000: 12200
    }
  },
  
  {
    id: 'concrete_block_solid',
    name: 'Concrete Block (Solid)',
    category: 'concrete',
    dimensions: {
      length: 390,
      width: 140,
      height: 190
    },
    coordinating: {
      length: 400,
      height: 200
    },
    strength: {
      grade: '10MPa',
      compressiveStrength: 10
    },
    weight: {
      dry: 21.0,
      saturated: 23.5
    },
    absorption: 12,
    thermal: {
      conductivity: 1.28,
      resistance: 0.109
    },
    cost: {
      unitPrice: 14.80,
      per1000: 14500
    }
  },
  
  {
    id: 'concrete_block_90mm',
    name: 'Concrete Block (90mm Partition)',
    category: 'concrete',
    dimensions: {
      length: 390,
      width: 90,
      height: 190
    },
    coordinating: {
      length: 400,
      height: 200
    },
    strength: {
      grade: '7MPa',
      compressiveStrength: 7
    },
    weight: {
      dry: 10.8,
      saturated: 12.0
    },
    absorption: 10,
    thermal: {
      conductivity: 0.51,
      resistance: 0.176
    },
    cost: {
      unitPrice: 9.20,
      per1000: 9000
    }
  },
  
  {
    id: 'calcium_silicate_brick',
    name: 'Calcium Silicate Brick',
    category: 'calcium_silicate',
    dimensions: {
      length: 222,
      width: 106,
      height: 73
    },
    coordinating: {
      length: 232,
      height: 83
    },
    strength: {
      grade: '14MPa',
      compressiveStrength: 14
    },
    weight: {
      dry: 3.4,
      saturated: 3.7
    },
    absorption: 8,
    thermal: {
      conductivity: 1.00,
      resistance: 0.106
    },
    cost: {
      unitPrice: 3.80,
      per1000: 3700
    }
  }
];
```

## 4.2 Mortar Types

```ts
interface MortarType {
  id: string;
  name: string;
  mix: string; // e.g., "1:4 cement:sand"
  
  classification: 'I' | 'II' | 'III' | 'IV';
  
  strength: {
    grade: string;
    compressiveStrength: number; // MPa at 28 days
  };
  
  usage: string[];
  
  jointThickness: {
    typical: number;    // mm
    minimum: number;    // mm
    maximum: number;    // mm
  };
  
  coverage: {
    per50kgCement: number; // m² (for 10mm joint)
    per1m3Mortar: number;  // m² of brickwork
  };
  
  cost: {
    perM3: number; // ZAR
  };
}

const MORTAR_LIBRARY: MortarType[] = [
  {
    id: 'class_i',
    name: 'Class I Mortar',
    mix: '1:3 cement:sand',
    classification: 'I',
    strength: {
      grade: 'M12',
      compressiveStrength: 12
    },
    usage: [
      'Highly stressed masonry',
      'Below ground work',
      'Foundations',
      'Retaining walls',
      'Heavy loading'
    ],
    jointThickness: {
      typical: 10,
      minimum: 8,
      maximum: 12
    },
    coverage: {
      per50kgCement: 4.2,
      per1m3Mortar: 240
    },
    cost: {
      perM3: 850
    }
  },
  
  {
    id: 'class_ii',
    name: 'Class II Mortar',
    mix: '1:4 cement:sand',
    classification: 'II',
    strength: {
      grade: 'M6',
      compressiveStrength: 6
    },
    usage: [
      'General purpose',
      'External walls above DPC',
      'Load bearing walls',
      'Moderately stressed masonry'
    ],
    jointThickness: {
      typical: 10,
      minimum: 8,
      maximum: 12
    },
    coverage: {
      per50kgCement: 5.3,
      per1m3Mortar: 240
    },
    cost: {
      perM3: 720
    }
  },
  
  {
    id: 'class_iii',
    name: 'Class III Mortar',
    mix: '1:6 cement:sand',
    classification: 'III',
    strength: {
      grade: 'M4',
      compressiveStrength: 4
    },
    usage: [
      'Internal walls',
      'Partition walls',
      'Lightly loaded walls',
      'Above ground non-structural'
    ],
    jointThickness: {
      typical: 10,
      minimum: 8,
      maximum: 12
    },
    coverage: {
      per50kgCement: 7.0,
      per1m3Mortar: 240
    },
    cost: {
      perM3: 620
    }
  },
  
  {
    id: 'class_iv',
    name: 'Class IV Mortar',
    mix: '1:8 cement:sand + lime',
    classification: 'IV',
    strength: {
      grade: 'M2',
      compressiveStrength: 2
    },
    usage: [
      'Internal non-load bearing',
      'Partition walls only',
      'Not for external use'
    ],
    jointThickness: {
      typical: 10,
      minimum: 8,
      maximum: 12
    },
    coverage: {
      per50kgCement: 8.5,
      per1m3Mortar: 240
    },
    cost: {
      perM3: 550
    }
  }
];
```

## 4.3 Plaster Types

```ts
interface PlasterType {
  id: string;
  name: string;
  mix: string;
  
  thickness: {
    typical: number;    // mm
    minimum: number;    // mm
    maximum: number;    // mm
  };
  
  coats: {
    scratch?: number;   // mm (if multi-coat)
    brown?: number;     // mm (if multi-coat)
    finish: number;     // mm
    total: number;      // mm
  };
  
  application: 'internal' | 'external' | 'both';
  
  coverage: {
    perM2: number;      // kg/m² for typical thickness
    per50kgBag: number; // m² per bag
  };
  
  cost: {
    materialPerM2: number; // ZAR
    labourPerM2: number;   // ZAR
    totalPerM2: number;    // ZAR
  };
}

const PLASTER_LIBRARY: PlasterType[] = [
  {
    id: 'cement_plaster_internal',
    name: 'Cement Plaster (Internal)',
    mix: '1:4 cement:sand',
    thickness: {
      typical: 15,
      minimum: 10,
      maximum: 20
    },
    coats: {
      finish: 15,
      total: 15
    },
    application: 'internal',
    coverage: {
      perM2: 22.5,      // kg per m² for 15mm
      per50kgBag: 2.2   // m² per 50kg bag
    },
    cost: {
      materialPerM2: 28,
      labourPerM2: 45,
      totalPerM2: 73
    }
  },
  
  {
    id: 'cement_plaster_external',
    name: 'Cement Plaster (External)',
    mix: '1:3 cement:sand',
    thickness: {
      typical: 20,
      minimum: 15,
      maximum: 25
    },
    coats: {
      scratch: 10,
      finish: 10,
      total: 20
    },
    application: 'external',
    coverage: {
      perM2: 30,        // kg per m² for 20mm
      per50kgBag: 1.67  // m² per 50kg bag
    },
    cost: {
      materialPerM2: 38,
      labourPerM2: 55,
      totalPerM2: 93
    }
  },
  
  {
    id: 'rhinolite',
    name: 'Rhinolite (Gypsum Plaster)',
    mix: 'Pre-mixed gypsum',
    thickness: {
      typical: 13,
      minimum: 10,
      maximum: 15
    },
    coats: {
      finish: 13,
      total: 13
    },
    application: 'internal',
    coverage: {
      perM2: 15.6,      // kg per m² for 13mm
      per50kgBag: 3.2   // m² per 50kg bag
    },
    cost: {
      materialPerM2: 42,
      labourPerM2: 38,
      totalPerM2: 80
    }
  },
  
  {
    id: 'skim_coat',
    name: 'Skim Coat (Finishing)',
    mix: 'Pre-mixed skim',
    thickness: {
      typical: 2,
      minimum: 1,
      maximum: 3
    },
    coats: {
      finish: 2,
      total: 2
    },
    application: 'internal',
    coverage: {
      perM2: 1.8,
      per50kgBag: 27.8
    },
    cost: {
      materialPerM2: 15,
      labourPerM2: 22,
      totalPerM2: 37
    }
  }
];
```

## 4.4 DPC Materials

```ts
interface DPCType {
  id: string;
  name: string;
  material: 'polythene' | 'bituminous' | 'slate' | 'engineering_brick';
  
  thickness: number;  // mm
  
  width: {
    forWallThickness: number; // mm (wall it's designed for)
    actual: number;           // mm (DPC width, typically wall + 50mm)
  };
  
  laps: {
    minimum: number;  // mm
    typical: number;  // mm
  };
  
  strength: {
    tensile: number;  // N/mm (if applicable)
    tear: number;     // N (if applicable)
  };
  
  placement: 'continuous' | 'stepped';
  
  cost: {
    perLinearMeter: number; // ZAR per m
  };
}

const DPC_LIBRARY: DPCType[] = [
  {
    id: 'dpc_375_micron',
    name: '375 Micron Polythene DPC',
    material: 'polythene',
    thickness: 0.375,
    width: {
      forWallThickness: 230,
      actual: 280  // Wall + 50mm overhang
    },
    laps: {
      minimum: 100,
      typical: 150
    },
    strength: {
      tensile: 15,
      tear: 120
    },
    placement: 'continuous',
    cost: {
      perLinearMeter: 8.50
    }
  },
  
  {
    id: 'dpc_500_micron',
    name: '500 Micron Polythene DPC',
    material: 'polythene',
    thickness: 0.5,
    width: {
      forWallThickness: 230,
      actual: 280
    },
    laps: {
      minimum: 100,
      typical: 150
    },
    strength: {
      tensile: 20,
      tear: 160
    },
    placement: 'continuous',
    cost: {
      perLinearMeter: 11.20
    }
  },
  
  {
    id: 'dpc_bituminous',
    name: 'Bituminous Felt DPC',
    material: 'bituminous',
    thickness: 3,
    width: {
      forWallThickness: 230,
      actual: 280
    },
    laps: {
      minimum: 100,
      typical: 150
    },
    strength: {
      tensile: 0,
      tear: 0
    },
    placement: 'continuous',
    cost: {
      perLinearMeter: 18.50
    }
  }
];
```

## 4.5 Cavity Wall Components

```ts
interface CavityWallComponents {
  ties: CavityTieType[];
  insulation: CavityInsulationType[];
  closers: CavityCloserType[];
}

interface CavityTieType {
  id: string;
  name: string;
  material: 'galvanised_steel' | 'stainless_steel';
  type: 'butterfly' | 'vertical_twist' | 'double_triangle';
  
  forCavityWidth: {
    minimum: number; // mm
    maximum: number; // mm
  };
  
  spacing: {
    horizontal: number;  // mm
    vertical: number;    // mm
    perM2: number;       // ties per m²
  };
  
  drip: boolean;  // Has water drip feature
  
  cost: {
    perUnit: number;  // ZAR
  };
}

const CAVITY_TIE_LIBRARY: CavityTieType[] = [
  {
    id: 'butterfly_tie_50mm',
    name: 'Butterfly Tie (50mm cavity)',
    material: 'galvanised_steel',
    type: 'butterfly',
    forCavityWidth: {
      minimum: 50,
      maximum: 75
    },
    spacing: {
      horizontal: 900,
      vertical: 450,
      perM2: 2.5
    },
    drip: false,
    cost: {
      perUnit: 1.80
    }
  },
  
  {
    id: 'vertical_twist_tie',
    name: 'Vertical Twist Tie with Drip',
    material: 'galvanised_steel',
    type: 'vertical_twist',
    forCavityWidth: {
      minimum: 50,
      maximum: 100
    },
    spacing: {
      horizontal: 900,
      vertical: 450,
      perM2: 2.5
    },
    drip: true,
    cost: {
      perUnit: 2.40
    }
  }
];

interface CavityInsulationType {
  id: string;
  name: string;
  material: 'polystyrene' | 'polyurethane' | 'mineral_wool';
  
  thickness: number;  // mm
  
  thermal: {
    rValue: number;         // m²K/W
    conductivity: number;   // W/mK
  };
  
  coverage: {
    perSheet: number;  // m² (if board)
  };
  
  cost: {
    perM2: number;  // ZAR
  };
}
```

---

# 5. Wall Construction Model - Material-Based

## 5.1 Wall Layer Structure

```ts
interface WallLayer {
  id: string;
  sequence: number;  // Build order (1 = first layer)
  
  type: 'brick_skin' | 'cavity' | 'insulation' | 'plaster' | 'dpc' | 'air_gap';
  
  // If brick/block skin
  brickwork?: {
    brickType: string;        // Reference to BRICK_LIBRARY id
    bond: BondPattern;
    orientation: 'stretcher' | 'header' | 'soldier';
    thickness: number;        // Calculated from brick dimensions
    
    mortar: {
      type: string;          // Reference to MORTAR_LIBRARY id
      jointThickness: number; // mm (horizontal and vertical)
      jointFinish: 'flush' | 'weathered' | 'recessed' | 'struck';
    };
    
    // Reinforcement (if required)
    reinforcement?: {
      type: 'brickforce' | 'ladder' | 'truss';
      spacing: number;       // mm (vertical spacing in courses)
      specification: string;
    };
  };
  
  // If cavity
  cavity?: {
    width: number;           // mm
    ventilated: boolean;
    weepholes: {
      spacing: number;       // mm horizontal
      height: number;        // mm above DPC
      type: 'open_perpend' | 'plastic_vent';
    };
    ties: {
      type: string;          // Reference to CAVITY_TIE_LIBRARY
      spacingH: number;      // mm horizontal
      spacingV: number;      // mm vertical
    };
  };
  
  // If insulation
  insulation?: {
    type: string;            // Reference to insulation library
    thickness: number;       // mm
    position: 'cavity' | 'internal' | 'external';
  };
  
  // If plaster
  plaster?: {
    type: string;            // Reference to PLASTER_LIBRARY id
    thickness: number;       // mm
    coats: number;
    finish: 'smooth' | 'textured' | 'bagged';
  };
  
  // If DPC
  dpc?: {
    type: string;            // Reference to DPC_LIBRARY id
    position: 'horizontal' | 'vertical' | 'cavity_tray';
    laps: number;            // mm
  };
}

interface WallConstruction {
  id: string;
  name: string;
  layers: WallLayer[];     // Ordered from outside to inside
  
  // Auto-calculated total thickness
  totalThickness: number;  // mm (sum of all layer thicknesses)
  
  // Wall classification
  classification: {
    structural: 'load_bearing' | 'non_load_bearing';
    thermal: 'standard' | 'insulated' | 'high_performance';
    acoustic: 'standard' | 'enhanced';
    fire: 'standard' | 'fire_rated';
    moisture: 'standard' | 'cavity_wall' | 'tanked';
  };
  
  // Performance values
  performance: {
    rValue: number;              // m²K/W (thermal resistance)
    uValue: number;              // W/m²K (thermal transmittance)
    soundReduction: number;      // dB
    fireRating: number;          // minutes
    loadCapacity: number;        // kN/m (if load bearing)
  };
}
```

## 5.2 Bond Patterns

```ts
interface BondPattern {
  type: 'stretcher' | 'english' | 'flemish' | 'header' | 'stack';
  
  pattern: {
    coursePattern: string[];  // Pattern repeat (e.g., ["stretcher", "stretcher", "header"])
    repeatEvery: number;      // courses
  };
  
  brickOrientation: {
    stretchers: number;  // Number of stretchers per course
    headers: number;     // Number of headers per course
  };
  
  wastage: number;  // % additional bricks due to cutting
}

const BOND_PATTERNS: BondPattern[] = [
  {
    type: 'stretcher',
    pattern: {
      coursePattern: ['stretcher'],
      repeatEvery: 1
    },
    brickOrientation: {
      stretchers: 100,
      headers: 0
    },
    wastage: 5
  },
  
  {
    type: 'english',
    pattern: {
      coursePattern: ['stretcher', 'header'],
      repeatEvery: 2
    },
    brickOrientation: {
      stretchers: 50,
      headers: 50
    },
    wastage: 8
  },
  
  {
    type: 'flemish',
    pattern: {
      coursePattern: ['stretcher-header-alternating'],
      repeatEvery: 1
    },
    brickOrientation: {
      stretchers: 66,
      headers: 33
    },
    wastage: 10
  }
];
```

---

# 6. Standard Wall Constructions (Predefined)

## 6.1 Standard Single Skin External Wall

```ts
const STANDARD_EXTERNAL_WALL_SINGLE_SKIN: WallConstruction = {
  id: 'std_ext_single_230',
  name: 'Standard External Wall - Single Skin 230mm',
  
  layers: [
    // Layer 1: External plaster
    {
      id: 'layer_1',
      sequence: 1,
      type: 'plaster',
      plaster: {
        type: 'cement_plaster_external',
        thickness: 20,
        coats: 2,
        finish: 'smooth'
      }
    },
    
    // Layer 2: Brickwork
    {
      id: 'layer_2',
      sequence: 2,
      type: 'brick_skin',
      brickwork: {
        brickType: 'clay_stock_brick',
        bond: BOND_PATTERNS.find(b => b.type === 'stretcher'),
        orientation: 'stretcher',
        thickness: 230,  // Calculated: 2 brick widths (106) + 1 joint (10) + mortar beds = 230mm
        
        mortar: {
          type: 'class_ii',
          jointThickness: 10,
          jointFinish: 'flush'
        }
      }
    },
    
    // Layer 3: Internal plaster
    {
      id: 'layer_3',
      sequence: 3,
      type: 'plaster',
      plaster: {
        type: 'cement_plaster_internal',
        thickness: 15,
        coats: 1,
        finish: 'smooth'
      }
    }
  ],
  
  // Auto-calculated: 20 + 230 + 15 = 265mm
  totalThickness: 265,
  
  classification: {
    structural: 'load_bearing',
    thermal: 'standard',
    acoustic: 'standard',
    fire: 'standard',
    moisture: 'standard'
  },
  
  performance: {
    rValue: 0.45,
    uValue: 2.22,
    soundReduction: 45,
    fireRating: 120,
    loadCapacity: 180  // kN/m (for 7MPa brick)
  }
};
```

## 6.2 Standard Cavity Wall

```ts
const STANDARD_CAVITY_WALL: WallConstruction = {
  id: 'std_cavity_wall',
  name: 'Standard Cavity Wall - 290mm Total',
  
  layers: [
    // Layer 1: External plaster
    {
      id: 'layer_1',
      sequence: 1,
      type: 'plaster',
      plaster: {
        type: 'cement_plaster_external',
        thickness: 20,
        coats: 2,
        finish: 'smooth'
      }
    },
    
    // Layer 2: External brick skin
    {
      id: 'layer_2',
      sequence: 2,
      type: 'brick_skin',
      brickwork: {
        brickType: 'clay_face_brick',
        bond: BOND_PATTERNS.find(b => b.type === 'stretcher'),
        orientation: 'stretcher',
        thickness: 106,  // Single brick width
        
        mortar: {
          type: 'class_ii',
          jointThickness: 10,
          jointFinish: 'weathered'
        }
      }
    },
    
    // Layer 3: Cavity with insulation
    {
      id: 'layer_3',
      sequence: 3,
      type: 'cavity',
      cavity: {
        width: 50,
        ventilated: true,
        weepholes: {
          spacing: 900,
          height: 150,
          type: 'open_perpend'
        },
        ties: {
          type: 'vertical_twist_tie',
          spacingH: 900,
          spacingV: 450
        }
      }
    },
    
    // Layer 4: Cavity insulation (partial fill)
    {
      id: 'layer_4',
      sequence: 4,
      type: 'insulation',
      insulation: {
        type: 'polystyrene_board',
        thickness: 30,  // Partial fill, leaving 20mm air gap
        position: 'cavity'
      }
    },
    
    // Layer 5: Internal brick skin
    {
      id: 'layer_5',
      sequence: 5,
      type: 'brick_skin',
      brickwork: {
        brickType: 'concrete_block_standard',
        bond: BOND_PATTERNS.find(b => b.type === 'stretcher'),
        orientation: 'stretcher',
        thickness: 140,  // Block width
        
        mortar: {
          type: 'class_iii',
          jointThickness: 10,
          jointFinish: 'flush'
        }
      }
    },
    
    // Layer 6: Internal plaster
    {
      id: 'layer_6',
      sequence: 6,
      type: 'plaster',
      plaster: {
        type: 'rhinolite',
        thickness: 13,
        coats: 1,
        finish: 'smooth'
      }
    }
  ],
  
  // Auto-calculated: 20 + 106 + 50 + 140 + 13 = 329mm
  totalThickness: 329,
  
  classification: {
    structural: 'load_bearing',
    thermal: 'insulated',
    acoustic: 'enhanced',
    fire: 'standard',
    moisture: 'cavity_wall'
  },
  
  performance: {
    rValue: 1.85,
    uValue: 0.54,
    soundReduction: 52,
    fireRating: 180,
    loadCapacity: 250
  }
};
```

## 6.3 Standard Internal Partition Wall

```ts
const STANDARD_INTERNAL_PARTITION: WallConstruction = {
  id: 'std_int_partition',
  name: 'Standard Internal Partition - 115mm',
  
  layers: [
    // Layer 1: Plaster (one side)
    {
      id: 'layer_1',
      sequence: 1,
      type: 'plaster',
      plaster: {
        type: 'rhinolite',
        thickness: 13,
        coats: 1,
        finish: 'smooth'
      }
    },
    
    // Layer 2: Brickwork
    {
      id: 'layer_2',
      sequence: 2,
      type: 'brick_skin',
      brickwork: {
        brickType: 'clay_stock_brick',
        bond: BOND_PATTERNS.find(b => b.type === 'stretcher'),
        orientation: 'stretcher',
        thickness: 115,  // Half brick (laid on edge): brick length (222/2) = 111mm + joints
        
        mortar: {
          type: 'class_iii',
          jointThickness: 10,
          jointFinish: 'flush'
        }
      }
    },
    
    // Layer 3: Plaster (other side)
    {
      id: 'layer_3',
      sequence: 3,
      type: 'plaster',
      plaster: {
        type: 'rhinolite',
        thickness: 13,
        coats: 1,
        finish: 'smooth'
      }
    }
  ],
  
  // Auto-calculated: 13 + 115 + 13 = 141mm
  totalThickness: 141,
  
  classification: {
    structural: 'non_load_bearing',
    thermal: 'standard',
    acoustic: 'standard',
    fire: 'standard',
    moisture: 'standard'
  },
  
  performance: {
    rValue: 0.28,
    uValue: 3.57,
    soundReduction: 38,
    fireRating: 60,
    loadCapacity: 0  // Non-load bearing
  }
};
```

---

# 7. Wall Data Model - Material-Based

## 7.1 Complete Wall Definition

```ts
interface Wall {
  id: string;
  
  // Geometry
  geometry: {
    start: Point3D;
    end: Point3D;
    baseLevel: number;     // mm (typically 0 = FFL)
    height: number;        // mm (floor to floor)
    length: number;        // mm (calculated from start/end)
  };
  
  // Construction definition (NOT thickness!)
  construction: WallConstruction; // Reference to full material stack
  
  // Auto-calculated from construction
  thickness: number;  // mm (sum of all layers)
  
  // Wall type and function
  type: {
    structural: 'load_bearing' | 'non_load_bearing' | 'shear' | 'retaining';
    location: 'external' | 'internal' | 'party';
    function: 'facade' | 'partition' | 'core' | 'boundary';
  };
  
  // Foundation connection
  foundation: {
    type: 'strip_footing' | 'beam' | 'raft';
    foundationId: string;
    
    // DPC details
    dpc: {
      height: number;        // mm above foundation top
      type: string;          // Reference to DPC_LIBRARY
      continuous: boolean;
      stepped: boolean;
      stepDetails?: {
        riserHeight: number; // mm
        treadLength: number; // mm
      }[];
    };
    
    // Starter bars (if required)
    starterBars?: {
      size: 'Y10' | 'Y12' | 'Y16';
      spacing: number;       // mm
      projection: number;    // mm into wall
    };
  };
  
  // Openings in wall
  openings: WallOpening[];
  
  // Design mode
  designMode: {
    mode: 'standard' | 'engineer';
    engineerSignature?: EngineerSignature;
  };
  
  // Loading (if load bearing)
  loading?: {
    deadLoad: number;      // kN/m
    liveLoad: number;      // kN/m
    roofLoad: number;      // kN/m
    totalLoad: number;     // kN/m
    eccentricity: number;  // mm
  };
}
```

## 7.2 Wall Opening Definition

```ts
interface WallOpening {
  id: string;
  wallId: string;
  
  type: 'door' | 'window' | 'garage' | 'service_opening';
  
  // Position and size
  position: {
    distanceFromStart: number;  // mm along wall
    sillHeight: number;         // mm above FFL
  };
  
  dimensions: {
    width: number;              // mm (clear opening)
    height: number;             // mm (clear opening)
    
    // Reveal details (calculated from wall construction)
    revealDepth: number;        // mm (wall thickness)
    revealFinish: 'plaster' | 'face_brick' | 'paint' | 'tile';
  };
  
  // Lintel specification
  lintel: {
    type: 'precast' | 'cast_in_place' | 'steel' | 'brick_arch';
    
    // If precast
    precast?: {
      size: string;          // e.g., "230x150x1200"
      bearing: number;       // mm each end (SANS min 150mm)
      reference: string;     // Manufacturer reference
    };
    
    // If cast-in-place
    castInPlace?: {
      width: number;         // mm (match wall)
      depth: number;         // mm
      length: number;        // mm (opening + 2×bearing)
      concrete: {
        grade: '25MPa' | '30MPa';
        volume: number;      // m³
      };
      reinforcement: {
        topBars: RebarSpec[];
        bottomBars: RebarSpec[];
        stirrups: RebarSpec;
      };
    };
    
    // If steel
    steel?: {
      section: string;       // e.g., "IPE 200"
      length: number;        // mm
      coating: 'galvanised' | 'painted';
    };
  };
  
  // Sill specification (windows only)
  sill?: {
    type: 'precast' | 'cast_in_place' | 'tile' | 'stone';
    projection: number;      // mm beyond face of wall
    drip: boolean;
    weathering: 'sloped' | 'flat';
  };
  
  // Frame details
  frame: {
    material: 'timber' | 'steel' | 'aluminium' | 'uPVC';
    profile: string;
    fixing: {
      method: 'frame_anchors' | 'lugs' | 'screws';
      spacing: number;       // mm
    };
  };
}
```

---

# 8. Brick/Block Quantity Calculations

## 8.1 Calculation Methodology

```ts
interface BrickCalculation {
  wallArea: number;          // m² (gross wall area)
  openingArea: number;       // m² (total openings)
  netArea: number;           // m² (wall - openings)
  
  // Brick/block quantities
  brickDimensions: {
    length: number;          // mm (work size)
    height: number;          // mm (work size)
    coordLength: number;     // mm (work + joint)
    coordHeight: number;     // mm (work + joint)
  };
  
  // Units per m²
  unitsPerM2: number;        // Calculated from coordinating dimensions
  
  // Total requirements
  grossUnits: number;        // Units for net area
  wastage: number;           // % (bond pattern dependent)
  totalUnits: number;        // Gross + wastage
  
  // Packaged quantities
  unitsPerPallet: number;    // Typical pallet size
  palletsRequired: number;   // Rounded up
  orderQuantity: number;     // Total units to order
}

function calculateBrickQuantity(
  wall: Wall,
  layer: WallLayer
): BrickCalculation {
  const brick = BRICK_LIBRARY.find(b => b.id === layer.brickwork.brickType);
  const bond = layer.brickwork.bond;
  
  // Calculate wall area
  const wallArea = (wall.geometry.length / 1000) * (wall.geometry.height / 1000);
  
  // Calculate opening areas
  const openingArea = wall.openings.reduce((sum, opening) => {
    return sum + (opening.dimensions.width / 1000) * (opening.dimensions.height / 1000);
  }, 0);
  
  const netArea = wallArea - openingArea;
  
  // Units per m² calculation
  // Formula: 1 / (coordinating length in m × coordinating height in m)
  const unitsPerM2 = 1 / (
    (brick.coordinating.length / 1000) * 
    (brick.coordinating.height / 1000)
  );
  
  // Gross units
  const grossUnits = netArea * unitsPerM2;
  
  // Wastage from bond pattern + general wastage
  const wastagePercent = bond.wastage + 5; // Bond wastage + 5% general
  
  // Total units
  const totalUnits = Math.ceil(grossUnits * (1 + wastagePercent / 100));
  
  // Packaging (typical brick pallet = 500 units)
  const unitsPerPallet = 500;
  const palletsRequired = Math.ceil(totalUnits / unitsPerPallet);
  const orderQuantity = palletsRequired * unitsPerPallet;
  
  return {
    wallArea,
    openingArea,
    netArea,
    brickDimensions: {
      length: brick.dimensions.length,
      height: brick.dimensions.height,
      coordLength: brick.coordinating.length,
      coordHeight: brick.coordinating.height
    },
    unitsPerM2,
    grossUnits,
    wastage: wastagePercent,
    totalUnits,
    unitsPerPallet,
    palletsRequired,
    orderQuantity
  };
}
```

## 8.2 Mortar Quantity Calculations

```ts
interface MortarCalculation {
  wallVolume: number;        // m³ (gross wall volume)
  brickVolume: number;       // m³ (volume of bricks)
  mortarVolume: number;      // m³ (wall - brick volume)
  
  // Mortar composition
  mix: string;               // e.g., "1:4"
  cementBags: number;        // 50kg bags
  sandVolume: number;        // m³ bulk sand
  
  // Coverage check
  coveragePerM3: number;     // m² of wall per m³ mortar
  
  totalCost: number;         // ZAR
}

function calculateMortarQuantity(
  wall: Wall,
  layer: WallLayer,
  brickCalc: BrickCalculation
): MortarCalculation {
  const brick = BRICK_LIBRARY.find(b => b.id === layer.brickwork.brickType);
  const mortar = MORTAR_LIBRARY.find(m => m.id === layer.brickwork.mortar.type);
  
  // Wall volume
  const wallLength = wall.geometry.length / 1000; // m
  const wallHeight = wall.geometry.height / 1000; // m
  const wallThickness = layer.brickwork.thickness / 1000; // m
  
  const grossWallVolume = wallLength * wallHeight * wallThickness;
  
  // Brick volume (actual brick units × unit volume)
  const brickUnitVolume = (
    brick.dimensions.length * 
    brick.dimensions.width * 
    brick.dimensions.height
  ) / 1000000000; // Convert mm³ to m³
  
  const brickVolume = brickCalc.grossUnits * brickUnitVolume;
  
  // Mortar volume = wall volume - brick volume
  const mortarVolume = grossWallVolume - brickVolume;
  
  // Mortar quantities based on mix
  // For 1:4 mix: 1 part cement to 4 parts sand
  // 1m³ mortar = approx 7 bags cement + 0.9m³ sand (compacted)
  
  const mixRatio = mortar.mix.split(':').map(Number);
  const cementParts = mixRatio[0];
  const sandParts = mixRatio[1];
  const totalParts = cementParts + sandParts;
  
  // Cement bags (50kg) per m³ of mortar
  const cementBagsPerM3 = {
    'I': 9.5,   // 1:3
    'II': 7.0,  // 1:4
    'III': 5.2, // 1:6
    'IV': 4.0   // 1:8
  }[mortar.classification];
  
  const cementBags = Math.ceil(mortarVolume * cementBagsPerM3);
  
  // Sand volume (bulk)
  const sandVolume = mortarVolume * 0.9; // 0.9m³ bulk sand per m³ mortar
  
  // Cost
  const cementCost = cementBags * 85; // R85 per 50kg bag
  const sandCost = sandVolume * 180;  // R180 per m³
  const totalCost = cementCost + sandCost;
  
  return {
    wallVolume: grossWallVolume,
    brickVolume,
    mortarVolume,
    mix: mortar.mix,
    cementBags,
    sandVolume,
    coveragePerM3: mortar.coverage.per1m3Mortar,
    totalCost
  };
}
```

## 8.3 Plaster Quantity Calculations

```ts
interface PlasterCalculation {
  area: number;              // m² (net plastered area)
  thickness: number;         // mm
  volume: number;            // m³ (area × thickness)
  
  // Material quantities
  materialKg: number;        // kg total
  bags50kg: number;          // Number of 50kg bags
  
  // Labour
  labourHours: number;       // Hours
  
  totalCost: number;         // ZAR (material + labour)
}

function calculatePlasterQuantity(
  wall: Wall,
  layer: WallLayer,
  side: 'both' | 'external' | 'internal'
): PlasterCalculation {
  const plaster = PLASTER_LIBRARY.find(p => p.id === layer.plaster.type);
  
  // Calculate area
  const wallLength = wall.geometry.length / 1000; // m
  const wallHeight = wall.geometry.height / 1000; // m
  const grossArea = wallLength * wallHeight;
  
  // Deduct openings
  const openingArea = wall.openings.reduce((sum, opening) => {
    return sum + (opening.dimensions.width / 1000) * (opening.dimensions.height / 1000);
  }, 0);
  
  // Add reveal areas
  const revealArea = wall.openings.reduce((sum, opening) => {
    const perimeter = 2 * (opening.dimensions.width + opening.dimensions.height) / 1000;
    const depth = opening.dimensions.revealDepth / 1000;
    return sum + (perimeter * depth);
  }, 0);
  
  const netArea = (grossArea - openingArea + revealArea) * (side === 'both' ? 2 : 1);
  
  // Volume
  const volume = netArea * (layer.plaster.thickness / 1000);
  
  // Material quantity
  const materialKg = netArea * plaster.coverage.perM2;
  const bags50kg = Math.ceil(materialKg / 50);
  
  // Labour (typical: 1.5 hours per 10m² for internal, 2 hours for external)
  const hoursPerM2 = plaster.application === 'external' ? 0.2 : 0.15;
  const labourHours = netArea * hoursPerM2;
  
  // Cost
  const materialCost = netArea * plaster.cost.materialPerM2;
  const labourCost = netArea * plaster.cost.labourPerM2;
  const totalCost = materialCost + labourCost;
  
  return {
    area: netArea,
    thickness: layer.plaster.thickness,
    volume,
    materialKg,
    bags50kg,
    labourHours,
    totalCost
  };
}
```

---

# 9. Standard Mode - Auto Material Construction

## 9.1 Standard Wall Types

```ts
interface StandardWallConfig {
  id: string;
  name: string;
  description: string;
  applicableFor: ('external' | 'internal' | 'party')[];
  construction: WallConstruction;
}

const STANDARD_WALL_TYPES: StandardWallConfig[] = [
  {
    id: 'ext_single_230',
    name: 'External Wall - Single Skin 230mm',
    description: 'Standard load-bearing external wall with plaster both sides',
    applicableFor: ['external'],
    construction: STANDARD_EXTERNAL_WALL_SINGLE_SKIN
  },
  
  {
    id: 'ext_cavity_290',
    name: 'External Cavity Wall - 290mm',
    description: 'Cavity wall with insulation for improved thermal performance',
    applicableFor: ['external'],
    construction: STANDARD_CAVITY_WALL
  },
  
  {
    id: 'int_partition_115',
    name: 'Internal Partition - 115mm',
    description: 'Non-load bearing partition wall',
    applicableFor: ['internal'],
    construction: STANDARD_INTERNAL_PARTITION
  },
  
  {
    id: 'int_load_bearing_230',
    name: 'Internal Load Bearing - 230mm',
    description: 'Load-bearing internal wall',
    applicableFor: ['internal'],
    construction: STANDARD_EXTERNAL_WALL_SINGLE_SKIN
  },
  
  {
    id: 'party_wall_230',
    name: 'Party Wall - 230mm',
    description: 'Wall between units with enhanced sound insulation',
    applicableFor: ['party'],
    construction: {
      ...STANDARD_EXTERNAL_WALL_SINGLE_SKIN,
      layers: [
        ...STANDARD_EXTERNAL_WALL_SINGLE_SKIN.layers,
        {
          id: 'layer_acoustic',
          sequence: 1.5, // Insert between existing layers
          type: 'insulation',
          insulation: {
            type: 'mineral_wool',
            thickness: 50,
            position: 'internal'
          }
        }
      ]
    }
  }
];
```

## 9.2 Standard Mode Wall Creation

```ts
function createStandardWall(
  geometry: { start: Point3D; end: Point3D; height: number },
  location: 'external' | 'internal' | 'party',
  loadBearing: boolean
): Wall {
  // Select appropriate standard construction
  let construction: WallConstruction;
  
  if (location === 'external') {
    // Default to cavity wall for better performance
    construction = STANDARD_CAVITY_WALL;
  } else if (location === 'party') {
    construction = STANDARD_WALL_TYPES.find(w => w.id === 'party_wall_230').construction;
  } else {
    // Internal
    if (loadBearing) {
      construction = STANDARD_WALL_TYPES.find(w => w.id === 'int_load_bearing_230').construction;
    } else {
      construction = STANDARD_INTERNAL_PARTITION;
    }
  }
  
  // Calculate thickness from construction layers
  const totalThickness = construction.layers.reduce((sum, layer) => {
    if (layer.brickwork) return sum + layer.brickwork.thickness;
    if (layer.plaster) return sum + layer.plaster.thickness;
    if (layer.cavity) return sum + layer.cavity.width;
    if (layer.insulation) return sum + layer.insulation.thickness;
    return sum;
  }, 0);
  
  return {
    id: generateUUID(),
    geometry: {
      start: geometry.start,
      end: geometry.end,
      baseLevel: 0,
      height: geometry.height,
      length: calculateDistance(geometry.start, geometry.end)
    },
    construction,
    thickness: totalThickness,
    type: {
      structural: loadBearing ? 'load_bearing' : 'non_load_bearing',
      location,
      function: location === 'external' ? 'facade' : 'partition'
    },
    foundation: {
      type: 'strip_footing',
      foundationId: '', // Will be linked
      dpc: {
        height: 150, // SANS minimum 150mm above ground
        type: 'dpc_375_micron',
        continuous: true,
        stepped: false
      }
    },
    openings: [],
    designMode: {
      mode: 'standard'
    }
  };
}
```

---

# 10. Engineer Mode - Custom Wall Construction

## 10.1 Wall Construction Builder Interface

```tsx
interface WallConstructionBuilder {
  layers: WallLayer[];
  addLayer: (layer: WallLayer) => void;
  removeLayer: (layerId: string) => void;
  reorderLayers: (newOrder: string[]) => void;
  calculateTotalThickness: () => number;
  validateConstruction: () => ValidationResult;
}

const WallConstructionBuilderModal = () => (
  <Modal size="xxl">
    <ModalHeader>
      <h2>Engineer Wall Construction Builder</h2>
      <Badge variant="warning">Custom Material Stack</Badge>
    </ModalHeader>
    
    <ModalBody>
      <Tabs>
        <TabList>
          <Tab>Layer Stack</Tab>
          <Tab>Material Selection</Tab>
          <Tab>Construction Details</Tab>
          <Tab>Performance</Tab>
          <Tab>Loading Analysis</Tab>
          <Tab>SANS Compliance</Tab>
          <Tab>Engineer Signature</Tab>
        </TabList>
        
        <TabPanels>
          {/* Tab 1: Layer Stack Builder */}
          <TabPanel>
            <LayerStackBuilder />
          </TabPanel>
          
          {/* Tab 2: Material Selection */}
          <TabPanel>
            <MaterialLibrarySelector />
          </TabPanel>
          
          {/* Tab 3: Construction Details */}
          <TabPanel>
            <ConstructionDetailsForm />
          </TabPanel>
          
          {/* Tab 4: Performance Calculations */}
          <TabPanel>
            <PerformanceCalculator />
          </TabPanel>
          
          {/* Tab 5: Loading Analysis */}
          <TabPanel>
            <LoadingAnalysisForm />
          </TabPanel>
          
          {/* Tab 6: SANS Compliance */}
          <TabPanel>
            <WallSANSComplianceValidator />
          </TabPanel>
          
          {/* Tab 7: Engineer Signature */}
          <TabPanel>
            <EngineerSignatureForm />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </ModalBody>
  </Modal>
);
```

## 10.2 Tab 1: Layer Stack Builder

```tsx
const LayerStackBuilder = () => {
  const [layers, setLayers] = useState<WallLayer[]>([]);
  
  return (
    <div className="layer-stack-builder">
      {/* Visual layer stack representation */}
      <div className="layer-visualization">
        <h3>Wall Section (Outside → Inside)</h3>
        <div className="layer-stack">
          {layers.map((layer, index) => (
            <div 
              key={layer.id} 
              className="layer-item"
              style={{ 
                width: `${calculateLayerWidth(layer)}px`,
                backgroundColor: getLayerColor(layer.type)
              }}
            >
              <div className="layer-info">
                <span className="layer-number">{index + 1}</span>
                <span className="layer-type">{layer.type}</span>
                <span className="layer-thickness">{getLayerThickness(layer)}mm</span>
              </div>
              
              <div className="layer-actions">
                <Button size="sm" onClick={() => editLayer(layer.id)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => removeLayer(layer.id)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="total-thickness">
          <strong>Total Wall Thickness: {calculateTotalThickness(layers)}mm</strong>
        </div>
      </div>
      
      {/* Add layer controls */}
      <div className="add-layer-controls">
        <h4>Add New Layer</h4>
        
        <FormGrid cols={2}>
          <Select
            label="Layer Type"
            options={[
              'Plaster (External)',
              'Brick/Block Skin',
              'Cavity',
              'Insulation',
              'Plaster (Internal)',
              'DPC',
              'Air Gap'
            ]}
            onChange={setSelectedLayerType}
          />
          
          <Button onClick={addNewLayer} disabled={!selectedLayerType}>
            + Add Layer
          </Button>
        </FormGrid>
        
        {selectedLayerType && (
          <div className="layer-config-form">
            {selectedLayerType === 'Brick/Block Skin' && (
              <BrickSkinConfig onSave={handleLayerSave} />
            )}
            {selectedLayerType === 'Plaster (External)' && (
              <PlasterConfig side="external" onSave={handleLayerSave} />
            )}
            {selectedLayerType === 'Cavity' && (
              <CavityConfig onSave={handleLayerSave} />
            )}
            {/* ... other layer type configs */}
          </div>
        )}
      </div>
      
      {/* Layer reordering */}
      <div className="layer-order-controls">
        <h4>Reorder Layers (Drag to reorder)</h4>
        <DragDropList
          items={layers}
          onReorder={handleLayerReorder}
          renderItem={(layer) => (
            <div className="draggable-layer">
              <DragHandle />
              <span>{layer.type} - {getLayerThickness(layer)}mm</span>
            </div>
          )}
        />
      </div>
    </div>
  );
};
```

## 10.3 Brick Skin Configuration Form

```tsx
const BrickSkinConfig = ({ onSave }) => (
  <FormGrid>
    <FormSection title="Brick/Block Selection">
      <Select
        label="Brick/Block Type"
        options={BRICK_LIBRARY.map(b => ({
          value: b.id,
          label: `${b.name} (${b.dimensions.length}x${b.dimensions.width}x${b.dimensions.height}mm)`
        }))}
        onChange={handleBrickTypeChange}
      />
      
      {selectedBrick && (
        <div className="brick-info-display">
          <InfoCard title="Brick Specifications">
            <dl>
              <dt>Work Size:</dt>
              <dd>{selectedBrick.dimensions.length} × {selectedBrick.dimensions.width} × {selectedBrick.dimensions.height}mm</dd>
              
              <dt>Coordinating Size:</dt>
              <dd>{selectedBrick.coordinating.length} × {selectedBrick.coordinating.height}mm (with 10mm joint)</dd>
              
              <dt>Strength:</dt>
              <dd>{selectedBrick.strength.grade} ({selectedBrick.strength.compressiveStrength}MPa)</dd>
              
              <dt>Weight:</dt>
              <dd>{selectedBrick.weight.dry}kg (dry), {selectedBrick.weight.saturated}kg (saturated)</dd>
              
              <dt>Cost:</dt>
              <dd>R{selectedBrick.cost.unitPrice} per unit (R{selectedBrick.cost.per1000}/1000)</dd>
            </dl>
          </InfoCard>
        </div>
      )}
    </FormSection>
    
    <FormSection title="Bond Pattern">
      <Select
        label="Bond Type"
        options={[
          { value: 'stretcher', label: 'Stretcher Bond (Running)' },
          { value: 'english', label: 'English Bond' },
          { value: 'flemish', label: 'Flemish Bond' },
          { value: 'header', label: 'Header Bond' },
          { value: 'stack', label: 'Stack Bond (requires reinforcement)' }
        ]}
        onChange={handleBondChange}
      />
      
      {selectedBond && (
        <InfoBox variant="info">
          <p><strong>Bond Pattern:</strong> {selectedBond.pattern.coursePattern.join(' → ')}</p>
          <p><strong>Wastage:</strong> {selectedBond.wastage}% (cutting for bond)</p>
        </InfoBox>
      )}
    </FormSection>
    
    <FormSection title="Brick Orientation & Thickness">
      <Select
        label="Brick Orientation"
        options={[
          { value: 'stretcher', label: 'Stretcher (length visible)' },
          { value: 'header', label: 'Header (width visible)' },
          { value: 'soldier', label: 'Soldier (height visible)' }
        ]}
        onChange={handleOrientationChange}
      />
      
      <NumberInput
        label="Number of Skins"
        min={1}
        max={3}
        defaultValue={1}
        tooltip="1 skin = half brick, 2 skins = full brick, etc."
        onChange={handleSkinsChange}
      />
      
      <CalculationDisplay
        label="Calculated Wall Thickness"
        value={calculateWallThickness(selectedBrick, orientation, skins)}
        unit="mm"
        calculated={true}
        formula={getThicknessFormula(selectedBrick, orientation, skins)}
      />
      
      {/* Thickness breakdown */}
      <InfoCard title="Thickness Breakdown">
        {orientation === 'stretcher' && skins === 2 && (
          <div>
            <p>Brick width: {selectedBrick.dimensions.width}mm × 2 = {selectedBrick.dimensions.width * 2}mm</p>
            <p>Mortar joint (center): 10mm</p>
            <p><strong>Total: {selectedBrick.dimensions.width * 2 + 10}mm</strong></p>
          </div>
        )}
      </InfoCard>
    </FormSection>
    
    <FormSection title="Mortar Specification">
      <Select
        label="Mortar Class"
        options={MORTAR_LIBRARY.map(m => ({
          value: m.id,
          label: `${m.name} - ${m.mix} (${m.strength.grade})`
        }))}
        onChange={handleMortarChange}
      />
      
      {selectedMortar && (
        <div>
          <InfoCard title="Mortar Specifications">
            <dl>
              <dt>Mix:</dt>
              <dd>{selectedMortar.mix}</dd>
              
              <dt>Strength:</dt>
              <dd>{selectedMortar.strength.grade} ({selectedMortar.strength.compressiveStrength}MPa at 28 days)</dd>
              
              <dt>Suitable for:</dt>
              <dd>
                <ul>
                  {selectedMortar.usage.map((use, i) => (
                    <li key={i}>{use}</li>
                  ))}
                </ul>
              </dd>
              
              <dt>Coverage:</dt>
              <dd>{selectedMortar.coverage.per1m3Mortar}m² per m³ mortar</dd>
            </dl>
          </InfoCard>
          
          <NumberInput
            label="Joint Thickness (mm)"
            min={selectedMortar.jointThickness.minimum}
            max={selectedMortar.jointThickness.maximum}
            defaultValue={selectedMortar.jointThickness.typical}
            tooltip={`SANS range: ${selectedMortar.jointThickness.minimum}-${selectedMortar.jointThickness.maximum}mm`}
          />
          
          <Select
            label="Joint Finish"
            options={[
              { value: 'flush', label: 'Flush Joint' },
              { value: 'weathered', label: 'Weathered (sloped)' },
              { value: 'recessed', label: 'Recessed (raked)' },
              { value: 'struck', label: 'Struck Joint' }
            ]}
          />
        </div>
      )}
    </FormSection>
    
    <FormSection title="Reinforcement (Optional)">
      <Checkbox
        label="Include Horizontal Reinforcement"
        onChange={setHasReinforcement}
      />
      
      {hasReinforcement && (
        <div>
          <Select
            label="Reinforcement Type"
            options={[
              { value: 'brickforce', label: 'Brickforce (mesh)' },
              { value: 'ladder', label: 'Ladder Reinforcement' },
              { value: 'truss', label: 'Truss Reinforcement' }
            ]}
          />
          
          <NumberInput
            label="Vertical Spacing (courses)"
            min={2}
            max={6}
            defaultValue={4}
            tooltip="Typically every 4-6 courses"
          />
          
          <TextInput
            label="Specification"
            placeholder="e.g., Brickforce 175/60"
          />
        </div>
      )}
    </FormSection>
    
    <div className="form-actions">
      <Button variant="primary" onClick={() => onSave(brickSkinConfig)}>
        Save Brick Skin Layer
      </Button>
    </div>
  </FormGrid>
);
```

---

# 11. Wall BOQ Generation

## 11.1 Complete Wall BOQ Structure

```ts
interface WallBOQ {
  brickwork: BOQSection;        // All brick/block skins
  mortar: BOQSection;           // Mortar for all joints
  plaster: BOQSection;          // Internal and external plaster
  dpc: BOQSection;              // Damp proof course
  cavity: BOQSection;           // Cavity ties, insulation, closers
  reinforcement: BOQSection;    // Brickforce, starter bars
  lintels: BOQSection;          // All lintels over openings
  accessories: BOQSection;      // Weepholes, vents, etc.
  labour: BOQSection;           // Labour breakdown
  totalCost: number;
}
```

## 11.2 Brickwork BOQ Generation

```ts
function generateBrickworkBOQ(wall: Wall): BOQSection {
  const items: BOQItem[] = [];
  
  // Process each brick/block skin in the wall construction
  wall.construction.layers
    .filter(layer => layer.type === 'brick_skin')
    .forEach((layer, skinIndex) => {
      const brickCalc = calculateBrickQuantity(wall, layer);
      const brick = BRICK_LIBRARY.find(b => b.id === layer.brickwork.brickType);
      
      // Brick/block item
      items.push({
        code: `WALL-BRK-${String(skinIndex + 1).padStart(3, '0')}`,
        description: `${brick.name} (${brick.dimensions.length}×${brick.dimensions.width}×${brick.dimensions.height}mm) - ${layer.brickwork.bond.type} bond`,
        unit: 'no',
        quantity: brickCalc.grossUnits,
        wastage: brickCalc.wastage,
        totalQuantity: brickCalc.totalUnits,
        unitRate: brick.cost.unitPrice,
        totalCost: 0,
        designMode: wall.designMode.mode,
        
        // Additional details
        details: {
          unitsPerM2: brickCalc.unitsPerM2.toFixed(2),
          netArea: `${brickCalc.netArea.toFixed(2)}m²`,
          palletsRequired: brickCalc.palletsRequired,
          bondPattern: layer.brickwork.bond.type,
          skin: skinIndex + 1
        }
      });
      
      // Calculate costs
      items[items.length - 1].totalCost = 
        items[items.length - 1].totalQuantity * brick.cost.unitPrice;
    });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

## 11.3 Mortar BOQ Generation

```ts
function generateMortarBOQ(wall: Wall): BOQSection {
  const items: BOQItem[] = [];
  
  // Process each brick skin's mortar
  wall.construction.layers
    .filter(layer => layer.type === 'brick_skin')
    .forEach((layer, skinIndex) => {
      const brickCalc = calculateBrickQuantity(wall, layer);
      const mortarCalc = calculateMortarQuantity(wall, layer, brickCalc);
      const mortar = MORTAR_LIBRARY.find(m => m.id === layer.brickwork.mortar.type);
      
      // Cement
      items.push({
        code: `WALL-MRT-CEM-${String(skinIndex + 1).padStart(3, '0')}`,
        description: `Cement (50kg bags) for ${mortar.name} - Skin ${skinIndex + 1}`,
        unit: 'bags',
        quantity: mortarCalc.cementBags,
        wastage: 5,
        totalQuantity: Math.ceil(mortarCalc.cementBags * 1.05),
        unitRate: 85, // R85 per 50kg bag
        totalCost: 0,
        designMode: wall.designMode.mode,
        
        details: {
          mix: mortar.mix,
          mortarVolume: `${mortarCalc.mortarVolume.toFixed(3)}m³`,
          wallArea: `${brickCalc.netArea.toFixed(2)}m²`
        }
      });
      
      // Building sand
      items.push({
        code: `WALL-MRT-SND-${String(skinIndex + 1).padStart(3, '0')}`,
        description: `Building sand for ${mortar.name} - Skin ${skinIndex + 1}`,
        unit: 'm³',
        quantity: mortarCalc.sandVolume,
        wastage: 10, // Bulking factor
        totalQuantity: mortarCalc.sandVolume * 1.1,
        unitRate: 180, // R180 per m³
        totalCost: 0,
        designMode: wall.designMode.mode
      });
      
      // Calculate costs
      items[items.length - 2].totalCost = items[items.length - 2].totalQuantity * 85;
      items[items.length - 1].totalCost = items[items.length - 1].totalQuantity * 180;
    });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

## 11.4 Plaster BOQ Generation

```ts
function generatePlasterBOQ(wall: Wall): BOQSection {
  const items: BOQItem[] = [];
  
  // External plaster
  const externalPlasterLayer = wall.construction.layers.find(
    layer => layer.type === 'plaster' && layer.sequence === 1
  );
  
  if (externalPlasterLayer) {
    const plasterCalc = calculatePlasterQuantity(wall, externalPlasterLayer, 'external');
    const plaster = PLASTER_LIBRARY.find(p => p.id === externalPlasterLayer.plaster.type);
    
    items.push({
      code: 'WALL-PLS-EXT-001',
      description: `${plaster.name} - External (${plaster.thickness.typical}mm)`,
      unit: 'm²',
      quantity: plasterCalc.area,
      wastage: 0,
      totalQuantity: plasterCalc.area,
      unitRate: plaster.cost.totalPerM2,
      totalCost: plasterCalc.totalCost,
      designMode: wall.designMode.mode,
      
      details: {
        materialKg: plasterCalc.materialKg.toFixed(1),
        bags50kg: plasterCalc.bags50kg,
        labourHours: plasterCalc.labourHours.toFixed(1),
        thickness: `${plaster.thickness.typical}mm`,
        coats: plaster.coats.total
      }
    });
  }
  
  // Internal plaster
  const internalPlasterLayer = wall.construction.layers.find(
    layer => layer.type === 'plaster' && layer.sequence > 2
  );
  
  if (internalPlasterLayer) {
    const plasterCalc = calculatePlasterQuantity(wall, internalPlasterLayer, 'internal');
    const plaster = PLASTER_LIBRARY.find(p => p.id === internalPlasterLayer.plaster.type);
    
    items.push({
      code: 'WALL-PLS-INT-001',
      description: `${plaster.name} - Internal (${plaster.thickness.typical}mm)`,
      unit: 'm²',
      quantity: plasterCalc.area,
      wastage: 0,
      totalQuantity: plasterCalc.area,
      unitRate: plaster.cost.totalPerM2,
      totalCost: plasterCalc.totalCost,
      designMode: wall.designMode.mode,
      
      details: {
        materialKg: plasterCalc.materialKg.toFixed(1),
        bags50kg: plasterCalc.bags50kg,
        labourHours: plasterCalc.labourHours.toFixed(1)
      }
    });
  }
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

## 11.5 DPC BOQ Generation

```ts
function generateDPCBOQ(wall: Wall): BOQSection {
  const items: BOQItem[] = [];
  
  const dpcType = DPC_LIBRARY.find(d => d.id === wall.foundation.dpc.type);
  const wallLength = wall.geometry.length / 1000; // meters
  
  // DPC linear meters
  items.push({
    code: 'WALL-DPC-001',
    description: `${dpcType.name} - ${dpcType.width.actual}mm wide`,
    unit: 'm',
    quantity: wallLength,
    wastage: 10, // 10% for laps and wastage
    totalQuantity: wallLength * 1.1,
    unitRate: dpcType.cost.perLinearMeter,
    totalCost: 0,
    designMode: wall.designMode.mode,
    
    details: {
      height: `${wall.foundation.dpc.height}mm above foundation`,
      laps: `${dpcType.laps.typical}mm`,
      material: dpcType.material
    }
  });
  
  items[0].totalCost = items[0].totalQuantity * dpcType.cost.perLinearMeter;
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

## 11.6 Cavity Wall Components BOQ

```ts
function generateCavityBOQ(wall: Wall): BOQSection {
  const items: BOQItem[] = [];
  
  const cavityLayer = wall.construction.layers.find(layer => layer.type === 'cavity');
  
  if (!cavityLayer) {
    return { items: [], totalCost: 0 };
  }
  
  const wallArea = (wall.geometry.length / 1000) * (wall.geometry.height / 1000);
  const tie = CAVITY_TIE_LIBRARY.find(t => t.id === cavityLayer.cavity.ties.type);
  
  // Cavity ties
  const tiesRequired = Math.ceil(wallArea * tie.spacing.perM2);
  
  items.push({
    code: 'WALL-CAV-TIE-001',
    description: `${tie.name} - cavity ties`,
    unit: 'no',
    quantity: tiesRequired,
    wastage: 10,
    totalQuantity: Math.ceil(tiesRequired * 1.1),
    unitRate: tie.cost.perUnit,
    totalCost: 0,
    designMode: wall.designMode.mode,
    
    details: {
      spacing: `${tie.spacing.horizontal}mm H × ${tie.spacing.vertical}mm V`,
      perM2: tie.spacing.perM2,
      cavityWidth: `${cavityLayer.cavity.width}mm`,
      hasDrip: tie.drip
    }
  });
  
  items[0].totalCost = items[0].totalQuantity * tie.cost.perUnit;
  
  // Cavity insulation (if present)
  const insulationLayer = wall.construction.layers.find(
    layer => layer.type === 'insulation' && layer.insulation?.position === 'cavity'
  );
  
  if (insulationLayer) {
    items.push({
      code: 'WALL-CAV-INS-001',
      description: `Cavity insulation - ${insulationLayer.insulation.thickness}mm`,
      unit: 'm²',
      quantity: wallArea,
      wastage: 5,
      totalQuantity: wallArea * 1.05,
      unitRate: 85, // Typical polystyrene board rate
      totalCost: 0,
      designMode: wall.designMode.mode
    });
    
    items[1].totalCost = items[1].totalQuantity * 85;
  }
  
  // Weepholes
  const weepholeSpacing = cavityLayer.cavity.weepholes.spacing / 1000; // m
  const weepholesRequired = Math.ceil((wall.geometry.length / 1000) / weepholeSpacing);
  
  items.push({
    code: 'WALL-CAV-WH-001',
    description: `Weepholes - ${cavityLayer.cavity.weepholes.type}`,
    unit: 'no',
    quantity: weepholesRequired,
    wastage: 0,
    totalQuantity: weepholesRequired,
    unitRate: cavityLayer.cavity.weepholes.type === 'plastic_vent' ? 8.50 : 0,
    totalCost: 0,
    designMode: wall.designMode.mode,
    
    details: {
      spacing: `${cavityLayer.cavity.weepholes.spacing}mm c/c`,
      height: `${cavityLayer.cavity.weepholes.height}mm above DPC`
    }
  });
  
  items[items.length - 1].totalCost = items[items.length - 1].totalQuantity * items[items.length - 1].unitRate;
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

## 11.7 Lintels BOQ Generation

```ts
function generateLintelsBOQ(wall: Wall): BOQSection {
  const items: BOQItem[] = [];
  
  wall.openings.forEach((opening, index) => {
    if (opening.lintel.type === 'precast') {
      const lintelLength = (opening.dimensions.width + 2 * opening.lintel.precast.bearing) / 1000;
      
      items.push({
        code: `WALL-LNT-${String(index + 1).padStart(3, '0')}`,
        description: `Precast lintel ${opening.lintel.precast.size} - ${opening.type}`,
        unit: 'no',
        quantity: 1,
        wastage: 0,
        totalQuantity: 1,
        unitRate: 450, // Typical precast lintel
        totalCost: 450,
        designMode: wall.designMode.mode,
        
        details: {
          opening: opening.type,
          width: `${opening.dimensions.width}mm`,
          length: `${lintelLength}m`,
          bearing: `${opening.lintel.precast.bearing}mm each end`,
          reference: opening.lintel.precast.reference
        }
      });
      
    } else if (opening.lintel.type === 'cast_in_place') {
      // Concrete
      items.push({
        code: `WALL-LNT-CON-${String(index + 1).padStart(3, '0')}`,
        description: `${opening.lintel.castInPlace.concrete.grade} concrete for cast-in-place lintel`,
        unit: 'm³',
        quantity: opening.lintel.castInPlace.concrete.volume,
        wastage: 10,
        totalQuantity: opening.lintel.castInPlace.concrete.volume * 1.1,
        unitRate: getConcreteRate(opening.lintel.castInPlace.concrete.grade),
        totalCost: 0,
        designMode: wall.designMode.mode
      });
      
      // Reinforcement
      const totalRebarMass = [
        ...opening.lintel.castInPlace.reinforcement.topBars,
        ...opening.lintel.castInPlace.reinforcement.bottomBars
      ].reduce((sum, bar) => {
        const massPerM = getRebarMassPerMeter(bar.size);
        return sum + (bar.length * bar.quantity / 1000 * massPerM);
      }, 0);
      
      items.push({
        code: `WALL-LNT-RBR-${String(index + 1).padStart(3, '0')}`,
        description: `Reinforcement for cast-in-place lintel`,
        unit: 'kg',
        quantity: totalRebarMass,
        wastage: 7.5,
        totalQuantity: totalRebarMass * 1.075,
        unitRate: getRebarRate('Y12'),
        totalCost: 0,
        designMode: wall.designMode.mode
      });
      
      // Formwork
      const formworkArea = (
        2 * opening.lintel.castInPlace.length * opening.lintel.castInPlace.depth +
        opening.lintel.castInPlace.length * opening.lintel.castInPlace.width
      ) / 1000000;
      
      items.push({
        code: `WALL-LNT-FRM-${String(index + 1).padStart(3, '0')}`,
        description: `Formwork for cast-in-place lintel`,
        unit: 'm²',
        quantity: formworkArea,
        wastage: 0,
        totalQuantity: formworkArea,
        unitRate: 120, // Formwork rate per m²
        totalCost: 0,
        designMode: wall.designMode.mode
      });
    }
  });
  
  // Calculate costs
  items.forEach(item => {
    if (!item.totalCost) {
      item.totalCost = item.totalQuantity * item.unitRate;
    }
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

---

# 12. SANS Compliance for Walls

## 12.1 Wall Compliance Checks

```ts
interface WallComplianceCheck {
  rule: string;
  standard: string;
  requirement: any;
  actual: any;
  compliant: boolean;
  message: string;
  critical: boolean;
}

function validateWallCompliance(wall: Wall): WallComplianceCheck[] {
  const checks: WallComplianceCheck[] = [];
  
  // DPC height above ground
  checks.push({
    rule: 'DPC Height Above Ground',
    standard: 'SANS 10400-H',
    requirement: 'Minimum 150mm above ground level',
    actual: `${wall.foundation.dpc.height}mm`,
    compliant: wall.foundation.dpc.height >= 150,
    message: 'DPC must be minimum 150mm above ground to prevent rising damp',
    critical: true
  });
  
  // DPC continuity
  checks.push({
    rule: 'DPC Continuity',
    standard: 'SANS 10400-H',
    requirement: 'Continuous DPC across full wall width',
    actual: wall.foundation.dpc.continuous ? 'Continuous' : 'Not continuous',
    compliant: wall.foundation.dpc.continuous,
    message: 'DPC must be continuous across entire wall width',
    critical: true
  });
  
  // Mortar joint thickness
  wall.construction.layers
    .filter(layer => layer.type === 'brick_skin')
    .forEach((layer, index) => {
      const mortar = MORTAR_LIBRARY.find(m => m.id === layer.brickwork.mortar.type);
      
      checks.push({
        rule: `Mortar Joint Thickness - Skin ${index + 1}`,
        standard: 'SANS 227',
        requirement: `${mortar.jointThickness.minimum}-${mortar.jointThickness.maximum}mm`,
        actual: `${layer.brickwork.mortar.jointThickness}mm`,
        compliant: layer.brickwork.mortar.jointThickness >= mortar.jointThickness.minimum &&
                   layer.brickwork.mortar.jointThickness <= mortar.jointThickness.maximum,
        message: `Joint thickness must be within ${mortar.jointThickness.minimum}-${mortar.jointThickness.maximum}mm`,
        critical: false
      });
    });
  
  // Cavity width (if cavity wall)
  const cavityLayer = wall.construction.layers.find(layer => layer.type === 'cavity');
  if (cavityLayer) {
    checks.push({
      rule: 'Cavity Width',
      standard: 'SANS 10400',
      requirement: 'Minimum 50mm, maximum 100mm',
      actual: `${cavityLayer.cavity.width}mm`,
      compliant: cavityLayer.cavity.width >= 50 && cavityLayer.cavity.width <= 100,
      message: 'Cavity width must be 50-100mm for proper function',
      critical: true
    });
    
    // Cavity ties spacing
    const tie = CAVITY_TIE_LIBRARY.find(t => t.id === cavityLayer.cavity.ties.type);
    
    checks.push({
      rule: 'Cavity Tie Spacing - Horizontal',
      standard: 'SANS 10400',
      requirement: 'Maximum 900mm horizontal',
      actual: `${cavityLayer.cavity.ties.spacingH}mm`,
      compliant: cavityLayer.cavity.ties.spacingH <= 900,
      message: 'Horizontal tie spacing must not exceed 900mm',
      critical: true
    });
    
    checks.push({
      rule: 'Cavity Tie Spacing - Vertical',
      standard: 'SANS 10400',
      requirement: 'Maximum 450mm vertical',
      actual: `${cavityLayer.cavity.ties.spacingV}mm`,
      compliant: cavityLayer.cavity.ties.spacingV <= 450,
      message: 'Vertical tie spacing must not exceed 450mm',
      critical: true
    });
    
    // Weepholes
    checks.push({
      rule: 'Weepholes Spacing',
      standard: 'SANS 10400-H',
      requirement: 'Maximum 900mm spacing',
      actual: `${cavityLayer.cavity.weepholes.spacing}mm`,
      compliant: cavityLayer.cavity.weepholes.spacing <= 900,
      message: 'Weepholes required every 900mm maximum',
      critical: true
    });
    
    checks.push({
      rule: 'Weepholes Height',
      standard: 'SANS 10400-H',
      requirement: 'Minimum 150mm above DPC',
      actual: `${cavityLayer.cavity.weepholes.height}mm`,
      compliant: cavityLayer.cavity.weepholes.height >= 150,
      message: 'Weepholes must be minimum 150mm above DPC',
      critical: true
    });
  }
  
  // Lintel bearings
  wall.openings.forEach((opening, index) => {
    if (opening.lintel.type === 'precast') {
      checks.push({
        rule: `Lintel Bearing - Opening ${index + 1}`,
        standard: 'SANS 10400',
        requirement: 'Minimum 150mm each end',
        actual: `${opening.lintel.precast.bearing}mm`,
        compliant: opening.lintel.precast.bearing >= 150,
        message: 'Lintel must bear minimum 150mm on each support',
        critical: true
      });
    }
  });
  
  // Wall height to thickness ratio (if load bearing)
  if (wall.type.structural === 'load_bearing') {
    const slendernessRatio = wall.geometry.height / wall.thickness;
    const maxRatio = 27; // SANS 10400 typical limit
    
    checks.push({
      rule: 'Slenderness Ratio',
      standard: 'SANS 10400',
      requirement: 'Maximum 27 (height/thickness)',
      actual: slendernessRatio.toFixed(1),
      compliant: slendernessRatio <= maxRatio,
      message: 'Wall may require stiffening or thickening if slenderness exceeded',
      critical: false
    });
  }
  
  return checks;
}
```

---

# 13. Drawing Generation - Wall Details

## 13.1 Wall Section Detail

```ts
function renderWallSection(wall: Wall): SVGElement[] {
  const elements: SVGElement[] = [];
  let currentX = 0;
  
  // Render each layer from outside to inside
  wall.construction.layers.forEach((layer, index) => {
    const layerThickness = getLayerThickness(layer);
    
    // Layer rectangle
    elements.push({
      type: 'rect',
      position: { x: currentX, y: 0 },
      width: layerThickness,
      height: wall.geometry.height,
      stroke: '#000000',
      strokeWidth: layer.type === 'brick_skin' ? 2 : 1,
      fill: getLayerHatchPattern(layer)
    });
    
    // Layer annotation
    elements.push({
      type: 'text',
      position: { x: currentX + layerThickness/2, y: wall.geometry.height + 50 },
      content: getLayerDescription(layer),
      fontSize: 6,
      textAnchor: 'middle',
      rotation: 90
    });
    
    // Dimension
    elements.push(
      createDimension(
        { x: currentX, y: wall.geometry.height + 100 },
        { x: currentX + layerThickness, y: wall.geometry.height + 100 },
        `${layerThickness}mm`
      )
    );
    
    currentX += layerThickness;
  });
  
  // DPC indication
  const dpcHeight = wall.foundation.dpc.height;
  
  elements.push({
    type: 'line',
    start: { x: 0, y: dpcHeight },
    end: { x: wall.thickness, y: dpcHeight },
    stroke: '#FF0000',
    strokeWidth: 2,
    dashArray: [10, 5]
  });
  
  elements.push({
    type: 'text',
    position: { x: wall.thickness + 20, y: dpcHeight },
    content: 'DPC',
    fontSize: 8,
    fill: '#FF0000',
    fontWeight: 'bold'
  });
  
  // Total wall thickness dimension
  elements.push(
    createDimension(
      { x: 0, y: wall.geometry.height + 200 },
      { x: wall.thickness, y: wall.geometry.height + 200 },
      `${wall.thickness}mm TOTAL`,
      { fontSize: 10, fontWeight: 'bold' }
    )
  );
  
  // Material schedule callout
  elements.push({
    type: 'rect',
    position: { x: wall.thickness + 100, y: 50 },
    width: 300,
    height: 200,
    stroke: '#000000',
    strokeWidth: 1,
    fill: '#FFFFFF'
  });
  
  let scheduleY = 70;
  elements.push({
    type: 'text',
    position: { x: wall.thickness + 110, y: scheduleY },
    content: 'WALL CONSTRUCTION:',
    fontSize: 8,
    fontWeight: 'bold'
  });
  
  scheduleY += 15;
  wall.construction.layers.forEach((layer, index) => {
    elements.push({
      type: 'text',
      position: { x: wall.thickness + 110, y: scheduleY },
      content: `${index + 1}. ${getLayerDescription(layer)}`,
      fontSize: 6
    });
    scheduleY += 12;
  });
  
  return elements;
}

function getLayerDescription(layer: WallLayer): string {
  if (layer.brickwork) {
    const brick = BRICK_LIBRARY.find(b => b.id === layer.brickwork.brickType);
    return `${brick.name} - ${layer.brickwork.bond.type} bond`;
  }
  if (layer.plaster) {
    const plaster = PLASTER_LIBRARY.find(p => p.id === layer.plaster.type);
    return `${plaster.name} - ${layer.plaster.thickness}mm`;
  }
  if (layer.cavity) {
    return `${layer.cavity.width}mm cavity ${layer.cavity.ventilated ? '(ventilated)' : ''}`;
  }
  if (layer.insulation) {
    return `${layer.insulation.thickness}mm ${layer.insulation.type} insulation`;
  }
  if (layer.dpc) {
    const dpc = DPC_LIBRARY.find(d => d.id === layer.dpc.type);
    return `${dpc.name}`;
  }
  return layer.type;
}

function getLayerHatchPattern(layer: WallLayer): string {
  if (layer.brickwork) {
    const brick = BRICK_LIBRARY.find(b => b.id === layer.brickwork.brickType);
    return brick.category === 'clay' ? 'url(#brick-hatch)' : 'url(#block-hatch)';
  }
  if (layer.plaster) return 'url(#plaster-hatch)';
  if (layer.cavity) return 'none';
  if (layer.insulation) return 'url(#insulation-hatch)';
  if (layer.dpc) return 'url(#dpc-hatch)';
  return 'none';
}
```

---

# 14. Completion

Volume IX establishes the complete **Material-Based Wall System** with:

- **Complete material libraries** for bricks, blocks, mortar, plaster, DPC
- **Actual dimensional calculations** - wall thickness from real brick dimensions
- **Construction sequences** - DPC, brickwork, cavity, ties, plaster
- **Accurate quantity calculations** - brick count, mortar volume, plaster area
- **Dual-mode system** - Standard (auto) and Engineer (custom stack builder)
- **BOQ integration** - material-accurate quantities and costs
- **SANS compliance** - all construction standards enforced
- **Drawing details** - section views showing material layers

This completes the wall specification for the enterprise-grade SVG-Based Parametric CAD & BOQ Platform.

---

**END OF VOLUME IX**
