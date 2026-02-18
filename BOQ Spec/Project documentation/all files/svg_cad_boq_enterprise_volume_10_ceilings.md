# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification
## Volume X — Ceiling Systems: Material-Based Parametric Construction & BOQ Integration

**Version:** 10.0  
**Revision Date:** 2026-02-18  
**Document Type:** Enterprise Engineering Specification  

---

# 1. Document Control

- **Version:** 10.0
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** __________________

---

# 2. Scope

Volume X defines the **Complete Ceiling System with Material-Based Parametric Construction** for the SVG-Based Parametric CAD & BOQ Platform.

This document establishes:

- **Material-First Architecture**: Ceiling construction from actual components (battens, hangers, boards, tiles)
- **Ceiling Types**: Flat, suspended, bulkhead, stepped, coffered, raked, curved
- **Structural Systems**: Timber battens, steel channels, suspended grid, direct-fix
- **Finishing Systems**: Gypsum, acoustic tiles, metal panels, timber, PVC
- **Complete Construction Sequences**: Hangers → grid → insulation → finish
- **Dual-Mode Engineering**: Standard (auto SANS-compliant) and Engineer (custom structural)
- **BOQ Integration**: Accurate material counts, suspension components, finishes
- **3D Geometries**: Bulkheads, coffers, trays, steps with actual depths and reveals

---

# 3. Strategic Objective

The ceiling system must:

- **Build ceilings from actual materials** - not abstract assemblies
- **Calculate depths automatically** from batten + board + suspension heights
- **Follow real construction sequences** - structure → suspension → insulation → finish
- **Generate accurate material quantities** - battens, hangers, boards, tiles, trims
- **Support complex geometries** - bulkheads, steps, coffers with reveals and returns
- **Ensure SANS compliance** at every construction stage
- **Integrate with roof structure** (trusses, beams, slabs above)
- **Provide 3D section views** showing construction layers and depths

---

# 4. Ceiling Type Classification

```ts
type CeilingCategory = 
  | 'flat_direct_fix'           // Directly attached to structure above
  | 'flat_suspended'            // Suspended below structure
  | 'bulkhead'                  // Drop-down section (perimeter or feature)
  | 'stepped'                   // Multiple height levels
  | 'coffered'                  // Recessed panels (grid pattern)
  | 'tray'                      // Raised center with step-down perimeter
  | 'raked'                     // Follows roof pitch
  | 'curved'                    // Barrel vault, dome, wave
  | 'acoustic_suspended'        // Exposed grid system
  | 'concealed_grid';           // Hidden grid with panels

interface CeilingClassification {
  category: CeilingCategory;
  structural: 'load_bearing' | 'non_load_bearing';
  constructionMethod: 'direct_fix' | 'suspended' | 'hybrid';
  accessType: 'fixed' | 'accessible' | 'removable_panels';
  fireRating: number;           // minutes
  acousticRating: number;       // NRC (Noise Reduction Coefficient)
}
```

---

# 5. Material Libraries - Ceiling Components

## 5.1 Ceiling Battens (Timber/Steel)

```ts
interface BattenType {
  id: string;
  name: string;
  material: 'timber' | 'steel';
  
  // Actual dimensions
  dimensions: {
    width: number;          // mm
    depth: number;          // mm
  };
  
  // For timber
  timberGrade?: 'SA_Pine_Grade_5' | 'SA_Pine_Grade_7';
  treatment?: 'H2' | 'H3' | 'untreated';
  
  // For steel
  steelProfile?: 'top_hat' | 'furring_channel' | 'C_section';
  thickness?: number;       // mm (BMT)
  coating?: 'galvanised' | 'powder_coated';
  
  spacing: {
    standard: number;       // mm c/c (400, 450, 600mm)
    maximum: number;        // mm (SANS limit)
  };
  
  loadCapacity: number;     // kg/m
  
  cost: {
    perLinearMeter: number; // ZAR
  };
}

const CEILING_BATTEN_LIBRARY: BattenType[] = [
  {
    id: 'timber_batten_38x38',
    name: 'Timber Ceiling Batten 38×38mm',
    material: 'timber',
    dimensions: { width: 38, depth: 38 },
    timberGrade: 'SA_Pine_Grade_5',
    treatment: 'H2',
    spacing: {
      standard: 400,
      maximum: 450
    },
    loadCapacity: 15,
    cost: {
      perLinearMeter: 18
    }
  },
  
  {
    id: 'timber_batten_38x50',
    name: 'Timber Ceiling Batten 38×50mm',
    material: 'timber',
    dimensions: { width: 38, depth: 50 },
    timberGrade: 'SA_Pine_Grade_5',
    treatment: 'H2',
    spacing: {
      standard: 450,
      maximum: 600
    },
    loadCapacity: 20,
    cost: {
      perLinearMeter: 22
    }
  },
  
  {
    id: 'steel_top_hat_0.55',
    name: 'Steel Top Hat 38mm × 0.55mm BMT',
    material: 'steel',
    dimensions: { width: 38, depth: 12 },
    steelProfile: 'top_hat',
    thickness: 0.55,
    coating: 'galvanised',
    spacing: {
      standard: 600,
      maximum: 600
    },
    loadCapacity: 25,
    cost: {
      perLinearMeter: 24
    }
  },
  
  {
    id: 'steel_furring_channel',
    name: 'Steel Furring Channel 64mm × 0.5mm',
    material: 'steel',
    dimensions: { width: 64, depth: 13 },
    steelProfile: 'furring_channel',
    thickness: 0.5,
    coating: 'galvanised',
    spacing: {
      standard: 400,
      maximum: 600
    },
    loadCapacity: 30,
    cost: {
      perLinearMeter: 28
    }
  }
];
```

## 5.2 Suspension System Components

```ts
interface SuspensionType {
  id: string;
  name: string;
  system: 'wire_hanger' | 'rod_hanger' | 'clip_in' | 'spring_hanger';
  
  components: {
    mainComponent: {
      type: string;
      specification: string;
      spacing: number;      // mm (typical spacing)
    };
    
    anchorage: {
      type: 'powder_actuated' | 'expansion_anchor' | 'through_bolt';
      size: string;
      pullOutCapacity: number; // kN
    };
  };
  
  dropRange: {
    minimum: number;        // mm
    maximum: number;        // mm
  };
  
  loadCapacity: number;     // kg per hanger
  
  adjustable: boolean;
  
  cost: {
    perHanger: number;      // ZAR
  };
}

const SUSPENSION_LIBRARY: SuspensionType[] = [
  {
    id: 'wire_hanger_2mm',
    name: 'Galvanised Wire Hanger 2mm',
    system: 'wire_hanger',
    components: {
      mainComponent: {
        type: 'galvanised_wire',
        specification: '2mm diameter',
        spacing: 1200
      },
      anchorage: {
        type: 'powder_actuated',
        size: 'DNI20',
        pullOutCapacity: 2.5
      }
    },
    dropRange: {
      minimum: 50,
      maximum: 600
    },
    loadCapacity: 30,
    adjustable: false,
    cost: {
      perHanger: 8.50
    }
  },
  
  {
    id: 'threaded_rod_6mm',
    name: 'Threaded Rod Hanger 6mm',
    system: 'rod_hanger',
    components: {
      mainComponent: {
        type: 'threaded_rod',
        specification: 'M6 galvanised',
        spacing: 1200
      },
      anchorage: {
        type: 'expansion_anchor',
        size: 'M8×50',
        pullOutCapacity: 4.5
      }
    },
    dropRange: {
      minimum: 100,
      maximum: 1500
    },
    loadCapacity: 50,
    adjustable: true,
    cost: {
      perHanger: 18.50
    }
  },
  
  {
    id: 'spring_hanger_heavy',
    name: 'Spring Hanger (Heavy Duty)',
    system: 'spring_hanger',
    components: {
      mainComponent: {
        type: 'spring_loaded',
        specification: 'Adjustable 100-300mm',
        spacing: 900
      },
      anchorage: {
        type: 'expansion_anchor',
        size: 'M10×75',
        pullOutCapacity: 6.0
      }
    },
    dropRange: {
      minimum: 100,
      maximum: 300
    },
    loadCapacity: 75,
    adjustable: true,
    cost: {
      perHanger: 42
    }
  }
];
```

## 5.3 Suspended Grid Systems (Acoustic Ceiling)

```ts
interface GridSystemType {
  id: string;
  name: string;
  type: 'exposed_tee' | 'concealed_spline' | 'hook_on';
  
  grid: {
    mainRunner: {
      profile: string;        // e.g., '24mm tee'
      length: number;         // mm (standard lengths)
      spacing: number;        // mm c/c
      finish: 'white' | 'black' | 'metallic' | 'custom';
    };
    
    crossTee: {
      profile: string;
      length: number;         // mm (600, 1200mm)
      spacing: number;        // mm c/c
    };
    
    wallAngle: {
      profile: string;
      length: number;         // mm
      finish: string;
    };
  };
  
  tileSize: {
    standard: number[];     // mm (e.g., [600, 600])
    compatible: number[][];  // Other compatible sizes
  };
  
  suspension: {
    wireSpacing: number;    // mm
    clipsPerTile: number;
  };
  
  cost: {
    mainRunnerPerM: number; // ZAR per linear meter
    crossTeePerM: number;   // ZAR per linear meter
    wallAnglePerM: number;  // ZAR per linear meter
  };
}

const GRID_SYSTEM_LIBRARY: GridSystemType[] = [
  {
    id: 'exposed_grid_24mm',
    name: 'Exposed Grid System 24mm White',
    type: 'exposed_tee',
    grid: {
      mainRunner: {
        profile: '24mm tee',
        length: 3600,
        spacing: 1200,
        finish: 'white'
      },
      crossTee: {
        profile: '24mm tee',
        length: 1200,
        spacing: 600
      },
      wallAngle: {
        profile: 'L-angle 24mm',
        length: 3000,
        finish: 'white'
      }
    },
    tileSize: {
      standard: [600, 600],
      compatible: [[600, 600], [600, 1200], [300, 300]]
    },
    suspension: {
      wireSpacing: 1200,
      clipsPerTile: 0  // Direct lay-in
    },
    cost: {
      mainRunnerPerM: 42,
      crossTeePerM: 38,
      wallAnglePerM: 28
    }
  },
  
  {
    id: 'concealed_grid',
    name: 'Concealed Grid System (Tegular Tiles)',
    type: 'concealed_spline',
    grid: {
      mainRunner: {
        profile: '15mm concealed',
        length: 3600,
        spacing: 1200,
        finish: 'black'
      },
      crossTee: {
        profile: '15mm concealed',
        length: 1200,
        spacing: 600
      },
      wallAngle: {
        profile: 'Shadow line trim',
        length: 3000,
        finish: 'black'
      }
    },
    tileSize: {
      standard: [600, 600],
      compatible: [[600, 600]]
    },
    suspension: {
      wireSpacing: 1200,
      clipsPerTile: 4
    },
    cost: {
      mainRunnerPerM: 58,
      crossTeePerM: 52,
      wallAnglePerM: 35
    }
  }
];
```

## 5.4 Ceiling Board Types

```ts
interface CeilingBoardType {
  id: string;
  name: string;
  material: 'gypsum' | 'fibre_cement' | 'calcium_silicate' | 'wood_based';
  
  dimensions: {
    thickness: number;      // mm
    width: number;          // mm (standard 1200mm)
    length: number;         // mm (2400, 2700, 3000mm)
  };
  
  edgeType: 'square' | 'tapered' | 'rebated' | 'tongue_groove';
  
  finish: {
    face: 'smooth' | 'textured' | 'embossed';
    readyToPaint: boolean;
    requiresSkimCoat: boolean;
  };
  
  performance: {
    fireRating: number;     // minutes
    moistureResistant: boolean;
    impact: 'standard' | 'resistant';
    density: number;        // kg/m³
    rValue: number;         // Thermal resistance
  };
  
  weight: number;           // kg per sheet
  
  installation: {
    fixingCenters: number;  // mm (screw spacing)
    fixingType: 'screws' | 'nails' | 'adhesive';
    jointTreatment: 'tape_and_compound' | 'cornice_only' | 'none';
  };
  
  cost: {
    perSheet: number;       // ZAR
    perM2: number;          // ZAR
  };
}

const CEILING_BOARD_LIBRARY: CeilingBoardType[] = [
  {
    id: 'gypsum_ceiling_9mm',
    name: 'Gypsum Ceiling Board 9mm',
    material: 'gypsum',
    dimensions: {
      thickness: 9,
      width: 1200,
      length: 2400
    },
    edgeType: 'tapered',
    finish: {
      face: 'smooth',
      readyToPaint: true,
      requiresSkimCoat: false
    },
    performance: {
      fireRating: 30,
      moistureResistant: false,
      impact: 'standard',
      density: 650,
      rValue: 0.06
    },
    weight: 18.7,
    installation: {
      fixingCenters: 200,
      fixingType: 'screws',
      jointTreatment: 'tape_and_compound'
    },
    cost: {
      perSheet: 125,
      perM2: 43
    }
  },
  
  {
    id: 'gypsum_ceiling_12.5mm',
    name: 'Gypsum Ceiling Board 12.5mm',
    material: 'gypsum',
    dimensions: {
      thickness: 12.5,
      width: 1200,
      length: 2400
    },
    edgeType: 'tapered',
    finish: {
      face: 'smooth',
      readyToPaint: true,
      requiresSkimCoat: false
    },
    performance: {
      fireRating: 30,
      moistureResistant: false,
      impact: 'standard',
      density: 700,
      rValue: 0.08
    },
    weight: 25.2,
    installation: {
      fixingCenters: 200,
      fixingType: 'screws',
      jointTreatment: 'tape_and_compound'
    },
    cost: {
      perSheet: 145,
      perM2: 50
    }
  },
  
  {
    id: 'gypsum_moisture_resistant',
    name: 'Moisture Resistant Ceiling Board 12.5mm',
    material: 'gypsum',
    dimensions: {
      thickness: 12.5,
      width: 1200,
      length: 2400
    },
    edgeType: 'tapered',
    finish: {
      face: 'smooth',
      readyToPaint: true,
      requiresSkimCoat: false
    },
    performance: {
      fireRating: 30,
      moistureResistant: true,
      impact: 'standard',
      density: 750,
      rValue: 0.08
    },
    weight: 27.0,
    installation: {
      fixingCenters: 200,
      fixingType: 'screws',
      jointTreatment: 'tape_and_compound'
    },
    cost: {
      perSheet: 185,
      perM2: 64
    }
  },
  
  {
    id: 'fibre_cement_6mm',
    name: 'Fibre Cement Ceiling Board 6mm',
    material: 'fibre_cement',
    dimensions: {
      thickness: 6,
      width: 1200,
      length: 2400
    },
    edgeType: 'square',
    finish: {
      face: 'smooth',
      readyToPaint: false,
      requiresSkimCoat: true
    },
    performance: {
      fireRating: 60,
      moistureResistant: true,
      impact: 'resistant',
      density: 1400,
      rValue: 0.04
    },
    weight: 24.2,
    installation: {
      fixingCenters: 300,
      fixingType: 'screws',
      jointTreatment: 'cornice_only'
    },
    cost: {
      perSheet: 195,
      perM2: 68
    }
  }
];
```

## 5.5 Acoustic Ceiling Tiles

```ts
interface AcousticTileType {
  id: string;
  name: string;
  material: 'mineral_fibre' | 'fiberglass' | 'metal' | 'wood_wool';
  
  dimensions: {
    width: number;          // mm
    length: number;         // mm
    thickness: number;      // mm
  };
  
  edgeDetail: 'square' | 'tegular' | 'beveled' | 'shiplap';
  
  surface: {
    pattern: 'fissured' | 'smooth' | 'textured' | 'perforated' | 'random';
    finish: 'painted' | 'vinyl_faced' | 'natural' | 'aluminum';
    color: string[];
  };
  
  performance: {
    nrc: number;            // Noise Reduction Coefficient (0-1)
    cac: number;            // Ceiling Attenuation Class
    lightReflectance: number; // % (LR)
    fireRating: string;     // e.g., 'Class 0', 'Class 1'
    humidity: {
      rh: number;           // % Relative Humidity rating
      sag: 'low' | 'medium' | 'high'; // Sag resistance
    };
  };
  
  weight: number;           // kg per tile
  
  installation: {
    gridType: 'exposed' | 'concealed';
    requiresClips: boolean;
    washable: boolean;
  };
  
  cost: {
    perTile: number;        // ZAR
    perM2: number;          // ZAR
  };
}

const ACOUSTIC_TILE_LIBRARY: AcousticTileType[] = [
  {
    id: 'mineral_fibre_600x600',
    name: 'Mineral Fibre Tile 600×600×15mm',
    material: 'mineral_fibre',
    dimensions: {
      width: 600,
      length: 600,
      thickness: 15
    },
    edgeDetail: 'square',
    surface: {
      pattern: 'fissured',
      finish: 'painted',
      color: ['White', 'Off-white']
    },
    performance: {
      nrc: 0.55,
      cac: 33,
      lightReflectance: 84,
      fireRating: 'Class 0',
      humidity: {
        rh: 95,
        sag: 'medium'
      }
    },
    weight: 1.8,
    installation: {
      gridType: 'exposed',
      requiresClips: false,
      washable: false
    },
    cost: {
      perTile: 38,
      perM2: 106
    }
  },
  
  {
    id: 'fiberglass_600x600_high_nrc',
    name: 'Fiberglass High Performance Tile 600×600×19mm',
    material: 'fiberglass',
    dimensions: {
      width: 600,
      length: 600,
      thickness: 19
    },
    edgeDetail: 'tegular',
    surface: {
      pattern: 'smooth',
      finish: 'vinyl_faced',
      color: ['White', 'Cream', 'Grey']
    },
    performance: {
      nrc: 0.85,
      cac: 38,
      lightReflectance: 89,
      fireRating: 'Class 0',
      humidity: {
        rh: 99,
        sag: 'low'
      }
    },
    weight: 2.4,
    installation: {
      gridType: 'concealed',
      requiresClips: true,
      washable: true
    },
    cost: {
      perTile: 68,
      perM2: 189
    }
  },
  
  {
    id: 'metal_tile_600x600',
    name: 'Perforated Metal Tile 600×600×0.6mm',
    material: 'metal',
    dimensions: {
      width: 600,
      length: 600,
      thickness: 0.6
    },
    edgeDetail: 'square',
    surface: {
      pattern: 'perforated',
      finish: 'aluminum',
      color: ['White', 'Silver', 'Black', 'Custom RAL']
    },
    performance: {
      nrc: 0.45,
      cac: 28,
      lightReflectance: 75,
      fireRating: 'A1 Non-combustible',
      humidity: {
        rh: 100,
        sag: 'low'
      }
    },
    weight: 2.1,
    installation: {
      gridType: 'exposed',
      requiresClips: false,
      washable: true
    },
    cost: {
      perTile: 95,
      perM2: 264
    }
  }
];
```

## 5.6 Cornice & Trim Profiles

```ts
interface CorniceType {
  id: string;
  name: string;
  material: 'gypsum' | 'polystyrene' | 'polyurethane' | 'plaster' | 'timber';
  
  profile: {
    code: string;           // e.g., 'C75', 'C100', 'SC2'
    projection: number;     // mm (face height)
    drop: number;           // mm (ceiling depth)
  };
  
  style: 'plain' | 'decorative' | 'modern' | 'victorian';
  
  installation: {
    adhesive: string;
    fixingRequired: boolean;
    corners: 'mitered' | 'corner_pieces';
  };
  
  finish: {
    primed: boolean;
    paintable: boolean;
  };
  
  cost: {
    perLinearMeter: number; // ZAR
  };
}

const CORNICE_LIBRARY: CorniceType[] = [
  {
    id: 'gypsum_c75',
    name: 'Gypsum Cornice 75mm',
    material: 'gypsum',
    profile: {
      code: 'C75',
      projection: 75,
      drop: 75
    },
    style: 'plain',
    installation: {
      adhesive: 'Gypsum cornice adhesive',
      fixingRequired: false,
      corners: 'mitered'
    },
    finish: {
      primed: false,
      paintable: true
    },
    cost: {
      perLinearMeter: 28
    }
  },
  
  {
    id: 'gypsum_c100',
    name: 'Gypsum Cornice 100mm',
    material: 'gypsum',
    profile: {
      code: 'C100',
      projection: 100,
      drop: 100
    },
    style: 'plain',
    installation: {
      adhesive: 'Gypsum cornice adhesive',
      fixingRequired: true,
      corners: 'mitered'
    },
    finish: {
      primed: false,
      paintable: true
    },
    cost: {
      perLinearMeter: 35
    }
  },
  
  {
    id: 'polyurethane_sc2',
    name: 'Polyurethane Cornice SC2 (Decorative)',
    material: 'polyurethane',
    profile: {
      code: 'SC2',
      projection: 110,
      drop: 95
    },
    style: 'decorative',
    installation: {
      adhesive: 'Contact adhesive',
      fixingRequired: false,
      corners: 'corner_pieces'
    },
    finish: {
      primed: true,
      paintable: true
    },
    cost: {
      perLinearMeter: 68
    }
  },
  
  {
    id: 'shadowline_10mm',
    name: 'Shadow Line Trim 10mm',
    material: 'gypsum',
    profile: {
      code: 'SL10',
      projection: 10,
      drop: 10
    },
    style: 'modern',
    installation: {
      adhesive: 'Jointing compound',
      fixingRequired: false,
      corners: 'mitered'
    },
    finish: {
      primed: false,
      paintable: true
    },
    cost: {
      perLinearMeter: 22
    }
  }
];
```

## 5.7 Ceiling Insulation

```ts
interface CeilingInsulationType {
  id: string;
  name: string;
  material: 'glasswool' | 'polyester' | 'cellulose' | 'reflective_foil' | 'aerogel';
  
  form: 'batt' | 'blanket' | 'loose_fill' | 'rigid_board';
  
  dimensions?: {
    thickness: number;      // mm
    width: number;          // mm (for batts)
    length: number;         // mm (for batts)
  };
  
  thermal: {
    rValue: number;         // m²K/W
    conductivity: number;   // W/mK
  };
  
  acoustic: {
    nrc: number;            // Noise Reduction Coefficient
  };
  
  fireRating: string;
  
  coverage: {
    perPack?: number;       // m² (for batts/blankets)
    perBag?: number;        // m² @ specified thickness (loose fill)
  };
  
  installation: {
    method: string;
    vapourBarrier: boolean;
  };
  
  cost: {
    perM2: number;          // ZAR (installed at specified thickness)
  };
}

const CEILING_INSULATION_LIBRARY: CeilingInsulationType[] = [
  {
    id: 'glasswool_135_r3.3',
    name: 'Glasswool Ceiling Batt 135mm (R3.3)',
    material: 'glasswool',
    form: 'batt',
    dimensions: {
      thickness: 135,
      width: 430,
      length: 1160
    },
    thermal: {
      rValue: 3.3,
      conductivity: 0.041
    },
    acoustic: {
      nrc: 0.90
    },
    fireRating: 'A1 Non-combustible',
    coverage: {
      perPack: 15.48  // 13 batts
    },
    installation: {
      method: 'Lay between ceiling joists',
      vapourBarrier: false
    },
    cost: {
      perM2: 68
    }
  },
  
  {
    id: 'glasswool_200_r5.0',
    name: 'Glasswool Ceiling Batt 200mm (R5.0)',
    material: 'glasswool',
    form: 'batt',
    dimensions: {
      thickness: 200,
      width: 580,
      length: 1160
    },
    thermal: {
      rValue: 5.0,
      conductivity: 0.040
    },
    acoustic: {
      nrc: 0.95
    },
    fireRating: 'A1 Non-combustible',
    coverage: {
      perPack: 11.37  // 8 batts
    },
    installation: {
      method: 'Lay between ceiling joists',
      vapourBarrier: false
    },
    cost: {
      perM2: 98
    }
  },
  
  {
    id: 'reflective_foil_single',
    name: 'Reflective Foil Insulation (Single sided)',
    material: 'reflective_foil',
    form: 'blanket',
    dimensions: {
      thickness: 5,
      width: 1350,
      length: 60000  // 60m roll
    },
    thermal: {
      rValue: 0.6,    // When installed with airspace
      conductivity: 0.05
    },
    acoustic: {
      nrc: 0.10
    },
    fireRating: 'Class 1',
    coverage: {
      perPack: 81     // 60m × 1.35m
    },
    installation: {
      method: 'Stapled to underside of rafters',
      vapourBarrier: true
    },
    cost: {
      perM2: 28
    }
  },
  
  {
    id: 'cellulose_loose_fill',
    name: 'Cellulose Loose-Fill Insulation',
    material: 'cellulose',
    form: 'loose_fill',
    thermal: {
      rValue: 3.5,    // At 100mm thickness
      conductivity: 0.039
    },
    acoustic: {
      nrc: 0.75
    },
    fireRating: 'Class B',
    coverage: {
      perBag: 1.2     // m² @ 100mm thickness per 13kg bag
    },
    installation: {
      method: 'Blown in',
      vapourBarrier: false
    },
    cost: {
      perM2: 72       // At 100mm thickness
    }
  }
];
```

---

# 6. Ceiling Construction Models

## 6.1 Basic Flat Ceiling (Direct Fix)

```ts
interface FlatDirectFixCeiling {
  id: string;
  type: 'flat_direct_fix';
  
  // Ceiling area
  polygon: Point3D[];       // Ceiling boundary
  
  // Height
  height: number;           // mm (finished ceiling level)
  
  // Support structure (what ceiling is fixed to)
  supportStructure: {
    type: 'trusses' | 'beams' | 'joists' | 'slab';
    spacing: number;        // mm c/c
    bottomChord?: {
      width: number;        // mm
      depth: number;        // mm
    };
  };
  
  // Battens (if required)
  battens?: {
    battenType: string;     // Reference to CEILING_BATTEN_LIBRARY
    direction: 'parallel' | 'perpendicular' | 'cross_battened';
    spacing: number;        // mm c/c
    fixingMethod: 'nails' | 'screws' | 'clips';
  };
  
  // Ceiling board
  board: {
    boardType: string;      // Reference to CEILING_BOARD_LIBRARY
    orientation: 'parallel' | 'perpendicular' | 'diagonal';
    layering: 'single' | 'double';
  };
  
  // Insulation above ceiling
  insulation?: {
    insulationType: string; // Reference to CEILING_INSULATION_LIBRARY
    thickness: number;      // mm
    coverage: 'full' | 'partial';
  };
  
  // Cornice
  cornice: {
    corniceType: string;    // Reference to CORNICE_LIBRARY
    allWalls: boolean;
    walls?: string[];       // Specific wall IDs if not all
  };
  
  // Total depth calculation
  depth: {
    battens: number;        // mm (batten depth if used)
    board: number;          // mm (board thickness)
    totalDropBelowStructure: number; // mm
  };
}
```

## 6.2 Suspended Ceiling (Gypsum on Grid)

```ts
interface SuspendedGypsumCeiling {
  id: string;
  type: 'flat_suspended';
  
  polygon: Point3D[];
  
  // Heights
  heights: {
    structureAbove: number;     // mm (soffit of slab/roof)
    finishedCeiling: number;    // mm
    suspensionDrop: number;     // mm (structure - ceiling)
  };
  
  // Suspension system
  suspension: {
    suspensionType: string;     // Reference to SUSPENSION_LIBRARY
    hangerSpacing: {
      longitudinal: number;     // mm
      transverse: number;       // mm
    };
    hangerQuantity: number;     // Auto-calculated
  };
  
  // Primary battens/channels
  primaryBattens: {
    battenType: string;
    direction: 'parallel' | 'perpendicular';
    spacing: number;            // mm c/c
    length: number;             // mm (typical section length)
  };
  
  // Secondary battens (cross battens)
  secondaryBattens?: {
    battenType: string;
    spacing: number;            // mm c/c
    length: number;             // mm
  };
  
  // Ceiling board
  board: {
    boardType: string;
    orientation: 'parallel' | 'perpendicular';
    layers: number;             // 1 or 2
  };
  
  // Insulation above
  insulation?: {
    insulationType: string;
    thickness: number;
    placement: 'on_ceiling' | 'on_structure';
  };
  
  // Perimeter detail
  perimeter: {
    type: 'cornice' | 'shadowline' | 'flush';
    corniceType?: string;
    shadowlineDepth?: number;   // mm
  };
  
  // Access panels
  accessPanels: {
    required: boolean;
    size: number[];             // mm [width, height]
    quantity: number;
    locations: Point3D[];
  };
}
```

## 6.3 Acoustic Grid Ceiling

```ts
interface AcousticGridCeiling {
  id: string;
  type: 'acoustic_suspended';
  
  polygon: Point3D[];
  
  heights: {
    structureAbove: number;
    finishedCeiling: number;
    suspensionDrop: number;
  };
  
  // Grid system
  gridSystem: {
    systemType: string;         // Reference to GRID_SYSTEM_LIBRARY
    
    mainRunners: {
      direction: 'parallel' | 'perpendicular';
      spacing: number;          // mm c/c
      length: number;           // mm per section
      quantity: number;         // Linear meters
    };
    
    crossTees: {
      length: number;           // mm (600 or 1200)
      quantity: number;         // Linear meters
    };
    
    wallAngle: {
      perimeter: number;        // Linear meters
    };
  };
  
  // Suspension wires
  suspension: {
    wireType: string;           // Reference to suspension library
    spacing: number;            // mm
    quantity: number;
  };
  
  // Tiles
  tiles: {
    tileType: string;           // Reference to ACOUSTIC_TILE_LIBRARY
    size: number[];             // mm [width, length]
    quantity: number;           // Number of tiles
    pattern: 'regular' | 'staggered' | 'custom';
  };
  
  // Ceiling plenum (space above)
  plenum: {
    height: number;             // mm (suspension drop)
    insulation?: {
      type: string;
      thickness: number;
    };
    services: {
      hvac: boolean;
      electrical: boolean;
      sprinklers: boolean;
    };
  };
}
```

## 6.4 Bulkhead Ceiling

```ts
interface BulkheadCeiling {
  id: string;
  type: 'bulkhead';
  
  // Bulkhead location and geometry
  geometry: {
    outline: Point3D[];         // Bulkhead perimeter
    type: 'perimeter' | 'feature' | 'beam_box' | 'service_run';
  };
  
  // Heights and depths
  dimensions: {
    topCeilingHeight: number;   // mm (main ceiling level)
    bulkheadCeilingHeight: number; // mm (bulkhead soffit)
    bulkheadDrop: number;       // mm (top - bulkhead)
    bulkheadWidth: number;      // mm (for perimeter bulkhead)
  };
  
  // Structure
  structure: {
    // Vertical studs/noggins forming sides
    verticalFraming: {
      studType: string;         // Timber or steel stud
      spacing: number;          // mm c/c
      height: number;           // mm (bulkhead drop)
    };
    
    // Horizontal battens for bulkhead soffit
    soffit Battens: {
      battenType: string;
      direction: 'parallel' | 'perpendicular';
      spacing: number;          // mm c/c
    };
    
    // Connection to main ceiling
    connection: {
      type: 'suspended_from_main' | 'independent_suspension' | 'fixed_to_wall';
      hangers?: {
        type: string;
        spacing: number;
      };
    };
  };
  
  // Finishes
  finishes: {
    // Soffit (bottom of bulkhead)
    soffit: {
      boardType: string;
      layers: number;
    };
    
    // Sides/faces
    faces: {
      boardType: string;
      layers: number;
    };
    
    // Integration with main ceiling
    transition: {
      type: 'cornice' | 'shadowline' | 'flush' | 'step_detail';
      corniceType?: string;
      shadowlineDepth?: number;
    };
  };
  
  // Lighting integration
  lighting?: {
    type: 'recessed' | 'strip' | 'cove' | 'none';
    locations: Point3D[];
    cutouts: {
      size: number[];           // mm [width, length]
      quantity: number;
    };
  };
}
```

## 6.5 Stepped Ceiling

```ts
interface SteppedCeiling {
  id: string;
  type: 'stepped';
  
  // Multiple ceiling levels
  levels: CeilingLevel[];
  
  // Transitions between levels
  transitions: CeilingTransition[];
}

interface CeilingLevel {
  id: string;
  sequence: number;             // 1 = highest, 2 = next down, etc.
  
  polygon: Point3D[];           // Area of this level
  height: number;               // mm (finished ceiling height)
  
  construction: {
    suspensionType: 'suspended' | 'direct_fix';
    
    // If suspended
    suspension?: {
      suspensionType: string;
      drop: number;             // mm
    };
    
    battens: {
      battenType: string;
      spacing: number;
    };
    
    board: {
      boardType: string;
      layers: number;
    };
  };
  
  insulation?: {
    insulationType: string;
    thickness: number;
  };
}

interface CeilingTransition {
  id: string;
  fromLevel: string;            // Level ID
  toLevel: string;              // Level ID
  
  // Step geometry
  step: {
    height: number;             // mm (vertical drop)
    type: 'vertical_face' | 'angled_face' | 'curved';
    angle?: number;             // degrees (if angled)
  };
  
  // Edge detail
  edge: {
    line: Point3D[];            // Transition line in plan
    length: number;             // mm (calculated)
  };
  
  // Construction of transition
  structure: {
    verticalFraming: {
      studType: string;
      spacing: number;
      height: number;           // mm (step height)
    };
    
    face: {
      boardType: string;
      layers: number;
    };
    
    edgeTrim: {
      type: 'cornice' | 'shadowline' | 'none';
      profile?: string;
    };
  };
}
```

## 6.6 Coffered Ceiling

```ts
interface CofferedCeiling {
  id: string;
  type: 'coffered';
  
  polygon: Point3D[];
  
  // Overall ceiling height
  mainCeilingHeight: number;    // mm
  
  // Coffer pattern
  pattern: {
    type: 'grid' | 'linear' | 'custom';
    
    // If grid pattern
    grid?: {
      rows: number;
      columns: number;
      spacing: {
        longitudinal: number;   // mm between coffers
        transverse: number;     // mm between coffers
      };
    };
    
    // Individual coffer dimensions
    cofferSize: {
      width: number;            // mm
      length: number;           // mm
      depth: number;            // mm (recess depth)
    };
  };
  
  // Beam construction (between coffers)
  beams: {
    // Longitudinal beams
    longitudinal: {
      width: number;            // mm (drop-down width)
      depth: number;            // mm (below main ceiling)
      quantity: number;
    };
    
    // Transverse beams
    transverse: {
      width: number;            // mm
      depth: number;            // mm
      quantity: number;
    };
    
    // Beam structure
    structure: {
      type: 'solid_timber' | 'hollow_box' | 'solid_gypsum';
      
      // If hollow box
      hollowBox?: {
        studs: {
          studType: string;
          spacing: number;
        };
        sheeting: {
          boardType: string;
          sides: number;        // 2, 3, or 4 sided
        };
      };
    };
    
    // Beam finish
    finish: {
      type: 'paint' | 'stain' | 'decorative_moulding';
      moulding?: string;
    };
  };
  
  // Recessed panels (coffers)
  panels: {
    quantity: number;           // Auto-calculated
    
    construction: {
      type: 'suspended' | 'direct_fix';
      
      battens: {
        battenType: string;
        spacing: number;
      };
      
      board: {
        boardType: string;
        layers: number;
      };
      
      finish: {
        type: 'plain' | 'decorative_panel' | 'wallpaper';
      };
    };
    
    // Optional features in panels
    features?: {
      lighting: {
        type: 'recessed' | 'cove';
        perPanel: number;
      };
    };
  };
}
```

## 6.7 Tray Ceiling

```ts
interface TrayCeiling {
  id: string;
  type: 'tray';
  
  polygon: Point3D[];
  
  // Tray configuration
  configuration: {
    type: 'single_step' | 'multi_step' | 'inverted';
    
    // Center area (raised or recessed)
    center: {
      polygon: Point3D[];       // Center boundary
      offset: number;           // mm from perimeter
      height: number;           // mm (if raised) or depth (if inverted)
    };
    
    // Perimeter area
    perimeter: {
      width: number;            // mm (border width)
      height: number;           // mm (lower ceiling height)
    };
  };
  
  // Step/transition
  transition: {
    type: 'vertical' | 'angled' | 'curved';
    angle?: number;             // degrees (if angled)
    curve?: {
      radius: number;           // mm
      type: 'concave' | 'convex';
    };
    
    height: number;             // mm (step height)
  };
  
  // Construction
  structure: {
    // Perimeter level
    perimeterConstruction: {
      suspensionDrop: number;   // mm
      battens: {
        battenType: string;
        spacing: number;
      };
      board: {
        boardType: string;
      };
    };
    
    // Center level
    centerConstruction: {
      suspensionDrop: number;   // mm (less drop = higher ceiling)
      battens: {
        battenType: string;
        spacing: number;
      };
      board: {
        boardType: string;
      };
    };
    
    // Step face
    stepFace: {
      framing: {
        studType: string;
        spacing: number;
      };
      sheeting: {
        boardType: string;
      };
    };
  };
  
  // Lighting (often cove lighting in tray)
  lighting?: {
    type: 'cove' | 'recessed' | 'pendant';
    location: 'step' | 'center' | 'perimeter';
    ledStrip?: {
      length: number;           // Linear meters
      mounting: 'concealed' | 'exposed';
    };
  };
}
```

---

# 7. BOQ Generation for Ceiling Systems

## 7.1 Flat Ceiling BOQ

```ts
function generateFlatCeilingBOQ(ceiling: FlatDirectFixCeiling): CeilingBOQ {
  const ceilingArea = calculatePolygonArea(ceiling.polygon);
  
  const boq: CeilingBOQ = {
    battens: generateBattensBOQ(ceiling, ceilingArea),
    boards: generateCeilingBoardsBOQ(ceiling, ceilingArea),
    suspension: { items: [], totalCost: 0 }, // Not suspended
    insulation: ceiling.insulation 
      ? generateCeilingInsulationBOQ(ceiling, ceilingArea)
      : { items: [], totalCost: 0 },
    cornice: generateCorniceBOQ(ceiling),
    finishing: generateCeilingFinishingBOQ(ceiling, ceilingArea),
    accessories: generateCeilingAccessoriesBOQ(ceiling),
    labour: generateCeilingLabourBOQ(ceiling, ceilingArea),
    totalCost: 0
  };
  
  boq.totalCost = Object.values(boq)
    .filter(section => typeof section === 'object' && 'totalCost' in section)
    .reduce((sum, section) => sum + section.totalCost, 0);
  
  return boq;
}

function generateBattensBOQ(
  ceiling: FlatDirectFixCeiling,
  ceilingArea: number
): BOQSection {
  if (!ceiling.battens) {
    return { items: [], totalCost: 0 };
  }
  
  const items: BOQItem[] = [];
  
  const battenType = CEILING_BATTEN_LIBRARY.find(
    b => b.id === ceiling.battens.battenType
  );
  
  // Calculate batten length
  const roomDimensions = calculateBoundingBox(ceiling.polygon);
  const battenDirection = ceiling.battens.direction;
  
  let battenLength: number;
  if (battenDirection === 'parallel') {
    const battenRuns = Math.ceil(roomDimensions.width / ceiling.battens.spacing);
    battenLength = battenRuns * roomDimensions.length;
  } else {
    const battenRuns = Math.ceil(roomDimensions.length / ceiling.battens.spacing);
    battenLength = battenRuns * roomDimensions.width;
  }
  
  // Cross battening doubles the length
  if (battenDirection === 'cross_battened') {
    battenLength *= 2;
  }
  
  // Battens
  items.push({
    code: 'CEIL-BAT-001',
    description: `${battenType.name} @ ${ceiling.battens.spacing}mm c/c`,
    unit: 'm',
    quantity: battenLength / 1000,
    wastage: 10,
    totalQuantity: (battenLength / 1000) * 1.1,
    unitRate: battenType.cost.perLinearMeter,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      battens: battenType.material,
      direction: battenDirection,
      spacing: `${ceiling.battens.spacing}mm c/c`,
      supportSpacing: battenType.spacing.standard
    }
  });
  
  // Fixings
  const fixingSpacing = 600; // mm (typical)
  const fixingsPerBatten = Math.ceil((roomDimensions.length / fixingSpacing)) || 
                           Math.ceil((roomDimensions.width / fixingSpacing));
  const battenRuns = Math.ceil(roomDimensions.width / ceiling.battens.spacing) ||
                     Math.ceil(roomDimensions.length / ceiling.battens.spacing);
  const totalFixings = fixingsPerBatten * battenRuns;
  
  items.push({
    code: 'CEIL-FIX-001',
    description: battenType.material === 'timber' 
      ? 'Joist hangers / metal straps'
      : 'Ceiling clips for steel battens',
    unit: 'no',
    quantity: totalFixings,
    wastage: 10,
    totalQuantity: Math.ceil(totalFixings * 1.1),
    unitRate: battenType.material === 'timber' ? 12 : 8,
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Calculate costs
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}

function generateCeilingBoardsBOQ(
  ceiling: FlatDirectFixCeiling,
  ceilingArea: number
): BOQSection {
  const items: BOQItem[] = [];
  
  const boardType = CEILING_BOARD_LIBRARY.find(
    b => b.id === ceiling.board.boardType
  );
  
  const layers = ceiling.board.layering === 'double' ? 2 : 1;
  const totalArea = ceilingArea * layers;
  
  // Ceiling boards
  const sheetArea = (boardType.dimensions.width * boardType.dimensions.length) / 1000000; // m²
  const sheetsRequired = Math.ceil(totalArea / sheetArea);
  
  items.push({
    code: 'CEIL-BRD-001',
    description: `${boardType.name} - ${ceiling.board.orientation}`,
    unit: 'm²',
    quantity: totalArea,
    wastage: 10,
    totalQuantity: totalArea * 1.1,
    unitRate: boardType.cost.perM2,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      thickness: `${boardType.dimensions.thickness}mm`,
      sheets: sheetsRequired,
      layers,
      edgeType: boardType.edgeType
    }
  });
  
  items[0].totalCost = items[0].totalQuantity * boardType.cost.perM2;
  
  // Screws
  const screwsPerM2 = (1 / ((boardType.installation.fixingCenters / 1000) ** 2)) * 1.5;
  const totalScrews = Math.ceil(totalArea * screwsPerM2);
  
  items.push({
    code: 'CEIL-SCR-001',
    description: 'Ceiling screws (35mm)',
    unit: 'no',
    quantity: totalScrews,
    wastage: 10,
    totalQuantity: Math.ceil(totalScrews * 1.1),
    unitRate: 0.45,
    totalCost: 0,
    designMode: 'standard'
  });
  
  items[1].totalCost = items[1].totalQuantity * items[1].unitRate;
  
  // Joint treatment (if required)
  if (boardType.installation.jointTreatment === 'tape_and_compound') {
    const perimeter = calculatePerimeter(ceiling.polygon);
    const internalJoints = estimateInternalJoints(ceilingArea, boardType.dimensions);
    const totalJointLength = perimeter + internalJoints;
    
    // Joint tape
    items.push({
      code: 'CEIL-JNT-001',
      description: 'Paper joint tape',
      unit: 'm',
      quantity: totalJointLength,
      wastage: 15,
      totalQuantity: totalJointLength * 1.15,
      unitRate: 3.50,
      totalCost: 0,
      designMode: 'standard'
    });
    
    // Joint compound
    const compoundKg = ceilingArea * 0.8; // Approx 0.8kg per m² (3 coats)
    
    items.push({
      code: 'CEIL-JNT-002',
      description: 'Ceiling joint compound',
      unit: 'kg',
      quantity: compoundKg,
      wastage: 10,
      totalQuantity: compoundKg * 1.1,
      unitRate: 16.50,
      totalCost: 0,
      designMode: 'standard'
    });
    
    items[items.length - 2].totalCost = items[items.length - 2].totalQuantity * 3.50;
    items[items.length - 1].totalCost = items[items.length - 1].totalQuantity * 16.50;
  }
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}

function generateCorniceBOQ(ceiling: FlatDirectFixCeiling): BOQSection {
  const items: BOQItem[] = [];
  
  const corniceType = CORNICE_LIBRARY.find(
    c => c.id === ceiling.cornice.corniceType
  );
  
  const perimeter = calculatePerimeter(ceiling.polygon);
  
  // Cornice length
  items.push({
    code: 'CEIL-COR-001',
    description: corniceType.name,
    unit: 'm',
    quantity: perimeter,
    wastage: 10,
    totalQuantity: perimeter * 1.1,
    unitRate: corniceType.cost.perLinearMeter,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      profile: corniceType.profile.code,
      projection: `${corniceType.profile.projection}mm`,
      material: corniceType.material
    }
  });
  
  // Cornice adhesive
  const adhesiveKg = perimeter * 0.5; // Approx 0.5kg per linear meter
  
  items.push({
    code: 'CEIL-COR-002',
    description: corniceType.installation.adhesive,
    unit: 'kg',
    quantity: adhesiveKg,
    wastage: 10,
    totalQuantity: adhesiveKg * 1.1,
    unitRate: 22,
    totalCost: 0,
    designMode: 'standard'
  });
  
  // External and internal corners (mitered)
  const corners = countCorners(ceiling.polygon);
  
  items.push({
    code: 'CEIL-COR-003',
    description: 'Cornice corner mitres (cutting and fitting)',
    unit: 'no',
    quantity: corners,
    wastage: 0,
    totalQuantity: corners,
    unitRate: 25, // Labour per corner
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Calculate costs
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

## 7.2 Suspended Ceiling BOQ (Gypsum on Grid)

```ts
function generateSuspendedCeilingBOQ(
  ceiling: SuspendedGypsumCeiling
): CeilingBOQ {
  const ceilingArea = calculatePolygonArea(ceiling.polygon);
  
  const boq: CeilingBOQ = {
    suspension: generateSuspensionBOQ(ceiling, ceilingArea),
    battens: generateSuspendedBattensBOQ(ceiling, ceilingArea),
    boards: generateCeilingBoardsBOQ(ceiling, ceilingArea),
    insulation: ceiling.insulation 
      ? generateCeilingInsulationBOQ(ceiling, ceilingArea)
      : { items: [], totalCost: 0 },
    cornice: generateSuspendedCorniceBOQ(ceiling),
    finishing: generateCeilingFinishingBOQ(ceiling, ceilingArea),
    accessories: generateAccessPanelsBOQ(ceiling),
    labour: generateCeilingLabourBOQ(ceiling, ceilingArea),
    totalCost: 0
  };
  
  boq.totalCost = Object.values(boq)
    .filter(section => typeof section === 'object' && 'totalCost' in section)
    .reduce((sum, section) => sum + section.totalCost, 0);
  
  return boq;
}

function generateSuspensionBOQ(
  ceiling: SuspendedGypsumCeiling,
  ceilingArea: number
): BOQSection {
  const items: BOQItem[] = [];
  
  const suspensionType = SUSPENSION_LIBRARY.find(
    s => s.id === ceiling.suspension.suspensionType
  );
  
  // Calculate hanger quantity
  const hangersPerM2 = 1 / (
    (ceiling.suspension.hangerSpacing.longitudinal / 1000) *
    (ceiling.suspension.hangerSpacing.transverse / 1000)
  );
  
  const hangerQuantity = Math.ceil(ceilingArea * hangersPerM2);
  
  // Hangers
  items.push({
    code: 'CEIL-SUS-001',
    description: `${suspensionType.name} - drop ${ceiling.heights.suspensionDrop}mm`,
    unit: 'no',
    quantity: hangerQuantity,
    wastage: 5,
    totalQuantity: Math.ceil(hangerQuantity * 1.05),
    unitRate: suspensionType.cost.perHanger,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      spacing: `${ceiling.suspension.hangerSpacing.longitudinal}mm × ${ceiling.suspension.hangerSpacing.transverse}mm`,
      type: suspensionType.system,
      adjustable: suspensionType.adjustable
    }
  });
  
  // Anchorage (powder actuated nails or anchors)
  items.push({
    code: 'CEIL-SUS-002',
    description: `${suspensionType.components.anchorage.type} - ${suspensionType.components.anchorage.size}`,
    unit: 'no',
    quantity: hangerQuantity,
    wastage: 10,
    totalQuantity: Math.ceil(hangerQuantity * 1.1),
    unitRate: suspensionType.components.anchorage.type === 'powder_actuated' ? 4.50 : 8.50,
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Calculate costs
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

## 7.3 Acoustic Grid Ceiling BOQ

```ts
function generateAcousticGridBOQ(ceiling: AcousticGridCeiling): CeilingBOQ {
  const ceilingArea = calculatePolygonArea(ceiling.polygon);
  
  const items: BOQItem[] = [];
  
  const gridSystem = GRID_SYSTEM_LIBRARY.find(
    g => g.id === ceiling.gridSystem.systemType
  );
  
  const tileType = ACOUSTIC_TILE_LIBRARY.find(
    t => t.id === ceiling.tiles.tileType
  );
  
  // Main runners
  items.push({
    code: 'CEIL-GRD-001',
    description: `Main runners ${gridSystem.grid.mainRunner.profile} - ${gridSystem.grid.mainRunner.finish}`,
    unit: 'm',
    quantity: ceiling.gridSystem.mainRunners.quantity,
    wastage: 5,
    totalQuantity: ceiling.gridSystem.mainRunners.quantity * 1.05,
    unitRate: gridSystem.cost.mainRunnerPerM,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      spacing: `${ceiling.gridSystem.mainRunners.spacing}mm c/c`,
      sectionLength: `${gridSystem.grid.mainRunner.length}mm`
    }
  });
  
  // Cross tees
  items.push({
    code: 'CEIL-GRD-002',
    description: `Cross tees ${gridSystem.grid.crossTee.profile} - ${gridSystem.grid.mainRunner.finish}`,
    unit: 'm',
    quantity: ceiling.gridSystem.crossTees.quantity,
    wastage: 5,
    totalQuantity: ceiling.gridSystem.crossTees.quantity * 1.05,
    unitRate: gridSystem.cost.crossTeePerM,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      length: `${gridSystem.grid.crossTee.length}mm`
    }
  });
  
  // Wall angle
  items.push({
    code: 'CEIL-GRD-003',
    description: `Wall angle ${gridSystem.grid.wallAngle.profile} - ${gridSystem.grid.wallAngle.finish}`,
    unit: 'm',
    quantity: ceiling.gridSystem.wallAngle.perimeter,
    wastage: 5,
    totalQuantity: ceiling.gridSystem.wallAngle.perimeter * 1.05,
    unitRate: gridSystem.cost.wallAnglePerM,
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Suspension wires
  const suspensionWire = SUSPENSION_LIBRARY.find(
    s => s.id === ceiling.suspension.wireType
  );
  
  items.push({
    code: 'CEIL-GRD-004',
    description: suspensionWire.name,
    unit: 'no',
    quantity: ceiling.suspension.quantity,
    wastage: 5,
    totalQuantity: Math.ceil(ceiling.suspension.quantity * 1.05),
    unitRate: suspensionWire.cost.perHanger,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      spacing: `${ceiling.suspension.spacing}mm c/c`,
      drop: `${ceiling.heights.suspensionDrop}mm`
    }
  });
  
  // Acoustic tiles
  const tileArea = (tileType.dimensions.width * tileType.dimensions.length) / 1000000;
  const tilesRequired = Math.ceil(ceilingArea / tileArea);
  
  items.push({
    code: 'CEIL-TILE-001',
    description: `${tileType.name} - ${tileType.surface.pattern} ${tileType.surface.finish}`,
    unit: 'no',
    quantity: tilesRequired,
    wastage: 5,
    totalQuantity: Math.ceil(tilesRequired * 1.05),
    unitRate: tileType.cost.perTile,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      size: `${tileType.dimensions.width}×${tileType.dimensions.length}mm`,
      nrc: tileType.performance.nrc,
      fireRating: tileType.performance.fireRating,
      thickness: `${tileType.dimensions.thickness}mm`
    }
  });
  
  // Tile clips (if required)
  if (tileType.installation.requiresClips) {
    const clipsPerTile = 4;
    const totalClips = tilesRequired * clipsPerTile;
    
    items.push({
      code: 'CEIL-TILE-002',
      description: 'Tile hold-down clips',
      unit: 'no',
      quantity: totalClips,
      wastage: 5,
      totalQuantity: Math.ceil(totalClips * 1.05),
      unitRate: 2.50,
      totalCost: 0,
      designMode: 'standard'
    });
  }
  
  // Calculate costs
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    gridSystem: {
      items: items.slice(0, 3),
      totalCost: items.slice(0, 3).reduce((sum, item) => sum + item.totalCost, 0)
    },
    suspension: {
      items: [items[3]],
      totalCost: items[3].totalCost
    },
    tiles: {
      items: items.slice(4),
      totalCost: items.slice(4).reduce((sum, item) => sum + item.totalCost, 0)
    },
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

## 7.4 Bulkhead BOQ

```ts
function generateBulkheadBOQ(bulkhead: BulkheadCeiling): BOQSection {
  const items: BOQItem[] = [];
  
  const bulkheadPerimeter = calculatePerimeter(bulkhead.geometry.outline);
  const bulkheadArea = calculatePolygonArea(bulkhead.geometry.outline);
  
  // Vertical framing (bulkhead sides)
  const studType = DRYWALL_FRAMING_LIBRARY.find(
    s => s.id === bulkhead.structure.verticalFraming.studType
  );
  
  const verticalStudLength = bulkheadPerimeter * 
    (bulkhead.dimensions.bulkheadDrop / 1000) * 2; // Both sides
  
  items.push({
    code: 'BULK-FRM-001',
    description: `Vertical framing ${studType.studs.size} for bulkhead sides`,
    unit: 'm',
    quantity: verticalStudLength,
    wastage: 10,
    totalQuantity: verticalStudLength * 1.1,
    unitRate: studType.cost.studsPerLinearMeter,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      height: `${bulkhead.dimensions.bulkheadDrop}mm`,
      perimeter: `${bulkheadPerimeter.toFixed(2)}m`
    }
  });
  
  // Soffit battens (bottom of bulkhead)
  const battenType = CEILING_BATTEN_LIBRARY.find(
    b => b.id === bulkhead.structure.soffitBattens.battenType
  );
  
  const roomDimensions = calculateBoundingBox(bulkhead.geometry.outline);
  const battenRuns = Math.ceil(
    (bulkhead.dimensions.bulkheadWidth / bulkhead.structure.soffitBattens.spacing) || 
    (roomDimensions.width / bulkhead.structure.soffitBattens.spacing)
  );
  const battenLength = battenRuns * bulkheadPerimeter;
  
  items.push({
    code: 'BULK-BAT-001',
    description: `${battenType.name} for bulkhead soffit @ ${bulkhead.structure.soffitBattens.spacing}mm c/c`,
    unit: 'm',
    quantity: battenLength / 1000,
    wastage: 10,
    totalQuantity: (battenLength / 1000) * 1.1,
    unitRate: battenType.cost.perLinearMeter,
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Soffit board
  const soffitBoardType = CEILING_BOARD_LIBRARY.find(
    b => b.id === bulkhead.finishes.soffit.boardType
  );
  
  const soffitArea = bulkheadArea * bulkhead.finishes.soffit.layers;
  
  items.push({
    code: 'BULK-BRD-001',
    description: `${soffitBoardType.name} for bulkhead soffit`,
    unit: 'm²',
    quantity: soffitArea,
    wastage: 10,
    totalQuantity: soffitArea * 1.1,
    unitRate: soffitBoardType.cost.perM2,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      layers: bulkhead.finishes.soffit.layers,
      thickness: `${soffitBoardType.dimensions.thickness}mm`
    }
  });
  
  // Face board (vertical sides)
  const faceBoardType = CEILING_BOARD_LIBRARY.find(
    b => b.id === bulkhead.finishes.faces.boardType
  );
  
  const faceArea = bulkheadPerimeter * 
    (bulkhead.dimensions.bulkheadDrop / 1000) * 
    bulkhead.finishes.faces.layers;
  
  items.push({
    code: 'BULK-BRD-002',
    description: `${faceBoardType.name} for bulkhead faces`,
    unit: 'm²',
    quantity: faceArea,
    wastage: 10,
    totalQuantity: faceArea * 1.1,
    unitRate: faceBoardType.cost.perM2,
    totalCost: 0,
    designMode: 'standard',
    
    details: {
      height: `${bulkhead.dimensions.bulkheadDrop}mm`,
      layers: bulkhead.finishes.faces.layers
    }
  });
  
  // Transition detail (cornice or shadowline)
  if (bulkhead.finishes.transition.type === 'cornice') {
    const corniceType = CORNICE_LIBRARY.find(
      c => c.id === bulkhead.finishes.transition.corniceType
    );
    
    items.push({
      code: 'BULK-COR-001',
      description: `${corniceType.name} for bulkhead transition`,
      unit: 'm',
      quantity: bulkheadPerimeter,
      wastage: 10,
      totalQuantity: bulkheadPerimeter * 1.1,
      unitRate: corniceType.cost.perLinearMeter,
      totalCost: 0,
      designMode: 'standard'
    });
  } else if (bulkhead.finishes.transition.type === 'shadowline') {
    items.push({
      code: 'BULK-SHD-001',
      description: `Shadow line trim ${bulkhead.finishes.transition.shadowlineDepth}mm`,
      unit: 'm',
      quantity: bulkheadPerimeter,
      wastage: 10,
      totalQuantity: bulkheadPerimeter * 1.1,
      unitRate: 22,
      totalCost: 0,
      designMode: 'standard'
    });
  }
  
  // Lighting cutouts (if applicable)
  if (bulkhead.lighting && bulkhead.lighting.cutouts) {
    items.push({
      code: 'BULK-LGT-001',
      description: `Downlight cutouts ${bulkhead.lighting.cutouts.size[0]}mm`,
      unit: 'no',
      quantity: bulkhead.lighting.cutouts.quantity,
      wastage: 0,
      totalQuantity: bulkhead.lighting.cutouts.quantity,
      unitRate: 35, // Per cutout
      totalCost: 0,
      designMode: 'standard'
    });
  }
  
  // Calculate costs
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

---

# 8. SANS Compliance for Ceilings

```ts
function validateCeilingCompliance(ceiling: any): SANSComplianceCheck[] {
  const checks: SANSComplianceCheck[] = [];
  
  // Batten spacing
  if (ceiling.battens) {
    const battenType = CEILING_BATTEN_LIBRARY.find(
      b => b.id === ceiling.battens.battenType
    );
    
    checks.push({
      rule: 'Batten Spacing',
      standard: 'SANS 10082',
      requirement: `Maximum ${battenType.spacing.maximum}mm c/c`,
      actual: `${ceiling.battens.spacing}mm`,
      compliant: ceiling.battens.spacing <= battenType.spacing.maximum,
      message: `Batten spacing must not exceed ${battenType.spacing.maximum}mm for this batten size`,
      critical: true
    });
  }
  
  // Suspension drop limits
  if (ceiling.type === 'flat_suspended' || ceiling.type === 'acoustic_suspended') {
    const suspensionType = SUSPENSION_LIBRARY.find(
      s => s.id === ceiling.suspension.suspensionType
    );
    
    checks.push({
      rule: 'Suspension Drop Range',
      standard: 'SANS 10082',
      requirement: `${suspensionType.dropRange.minimum}-${suspensionType.dropRange.maximum}mm`,
      actual: `${ceiling.heights.suspensionDrop}mm`,
      compliant: ceiling.heights.suspensionDrop >= suspensionType.dropRange.minimum &&
                 ceiling.heights.suspensionDrop <= suspensionType.dropRange.maximum,
      message: 'Suspension drop must be within hanger range',
      critical: true
    });
  }
  
  // Fire rating (if required)
  if (ceiling.fireRatingRequired) {
    const boardType = CEILING_BOARD_LIBRARY.find(
      b => b.id === ceiling.board.boardType
    );
    
    checks.push({
      rule: 'Fire Rating',
      standard: 'SANS 10177',
      requirement: 'Minimum 30 minutes',
      actual: `${boardType.performance.fireRating} minutes`,
      compliant: boardType.performance.fireRating >= 30,
      message: 'Fire-rated construction requires minimum 30-minute rating',
      critical: true
    });
  }
  
  // Insulation (SANS 10400-XA)
  if (ceiling.insulation) {
    const insulationType = CEILING_INSULATION_LIBRARY.find(
      i => i.id === ceiling.insulation.insulationType
    );
    
    checks.push({
      rule: 'Thermal Insulation',
      standard: 'SANS 10400-XA',
      requirement: 'Minimum R3.3 for ceilings',
      actual: `R${insulationType.thermal.rValue}`,
      compliant: insulationType.thermal.rValue >= 3.3,
      message: 'Ceiling insulation must meet minimum R-value for climate zone',
      critical: false
    });
  }
  
  return checks;
}
```

---

# 9. Ceiling Rendering in Section Views

```ts
function renderCeilingSection(ceiling: any): SVGElement[] {
  const elements: SVGElement[] = [];
  let currentY = 0;
  
  // Render structure above (trusses/slab)
  elements.push({
    type: 'rect',
    position: { x: 0, y: currentY },
    width: 5000,
    height: 200,
    stroke: '#000000',
    strokeWidth: 2,
    fill: 'url(#structure-hatch)'
  });
  
  currentY += 200;
  
  // Suspension drop (if applicable)
  if (ceiling.type === 'flat_suspended') {
    const suspensionDrop = ceiling.heights.suspensionDrop;
    
    // Draw hangers
    const hangerSpacing = ceiling.suspension.hangerSpacing.longitudinal;
    for (let x = 0; x < 5000; x += hangerSpacing) {
      elements.push({
        type: 'line',
        start: { x, y: currentY },
        end: { x, y: currentY + suspensionDrop },
        stroke: '#666666',
        strokeWidth: 1,
        dashArray: [5, 5]
      });
    }
    
    currentY += suspensionDrop;
  }
  
  // Battens
  if (ceiling.battens) {
    const battenDepth = CEILING_BATTEN_LIBRARY.find(
      b => b.id === ceiling.battens.battenType
    ).dimensions.depth;
    
    // Draw battens at spacing
    const battenSpacing = ceiling.battens.spacing;
    for (let x = 0; x < 5000; x += battenSpacing) {
      elements.push({
        type: 'rect',
        position: { x: x - 19, y: currentY },
        width: 38,
        height: battenDepth,
        stroke: '#8B4513',
        strokeWidth: 1,
        fill: '#D2B48C'
      });
    }
    
    currentY += battenDepth;
  }
  
  // Ceiling board
  const boardType = CEILING_BOARD_LIBRARY.find(
    b => b.id === ceiling.board.boardType
  );
  
  elements.push({
    type: 'rect',
    position: { x: 0, y: currentY },
    width: 5000,
    height: boardType.dimensions.thickness,
    stroke: '#000000',
    strokeWidth: 2,
    fill: '#FFFFFF'
  });
  
  currentY += boardType.dimensions.thickness;
  
  // Cornice
  if (ceiling.cornice) {
    const corniceType = CORNICE_LIBRARY.find(
      c => c.id === ceiling.cornice.corniceType
    );
    
    elements.push({
      type: 'path',
      d: `M 0,${currentY} L ${corniceType.profile.projection},${currentY + corniceType.profile.drop} L 0,${currentY + corniceType.profile.drop} Z`,
      stroke: '#000000',
      strokeWidth: 1,
      fill: '#F5F5F5'
    });
  }
  
  // Dimensions
  elements.push(
    createDimension(
      { x: -200, y: 200 },
      { x: -200, y: currentY },
      `${currentY - 200}mm DROP`,
      { fontSize: 8 }
    )
  );
  
  // Labels
  elements.push({
    type: 'text',
    position: { x: 5200, y: currentY - 50 },
    content: 'CEILING CONSTRUCTION:',
    fontSize: 8,
    fontWeight: 'bold'
  });
  
  let labelY = currentY - 30;
  ceiling.construction.layers.forEach((layer, index) => {
    elements.push({
      type: 'text',
      position: { x: 5200, y: labelY },
      content: `${index + 1}. ${getLayerDescription(layer)}`,
      fontSize: 6
    });
    labelY += 12;
  });
  
  return elements;
}
```

---

# 10. Completion

Volume X establishes the complete **Material-Based Ceiling System** with:

- **Comprehensive material libraries** - battens, boards, tiles, grid systems, suspension components
- **Real construction specifications** - actual dimensions, spacing, fixing methods
- **Multiple ceiling types** - flat, suspended, bulkhead, stepped, coffered, tray, acoustic
- **Accurate quantity calculations** - battens, hangers, boards, tiles, cornice, finishing
- **Dual-mode system** - Standard (auto SANS-compliant) and Engineer (custom)
- **BOQ integration** - material-accurate quantities and costs for all ceiling types
- **SANS compliance** - construction standards enforcement
- **3D section rendering** - showing construction layers and depths
- **Complex geometries** - bulkheads, steps, coffers with structural details

This completes the ceiling specification for the enterprise-grade SVG-Based Parametric CAD & BOQ Platform.

---

**END OF VOLUME X**
