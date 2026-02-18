# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification
## Volume IX Part B — Modern Wall Systems: Drywall, Panels, ICF & Advanced Construction

**Version:** 9.1  
**Revision Date:** 2026-02-18  
**Document Type:** Enterprise Engineering Specification  

---

# 1. Document Control

- **Version:** 9.1
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** __________________
- **Related:** Volume IX Part A (Masonry Wall Systems)

---

# 2. Scope

Volume IX Part B extends the **Material-Based Wall System** to include all modern construction methods:

- **Drywall Systems** (timber frame, steel frame, double-stud)
- **Concrete Panel Systems** (precast, tilt-up, sandwich)
- **ICF** (Insulated Concrete Forms)
- **SIP** (Structural Insulated Panels)
- **Sandwich Panels** (metal cladding systems)
- **Curtain Wall Systems** (glass/aluminum facades)
- **Hybrid Systems** (brick veneer + drywall, etc.)

This complements Volume IX Part A which covers traditional masonry (brick/block) construction.

---

# 3. Wall System Categories

```ts
type WallSystemCategory = 
  // Part A - Masonry (covered in Volume IX Part A)
  | 'masonry_single_skin'
  | 'masonry_cavity_wall'
  | 'masonry_double_skin'
  
  // Part B - Modern Systems (this document)
  | 'drywall_timber_frame'
  | 'drywall_steel_frame'
  | 'concrete_precast'
  | 'concrete_tilt_up'
  | 'concrete_sandwich_panel'
  | 'icf_standard'
  | 'icf_high_performance'
  | 'sip_standard'
  | 'sip_structural'
  | 'sandwich_panel_insulated'
  | 'curtain_wall_unitized'
  | 'curtain_wall_stick'
  
  // Hybrid systems
  | 'brick_veneer_timber_frame'
  | 'brick_veneer_steel_frame'
  | 'cladding_on_cavity_wall';

interface WallSystemClassification {
  category: WallSystemCategory;
  structural: 'load_bearing' | 'non_load_bearing' | 'self_supporting';
  constructionMethod: 'wet' | 'dry' | 'hybrid';
  assemblyType: 'site_built' | 'prefabricated' | 'modular';
}
```

---

# 4. Material Libraries - Modern Systems

## 4.1 Drywall Framing Systems

### 4.1.1 Timber Framing

```ts
interface TimberStudType {
  id: string;
  name: string;
  
  dimensions: {
    width: number;          // mm (38, 44mm)
    depth: number;          // mm (64, 89, 114, 140mm)
  };
  
  grade: 'SA_Pine_Grade_5' | 'SA_Pine_Grade_7' | 'Saligna';
  treatment: 'untreated' | 'H2' | 'H3' | 'CCA';
  
  spacing: {
    standard: number;       // mm (400, 600mm c/c)
    maximum: number;        // mm (for non-load bearing)
  };
  
  loadCapacity: {
    axial: number;          // kN
    lateral: number;        // kN/m
  };
  
  cost: {
    perLinearMeter: number; // ZAR
  };
}

const TIMBER_STUD_LIBRARY: TimberStudType[] = [
  {
    id: 'stud_38x89',
    name: 'Timber Stud 38×89mm',
    dimensions: { width: 38, depth: 89 },
    grade: 'SA_Pine_Grade_5',
    treatment: 'H3',
    spacing: {
      standard: 400,
      maximum: 600
    },
    loadCapacity: {
      axial: 12,
      lateral: 3.5
    },
    cost: {
      perLinearMeter: 22
    }
  },
  
  {
    id: 'stud_38x114',
    name: 'Timber Stud 38×114mm',
    dimensions: { width: 38, depth: 114 },
    grade: 'SA_Pine_Grade_5',
    treatment: 'H3',
    spacing: {
      standard: 400,
      maximum: 600
    },
    loadCapacity: {
      axial: 18,
      lateral: 4.8
    },
    cost: {
      perLinearMeter: 28
    }
  },
  
  {
    id: 'stud_38x140',
    name: 'Timber Stud 38×140mm (Load Bearing)',
    dimensions: { width: 38, depth: 140 },
    grade: 'SA_Pine_Grade_7',
    treatment: 'H3',
    spacing: {
      standard: 400,
      maximum: 600
    },
    loadCapacity: {
      axial: 24,
      lateral: 6.2
    },
    cost: {
      perLinearMeter: 35
    }
  }
];
```

### 4.1.2 Light Steel Framing

```ts
interface SteelStudType {
  id: string;
  name: string;
  
  dimensions: {
    width: number;          // mm (35, 50mm)
    depth: number;          // mm (64, 70, 92, 150mm)
    thickness: number;      // mm (0.55, 0.75, 1.0mm BMT)
  };
  
  profile: 'C_section' | 'U_track' | 'top_hat';
  
  material: {
    type: 'galvanised_steel';
    coating: 'Z275' | 'Z350';
    yieldStrength: number;  // MPa
  };
  
  spacing: {
    standard: number;       // mm (600mm c/c typical)
    maximum: number;        // mm
  };
  
  loadCapacity: {
    axial: number;          // kN
    lateral: number;        // kN/m
  };
  
  cost: {
    perLinearMeter: number; // ZAR
  };
}

const STEEL_STUD_LIBRARY: SteelStudType[] = [
  {
    id: 'steel_c_70x35x0.55',
    name: 'Steel C-Stud 70×35×0.55mm',
    dimensions: { width: 35, depth: 70, thickness: 0.55 },
    profile: 'C_section',
    material: {
      type: 'galvanised_steel',
      coating: 'Z275',
      yieldStrength: 450
    },
    spacing: {
      standard: 600,
      maximum: 600
    },
    loadCapacity: {
      axial: 15,
      lateral: 2.8
    },
    cost: {
      perLinearMeter: 28
    }
  },
  
  {
    id: 'steel_c_92x35x0.75',
    name: 'Steel C-Stud 92×35×0.75mm',
    dimensions: { width: 35, depth: 92, thickness: 0.75 },
    profile: 'C_section',
    material: {
      type: 'galvanised_steel',
      coating: 'Z275',
      yieldStrength: 450
    },
    spacing: {
      standard: 600,
      maximum: 600
    },
    loadCapacity: {
      axial: 22,
      lateral: 4.2
    },
    cost: {
      perLinearMeter: 35
    }
  },
  
  {
    id: 'steel_c_150x50x1.0',
    name: 'Steel C-Stud 150×50×1.0mm (Structural)',
    dimensions: { width: 50, depth: 150, thickness: 1.0 },
    profile: 'C_section',
    material: {
      type: 'galvanised_steel',
      coating: 'Z350',
      yieldStrength: 550
    },
    spacing: {
      standard: 600,
      maximum: 600
    },
    loadCapacity: {
      axial: 45,
      lateral: 8.5
    },
    cost: {
      perLinearMeter: 58
    }
  }
];
```

## 4.2 Gypsum Board Systems

```ts
interface GypsumBoardType {
  id: string;
  name: string;
  type: 'standard' | 'moisture_resistant' | 'fire_rated' | 'impact_resistant' | 'sound_dampening';
  
  dimensions: {
    thickness: number;      // mm (9.5, 12.5, 15mm)
    width: number;          // mm (standard 1200mm)
    length: number;         // mm (2400, 2700, 3000mm)
  };
  
  edgeType: 'tapered' | 'square' | 'beveled';
  
  performance: {
    fireRating: number;     // minutes (per layer)
    soundReduction: number; // dB (per layer)
    moistureResistant: boolean;
    impactResistant: boolean;
    density: number;        // kg/m³
  };
  
  weight: number;           // kg per sheet
  
  application: ('walls' | 'ceilings' | 'both')[];
  
  finishing: {
    jointCompound: 'standard' | 'lightweight' | 'setting_type';
    tapingCoats: number;    // number of coats
    primerRequired: boolean;
  };
  
  cost: {
    perSheet: number;       // ZAR
    perM2: number;          // ZAR
  };
}

const GYPSUM_BOARD_LIBRARY: GypsumBoardType[] = [
  {
    id: 'gyp_standard_12.5',
    name: 'Standard Gypsum Board 12.5mm',
    type: 'standard',
    dimensions: {
      thickness: 12.5,
      width: 1200,
      length: 2400
    },
    edgeType: 'tapered',
    performance: {
      fireRating: 30,
      soundReduction: 28,
      moistureResistant: false,
      impactResistant: false,
      density: 700
    },
    weight: 27.6,
    application: ['walls', 'ceilings'],
    finishing: {
      jointCompound: 'standard',
      tapingCoats: 3,
      primerRequired: true
    },
    cost: {
      perSheet: 145,
      perM2: 50
    }
  },
  
  {
    id: 'gyp_moisture_12.5',
    name: 'Moisture Resistant Gypsum 12.5mm (Green Board)',
    type: 'moisture_resistant',
    dimensions: {
      thickness: 12.5,
      width: 1200,
      length: 2400
    },
    edgeType: 'tapered',
    performance: {
      fireRating: 30,
      soundReduction: 28,
      moistureResistant: true,
      impactResistant: false,
      density: 750
    },
    weight: 29.2,
    application: ['walls'],
    finishing: {
      jointCompound: 'standard',
      tapingCoats: 3,
      primerRequired: true
    },
    cost: {
      perSheet: 185,
      perM2: 64
    }
  },
  
  {
    id: 'gyp_fire_15',
    name: 'Type X Fire-Rated Gypsum 15mm',
    type: 'fire_rated',
    dimensions: {
      thickness: 15,
      width: 1200,
      length: 2400
    },
    edgeType: 'tapered',
    performance: {
      fireRating: 60,
      soundReduction: 32,
      moistureResistant: false,
      impactResistant: false,
      density: 850
    },
    weight: 38.4,
    application: ['walls', 'ceilings'],
    finishing: {
      jointCompound: 'lightweight',
      tapingCoats: 3,
      primerRequired: true
    },
    cost: {
      perSheet: 220,
      perM2: 76
    }
  },
  
  {
    id: 'gyp_impact_12.5',
    name: 'Impact Resistant Gypsum 12.5mm',
    type: 'impact_resistant',
    dimensions: {
      thickness: 12.5,
      width: 1200,
      length: 2400
    },
    edgeType: 'tapered',
    performance: {
      fireRating: 30,
      soundReduction: 28,
      moistureResistant: false,
      impactResistant: true,
      density: 800
    },
    weight: 32.0,
    application: ['walls'],
    finishing: {
      jointCompound: 'standard',
      tapingCoats: 3,
      primerRequired: true
    },
    cost: {
      perSheet: 195,
      perM2: 68
    }
  },
  
  {
    id: 'gyp_sound_15',
    name: 'Sound Dampening Gypsum 15mm',
    type: 'sound_dampening',
    dimensions: {
      thickness: 15,
      width: 1200,
      length: 2400
    },
    edgeType: 'tapered',
    performance: {
      fireRating: 45,
      soundReduction: 45,
      moistureResistant: false,
      impactResistant: false,
      density: 950
    },
    weight: 42.0,
    application: ['walls'],
    finishing: {
      jointCompound: 'setting_type',
      tapingCoats: 3,
      primerRequired: true
    },
    cost: {
      perSheet: 280,
      perM2: 97
    }
  }
];
```

### 4.2.1 Gypsum Joint Treatment Materials

```ts
interface JointCompoundType {
  id: string;
  name: string;
  type: 'taping' | 'topping' | 'all_purpose' | 'setting_type' | 'lightweight';
  
  settingTime?: number;   // minutes (for setting type)
  
  coverage: {
    perKg: number;          // m² per kg (for coats)
    coatThickness: number;  // mm
  };
  
  sandable: boolean;
  shrinkage: 'low' | 'medium' | 'high';
  
  cost: {
    per20LBucket: number;   // ZAR
    perKg: number;          // ZAR
  };
}

const JOINT_COMPOUND_LIBRARY: JointCompoundType[] = [
  {
    id: 'compound_taping',
    name: 'Taping Compound',
    type: 'taping',
    coverage: {
      perKg: 7,
      coatThickness: 1
    },
    sandable: true,
    shrinkage: 'low',
    cost: {
      per20LBucket: 180,
      perKg: 18
    }
  },
  
  {
    id: 'compound_all_purpose',
    name: 'All-Purpose Joint Compound',
    type: 'all_purpose',
    coverage: {
      perKg: 8,
      coatThickness: 1
    },
    sandable: true,
    shrinkage: 'medium',
    cost: {
      per20LBucket: 165,
      perKg: 16.50
    }
  },
  
  {
    id: 'compound_setting_20',
    name: '20-Minute Setting Compound',
    type: 'setting_type',
    settingTime: 20,
    coverage: {
      perKg: 6,
      coatThickness: 1
    },
    sandable: true,
    shrinkage: 'low',
    cost: {
      per20LBucket: 220,
      perKg: 22
    }
  }
];
```

## 4.3 Insulation for Frame Walls

```ts
interface FrameInsulationType {
  id: string;
  name: string;
  material: 'glasswool' | 'polyester' | 'mineral_wool' | 'cellulose' | 'spray_foam';
  
  // For batts/blankets
  dimensions?: {
    thickness: number;      // mm (to fit stud depth)
    width: number;          // mm (to fit stud spacing)
    length: number;         // mm
  };
  
  // For loose fill
  application?: 'blown' | 'sprayed' | 'batt';
  
  thermal: {
    rValue: number;         // per thickness
    conductivity: number;   // W/mK
  };
  
  acoustic: {
    nrc: number;            // Noise Reduction Coefficient
  };
  
  fireRating: string;       // e.g., 'A1' (non-combustible)
  
  density: number;          // kg/m³
  
  coverage: {
    perPack: number;        // m² (for batts)
    perBag?: number;        // m³ (for loose fill)
  };
  
  cost: {
    perM2: number;          // ZAR (installed)
  };
}

const FRAME_INSULATION_LIBRARY: FrameInsulationType[] = [
  {
    id: 'glasswool_75',
    name: 'Glasswool Batt 75mm (R1.9)',
    material: 'glasswool',
    dimensions: {
      thickness: 75,
      width: 430,           // Fits 400mm stud spacing
      length: 1160
    },
    application: 'batt',
    thermal: {
      rValue: 1.9,
      conductivity: 0.040
    },
    acoustic: {
      nrc: 0.85
    },
    fireRating: 'A1',
    density: 11,
    coverage: {
      perPack: 20.88        // 18 batts per pack
    },
    cost: {
      perM2: 45
    }
  },
  
  {
    id: 'glasswool_100',
    name: 'Glasswool Batt 100mm (R2.5)',
    material: 'glasswool',
    dimensions: {
      thickness: 100,
      width: 430,
      length: 1160
    },
    application: 'batt',
    thermal: {
      rValue: 2.5,
      conductivity: 0.040
    },
    acoustic: {
      nrc: 0.90
    },
    fireRating: 'A1',
    density: 14,
    coverage: {
      perPack: 15.48        // 13 batts per pack
    },
    cost: {
      perM2: 58
    }
  },
  
  {
    id: 'polyester_90',
    name: 'Polyester Batt 90mm (R2.0)',
    material: 'polyester',
    dimensions: {
      thickness: 90,
      width: 580,           // Fits 600mm steel stud spacing
      length: 1160
    },
    application: 'batt',
    thermal: {
      rValue: 2.0,
      conductivity: 0.045
    },
    acoustic: {
      nrc: 0.80
    },
    fireRating: 'A2',
    density: 10,
    coverage: {
      perPack: 18.68
    },
    cost: {
      perM2: 52
    }
  },
  
  {
    id: 'cellulose_blown',
    name: 'Cellulose Loose-Fill Insulation',
    material: 'cellulose',
    application: 'blown',
    thermal: {
      rValue: 3.5,          // Per 100mm
      conductivity: 0.039
    },
    acoustic: {
      nrc: 0.75
    },
    fireRating: 'B',
    density: 55,            // kg/m³ (settled)
    coverage: {
      perBag: 0.85          // m³ per 13kg bag
    },
    cost: {
      perM2: 68             // At 100mm thickness
    }
  }
];
```

## 4.4 Concrete Panel Systems

```ts
interface ConcretePanelType {
  id: string;
  name: string;
  system: 'precast_solid' | 'precast_sandwich' | 'tilt_up' | 'cladding_panel';
  
  dimensions: {
    thickness: number;      // mm
    typicalWidth: number;   // mm
    typicalHeight: number;  // mm
    maxLength: number;      // mm
  };
  
  // Panel composition layers
  construction: {
    exterior?: {
      material: 'concrete';
      thickness: number;    // mm
      finish: 'smooth' | 'exposed_aggregate' | 'textured' | 'painted';
      grade: string;        // e.g., '30MPa'
    };
    insulation?: {
      material: 'EPS' | 'XPS' | 'mineral_wool';
      thickness: number;    // mm
      density: number;      // kg/m³
    };
    interior?: {
      material: 'concrete';
      thickness: number;    // mm
      finish: string;
      grade: string;
    };
  };
  
  reinforcement: {
    mesh?: string;          // e.g., 'Ref 283'
    bars?: string[];        // e.g., ['Y12 @ 200mm c/c', 'Y16 @ 300mm c/c']
    shearConnectors?: {
      type: string;
      spacing: number;      // mm
      diameter: number;     // mm
    };
  };
  
  connections: {
    type: 'welded_plates' | 'bolted' | 'grouted_pocket' | 'corbel';
    spacing: number;        // mm
    capacity: number;       // kN per connection
  };
  
  performance: {
    rValue: number;
    uValue: number;
    fireRating: number;     // minutes
    soundReduction: number; // dB
    loadCapacity: number;   // kN/m (axial)
  };
  
  weight: number;           // kg per m²
  
  installation: {
    cranage: 'mobile_crane' | 'tower_crane' | 'self_erecting';
    typicalCycleTime: number; // minutes per panel
    supportsDuringErection: boolean;
  };
  
  cost: {
    fabrication: number;    // ZAR per m²
    installation: number;   // ZAR per m²
    cranage: number;        // ZAR per panel
    totalPerM2: number;     // ZAR
  };
}

const CONCRETE_PANEL_LIBRARY: ConcretePanelType[] = [
  {
    id: 'precast_solid_150',
    name: 'Precast Solid Panel 150mm',
    system: 'precast_solid',
    dimensions: {
      thickness: 150,
      typicalWidth: 3000,
      typicalHeight: 6000,
      maxLength: 9000
    },
    construction: {
      exterior: {
        material: 'concrete',
        thickness: 150,
        finish: 'smooth',
        grade: '30MPa'
      }
    },
    reinforcement: {
      mesh: 'Ref 283',
      bars: ['Y12 @ 200mm c/c both faces']
    },
    connections: {
      type: 'welded_plates',
      spacing: 1200,
      capacity: 45
    },
    performance: {
      rValue: 0.18,
      uValue: 5.56,
      fireRating: 240,
      soundReduction: 52,
      loadCapacity: 350
    },
    weight: 360,
    installation: {
      cranage: 'mobile_crane',
      typicalCycleTime: 25,
      supportsDuringErection: true
    },
    cost: {
      fabrication: 550,
      installation: 180,
      cranage: 85,
      totalPerM2: 815
    }
  },
  
  {
    id: 'precast_sandwich_200',
    name: 'Precast Insulated Sandwich Panel 200mm',
    system: 'precast_sandwich',
    dimensions: {
      thickness: 200,
      typicalWidth: 3000,
      typicalHeight: 6000,
      maxLength: 9000
    },
    construction: {
      exterior: {
        material: 'concrete',
        thickness: 60,
        finish: 'exposed_aggregate',
        grade: '40MPa'
      },
      insulation: {
        material: 'XPS',
        thickness: 80,
        density: 35
      },
      interior: {
        material: 'concrete',
        thickness: 60,
        finish: 'smooth',
        grade: '30MPa'
      }
    },
    reinforcement: {
      mesh: 'Ref 193',
      bars: ['Y10 @ 300mm c/c each wythe'],
      shearConnectors: {
        type: 'GFRP_truss',
        spacing: 600,
        diameter: 8
      }
    },
    connections: {
      type: 'welded_plates',
      spacing: 1200,
      capacity: 40
    },
    performance: {
      rValue: 2.8,
      uValue: 0.36,
      fireRating: 180,
      soundReduction: 48,
      loadCapacity: 280
    },
    weight: 320,
    installation: {
      cranage: 'mobile_crane',
      typicalCycleTime: 30,
      supportsDuringErection: true
    },
    cost: {
      fabrication: 980,
      installation: 220,
      cranage: 95,
      totalPerM2: 1295
    }
  },
  
  {
    id: 'tilt_up_200',
    name: 'Tilt-Up Panel 200mm',
    system: 'tilt_up',
    dimensions: {
      thickness: 200,
      typicalWidth: 6000,
      typicalHeight: 9000,
      maxLength: 12000
    },
    construction: {
      exterior: {
        material: 'concrete',
        thickness: 200,
        finish: 'textured',
        grade: '25MPa'
      }
    },
    reinforcement: {
      mesh: 'Ref 283',
      bars: ['Y16 @ 200mm c/c vertical', 'Y12 @ 300mm c/c horizontal']
    },
    connections: {
      type: 'bolted',
      spacing: 2400,
      capacity: 60
    },
    performance: {
      rValue: 0.24,
      uValue: 4.17,
      fireRating: 240,
      soundReduction: 54,
      loadCapacity: 400
    },
    weight: 480,
    installation: {
      cranage: 'mobile_crane',
      typicalCycleTime: 45,
      supportsDuringErection: true
    },
    cost: {
      fabrication: 420,
      installation: 150,
      cranage: 180,
      totalPerM2: 750
    }
  }
];
```

## 4.5 ICF (Insulated Concrete Form) Systems

```ts
interface ICFBlockType {
  id: string;
  name: string;
  manufacturer: string;
  
  blockDimensions: {
    length: number;         // mm
    height: number;         // mm
    totalThickness: number; // mm
  };
  
  wallComposition: {
    exteriorFoam: {
      material: 'EPS' | 'XPS';
      thickness: number;    // mm
      density: number;      // kg/m³
    };
    concreteCore: {
      thickness: number;    // mm
      grade: string;        // e.g., '25MPa'
      slumpRequired: number; // mm
      aggregateMaxSize: number; // mm
    };
    interiorFoam: {
      material: 'EPS' | 'XPS';
      thickness: number;    // mm
      density: number;      // kg/m³
    };
  };
  
  webType: 'plastic' | 'steel' | 'foam';
  
  reinforcement: {
    vertical: {
      size: string;         // e.g., 'Y12'
      spacing: number;      // mm c/c
    };
    horizontal: {
      size: string;         // e.g., 'Y10'
      spacing: number;      // mm (course height)
    };
  };
  
  performance: {
    rValue: number;
    uValue: number;
    fireRating: number;
    soundReduction: number;
    airTightness: number;   // Air changes per hour @ 50Pa
    thermalMass: 'high' | 'medium' | 'low';
  };
  
  installation: {
    blocksPerM2: number;
    concreteM3PerM2: number;
    labourHoursPerM2: number;
  };
  
  cost: {
    blocksPerM2: number;    // ZAR
    concretePerM2: number;  // ZAR
    reinforcementPerM2: number; // ZAR
    labourPerM2: number;    // ZAR
    totalPerM2: number;     // ZAR
  };
}

const ICF_LIBRARY: ICFBlockType[] = [
  {
    id: 'icf_standard_250',
    name: 'Standard ICF Block 250mm',
    manufacturer: 'BuildBlock SA',
    blockDimensions: {
      length: 1200,
      height: 300,
      totalThickness: 250
    },
    wallComposition: {
      exteriorFoam: {
        material: 'EPS',
        thickness: 75,
        density: 20
      },
      concreteCore: {
        thickness: 100,
        grade: '25MPa',
        slumpRequired: 180,
        aggregateMaxSize: 13
      },
      interiorFoam: {
        material: 'EPS',
        thickness: 75,
        density: 20
      }
    },
    webType: 'plastic',
    reinforcement: {
      vertical: {
        size: 'Y12',
        spacing: 400
      },
      horizontal: {
        size: 'Y10',
        spacing: 600
      }
    },
    performance: {
      rValue: 3.5,
      uValue: 0.29,
      fireRating: 240,
      soundReduction: 52,
      airTightness: 0.5,
      thermalMass: 'high'
    },
    installation: {
      blocksPerM2: 2.78,
      concreteM3PerM2: 0.10,
      labourHoursPerM2: 1.2
    },
    cost: {
      blocksPerM2: 420,
      concretePerM2: 180,
      reinforcementPerM2: 95,
      labourPerM2: 145,
      totalPerM2: 840
    }
  },
  
  {
    id: 'icf_high_performance_300',
    name: 'High Performance ICF 300mm',
    manufacturer: 'BuildBlock SA',
    blockDimensions: {
      length: 1200,
      height: 300,
      totalThickness: 300
    },
    wallComposition: {
      exteriorFoam: {
        material: 'XPS',
        thickness: 100,
        density: 35
      },
      concreteCore: {
        thickness: 100,
        grade: '30MPa',
        slumpRequired: 180,
        aggregateMaxSize: 13
      },
      interiorFoam: {
        material: 'XPS',
        thickness: 100,
        density: 35
      }
    },
    webType: 'steel',
    reinforcement: {
      vertical: {
        size: 'Y16',
        spacing: 400
      },
      horizontal: {
        size: 'Y12',
        spacing: 600
      }
    },
    performance: {
      rValue: 4.8,
      uValue: 0.21,
      fireRating: 240,
      soundReduction: 55,
      airTightness: 0.3,
      thermalMass: 'high'
    },
    installation: {
      blocksPerM2: 2.78,
      concreteM3PerM2: 0.10,
      labourHoursPerM2: 1.4
    },
    cost: {
      blocksPerM2: 580,
      concretePerM2: 200,
      reinforcementPerM2: 125,
      labourPerM2: 165,
      totalPerM2: 1070
    }
  }
];
```

## 4.6 SIP (Structural Insulated Panels)

```ts
interface SIPPanelType {
  id: string;
  name: string;
  manufacturer: string;
  
  panelDimensions: {
    thickness: number;      // mm (total)
    widthStandard: number;  // mm
    lengthOptions: number[]; // mm
  };
  
  construction: {
    exteriorSkin: {
      material: 'OSB' | 'plywood' | 'cement_board' | 'magnesium_oxide';
      thickness: number;    // mm
      grade?: string;
    };
    core: {
      material: 'EPS' | 'XPS' | 'polyurethane' | 'mineral_wool';
      thickness: number;    // mm
      density: number;      // kg/m³
    };
    interiorSkin: {
      material: 'OSB' | 'plywood' | 'gypsum';
      thickness: number;    // mm
      grade?: string;
    };
  };
  
  splineConnection: {
    type: 'timber' | 'steel' | 'foam_spline';
    dimensions: string;     // e.g., '38x140mm'
  };
  
  performance: {
    rValue: number;
    uValue: number;
    fireRating: number;
    soundReduction: number;
    structuralCapacity: {
      axialLoad: number;    // kN/m
      momentCapacity: number; // kNm/m
      shearCapacity: number;  // kN/m
    };
  };
  
  weight: number;           // kg per m²
  
  installation: {
    craneLift: boolean;
    labourHoursPerPanel: number;
    sealantRequired: boolean;
  };
  
  cost: {
    panelPerM2: number;     // ZAR
    splinePerM: number;     // ZAR per linear meter
    sealantPerM: number;    // ZAR
    installationPerM2: number; // ZAR
    totalPerM2: number;     // ZAR
  };
}

const SIP_LIBRARY: SIPPanelType[] = [
  {
    id: 'sip_standard_162',
    name: 'Standard SIP Panel 162mm',
    manufacturer: 'EcoPanel SA',
    panelDimensions: {
      thickness: 162,
      widthStandard: 1200,
      lengthOptions: [2400, 2700, 3000, 3600]
    },
    construction: {
      exteriorSkin: {
        material: 'OSB',
        thickness: 11,
        grade: 'OSB/3'
      },
      core: {
        material: 'EPS',
        thickness: 140,
        density: 20
      },
      interiorSkin: {
        material: 'OSB',
        thickness: 11,
        grade: 'OSB/3'
      }
    },
    splineConnection: {
      type: 'timber',
      dimensions: '38x140mm'
    },
    performance: {
      rValue: 4.2,
      uValue: 0.24,
      fireRating: 60,
      soundReduction: 38,
      structuralCapacity: {
        axialLoad: 45,
        momentCapacity: 12,
        shearCapacity: 18
      }
    },
    weight: 28,
    installation: {
      craneLift: false,
      labourHoursPerPanel: 0.8,
      sealantRequired: true
    },
    cost: {
      panelPerM2: 520,
      splinePerM: 28,
      sealantPerM: 12,
      installationPerM2: 85,
      totalPerM2: 645
    }
  },
  
  {
    id: 'sip_structural_216',
    name: 'Structural SIP Panel 216mm',
    manufacturer: 'EcoPanel SA',
    panelDimensions: {
      thickness: 216,
      widthStandard: 1200,
      lengthOptions: [2400, 2700, 3000, 3600, 4200]
    },
    construction: {
      exteriorSkin: {
        material: 'OSB',
        thickness: 13,
        grade: 'OSB/4'
      },
      core: {
        material: 'polyurethane',
        thickness: 190,
        density: 40
      },
      interiorSkin: {
        material: 'OSB',
        thickness: 13,
        grade: 'OSB/4'
      }
    },
    splineConnection: {
      type: 'timber',
      dimensions: '38x190mm'
    },
    performance: {
      rValue: 6.5,
      uValue: 0.15,
      fireRating: 90,
      soundReduction: 42,
      structuralCapacity: {
        axialLoad: 65,
        momentCapacity: 18,
        shearCapacity: 28
      }
    },
    weight: 35,
    installation: {
      craneLift: true,
      labourHoursPerPanel: 1.0,
      sealantRequired: true
    },
    cost: {
      panelPerM2: 750,
      splinePerM: 35,
      sealantPerM: 12,
      installationPerM2: 110,
      totalPerM2: 907
    }
  }
];
```

## 4.7 Sandwich Panels (Insulated Metal Panels)

```ts
interface SandwichPanelType {
  id: string;
  name: string;
  application: 'wall' | 'roof' | 'both';
  
  panelDimensions: {
    thickness: number;      // mm
    coverWidth: number;     // mm
    maxLength: number;      // mm
  };
  
  construction: {
    exteriorSkin: {
      material: 'steel' | 'aluminium';
      thickness: number;    // mm (gauge)
      coating: 'galvanised' | 'colorbon' | 'PVDF' | 'powder_coated';
      profile: 'flat' | 'micro_ribbed' | 'deep_ribbed';
      colorOptions: string[];
    };
    core: {
      material: 'polyurethane' | 'mineral_wool' | 'EPS' | 'PIR';
      thickness: number;    // mm
      density: number;      // kg/m³
      fireRating: string;   // e.g., 'B-s1,d0'
    };
    interiorSkin: {
      material: 'steel' | 'aluminium';
      thickness: number;    // mm
      coating: string;
      profile: string;
    };
  };
  
  fastening: {
    type: 'concealed' | 'exposed_fasteners';
    fasteningMethod: 'self_drilling_screws' | 'hidden_clips';
    spacing: number;        // mm
  };
  
  performance: {
    rValue: number;
    uValue: number;
    fireRating: number;
    soundReduction: number;
    windLoadResistance: number; // kPa
  };
  
  weight: number;           // kg per m²
  
  cost: {
    perM2: number;          // ZAR (installed)
  };
}

const SANDWICH_PANEL_LIBRARY: SandwichPanelType[] = [
  {
    id: 'panel_pu_50',
    name: 'Polyurethane Sandwich Panel 50mm',
    application: 'wall',
    panelDimensions: {
      thickness: 50,
      coverWidth: 1000,
      maxLength: 12000
    },
    construction: {
      exteriorSkin: {
        material: 'steel',
        thickness: 0.5,
        coating: 'colorbon',
        profile: 'micro_ribbed',
        colorOptions: ['White', 'Cream', 'Grey', 'Terracotta', 'Green']
      },
      core: {
        material: 'polyurethane',
        thickness: 49,
        density: 40,
        fireRating: 'B-s2,d0'
      },
      interiorSkin: {
        material: 'steel',
        thickness: 0.4,
        coating: 'galvanised',
        profile: 'flat'
      }
    },
    fastening: {
      type: 'concealed',
      fasteningMethod: 'hidden_clips',
      spacing: 600
    },
    performance: {
      rValue: 1.8,
      uValue: 0.56,
      fireRating: 30,
      soundReduction: 28,
      windLoadResistance: 2.5
    },
    weight: 11.5,
    cost: {
      perM2: 320
    }
  },
  
  {
    id: 'panel_mw_100',
    name: 'Mineral Wool Panel 100mm (Fire Rated)',
    application: 'wall',
    panelDimensions: {
      thickness: 100,
      coverWidth: 1000,
      maxLength: 12000
    },
    construction: {
      exteriorSkin: {
        material: 'steel',
        thickness: 0.6,
        coating: 'colorbon',
        profile: 'deep_ribbed',
        colorOptions: ['White', 'Cream', 'Grey', 'Charcoal']
      },
      core: {
        material: 'mineral_wool',
        thickness: 99,
        density: 100,
        fireRating: 'A2-s1,d0'
      },
      interiorSkin: {
        material: 'steel',
        thickness: 0.5,
        coating: 'galvanised',
        profile: 'flat'
      }
    },
    fastening: {
      type: 'concealed',
      fasteningMethod: 'hidden_clips',
      spacing: 600
    },
    performance: {
      rValue: 2.5,
      uValue: 0.40,
      fireRating: 120,
      soundReduction: 38,
      windLoadResistance: 3.0
    },
    weight: 18.5,
    cost: {
      perM2: 420
    }
  }
];
```

---

# 5. Standard Wall Constructions - Modern Systems

## 5.1 Standard Drywall Partition (Timber Frame)

```ts
const STANDARD_DRYWALL_TIMBER_PARTITION: WallConstruction = {
  id: 'std_drywall_timber_89',
  name: 'Standard Drywall - Timber Frame 89mm',
  systemCategory: 'drywall_timber_frame',
  
  layers: [
    // Layer 1: Gypsum board (side A)
    {
      id: 'layer_1',
      sequence: 1,
      type: 'gypsum_board',
      gypsumBoard: {
        boardType: 'gyp_standard_12.5',
        layers: 1,
        orientation: 'vertical',
        staggeredJoints: false
      }
    },
    
    // Layer 2: Timber frame
    {
      id: 'layer_2',
      sequence: 2,
      type: 'drywall_frame',
      drywallFrame: {
        framingType: 'stud_38x89',
        studSpacing: 400,
        noggings: {
          required: true,
          spacing: 1200
        },
        insulation: {
          type: 'glasswool',
          thickness: 75,
          rValue: 1.9
        }
      }
    },
    
    // Layer 3: Gypsum board (side B)
    {
      id: 'layer_3',
      sequence: 3,
      type: 'gypsum_board',
      gypsumBoard: {
        boardType: 'gyp_standard_12.5',
        layers: 1,
        orientation: 'vertical',
        staggeredJoints: false
      }
    }
  ],
  
  // Auto-calculated: 12.5 + 89 + 12.5 = 114mm
  totalThickness: 114,
  
  classification: {
    structural: 'non_load_bearing',
    thermal: 'insulated',
    acoustic: 'standard',
    fire: 'standard',
    moisture: 'standard'
  },
  
  performance: {
    rValue: 2.1,
    uValue: 0.48,
    soundReduction: 42,
    fireRating: 60,
    loadCapacity: 0
  }
};
```

## 5.2 Steel Frame Drywall with Double Gypsum

```ts
const FIRE_RATED_DRYWALL_STEEL: WallConstruction = {
  id: 'fire_drywall_steel_92',
  name: 'Fire-Rated Drywall - Steel Frame 92mm (Double Layer)',
  systemCategory: 'drywall_steel_frame',
  
  layers: [
    // Layer 1: First gypsum layer (side A)
    {
      id: 'layer_1',
      sequence: 1,
      type: 'gypsum_board',
      gypsumBoard: {
        boardType: 'gyp_fire_15',
        layers: 1,
        orientation: 'vertical',
        staggeredJoints: false
      }
    },
    
    // Layer 2: Second gypsum layer (side A)
    {
      id: 'layer_2',
      sequence: 2,
      type: 'gypsum_board',
      gypsumBoard: {
        boardType: 'gyp_fire_15',
        layers: 1,
        orientation: 'horizontal',  // Cross-layer for better fire rating
        staggeredJoints: true
      }
    },
    
    // Layer 3: Steel frame
    {
      id: 'layer_3',
      sequence: 3,
      type: 'drywall_frame',
      drywallFrame: {
        framingType: 'steel_c_92x35x0.75',
        studSpacing: 600,
        noggings: {
          required: false,
          spacing: 0
        },
        insulation: {
          type: 'mineral_wool',
          thickness: 90,
          rValue: 2.2
        }
      }
    },
    
    // Layer 4: First gypsum layer (side B)
    {
      id: 'layer_4',
      sequence: 4,
      type: 'gypsum_board',
      gypsumBoard: {
        boardType: 'gyp_fire_15',
        layers: 1,
        orientation: 'vertical',
        staggeredJoints: false
      }
    },
    
    // Layer 5: Second gypsum layer (side B)
    {
      id: 'layer_5',
      sequence: 5,
      type: 'gypsum_board',
      gypsumBoard: {
        boardType: 'gyp_fire_15',
        layers: 1,
        orientation: 'horizontal',
        staggeredJoints: true
      }
    }
  ],
  
  // Auto-calculated: 15 + 15 + 92 + 15 + 15 = 152mm
  totalThickness: 152,
  
  classification: {
    structural: 'non_load_bearing',
    thermal: 'insulated',
    acoustic: 'enhanced',
    fire: 'fire_rated',
    moisture: 'standard'
  },
  
  performance: {
    rValue: 2.4,
    uValue: 0.42,
    soundReduction: 58,
    fireRating: 120,
    loadCapacity: 0
  }
};
```

## 5.3 ICF Wall Construction

```ts
const STANDARD_ICF_WALL: WallConstruction = {
  id: 'std_icf_250',
  name: 'Standard ICF Wall 250mm',
  systemCategory: 'icf_standard',
  
  layers: [
    // Single ICF layer (contains all components)
    {
      id: 'layer_1',
      sequence: 1,
      type: 'icf',
      icf: {
        icfType: 'icf_standard_250',
        concreteGrade: '25MPa',
        reinforcement: {
          vertical: 'Y12 @ 400mm c/c',
          horizontal: 'Y10 @ 600mm c/c'
        }
      }
    }
  ],
  
  totalThickness: 250,
  
  classification: {
    structural: 'load_bearing',
    thermal: 'high_performance',
    acoustic: 'enhanced',
    fire: 'fire_rated',
    moisture: 'excellent'
  },
  
  performance: {
    rValue: 3.5,
    uValue: 0.29,
    soundReduction: 52,
    fireRating: 240,
    loadCapacity: 280
  }
};
```

## 5.4 SIP Wall Construction

```ts
const STANDARD_SIP_WALL: WallConstruction = {
  id: 'std_sip_162',
  name: 'Standard SIP Wall 162mm',
  systemCategory: 'sip_standard',
  
  layers: [
    // Single SIP layer
    {
      id: 'layer_1',
      sequence: 1,
      type: 'sip',
      sip: {
        sipType: 'sip_standard_162',
        splineConnection: {
          type: 'timber',
          size: '38x140mm'
        }
      }
    }
  ],
  
  totalThickness: 162,
  
  classification: {
    structural: 'load_bearing',
    thermal: 'high_performance',
    acoustic: 'standard',
    fire: 'standard',
    moisture: 'good'
  },
  
  performance: {
    rValue: 4.2,
    uValue: 0.24,
    soundReduction: 38,
    fireRating: 60,
    loadCapacity: 45
  }
};
```

---

# 6. BOQ Generation for Modern Wall Systems

## 6.1 Drywall BOQ Generation

```ts
function generateDrywallBOQ(wall: Wall): WallBOQ {
  const frameLayer = wall.construction.layers.find(l => l.type === 'drywall_frame');
  const gypsumLayers = wall.construction.layers.filter(l => l.type === 'gypsum_board');
  
  const boq: WallBOQ = {
    framing: generateDrywallFramingBOQ(wall, frameLayer),
    sheathing: generateGypsumBoardBOQ(wall, gypsumLayers),
    insulation: generateFrameInsulationBOQ(wall, frameLayer),
    finishing: generateDrywallFinishingBOQ(wall, gypsumLayers),
    accessories: generateDrywallAccessoriesBOQ(wall),
    labour: generateDrywallLabourBOQ(wall),
    totalCost: 0
  };
  
  boq.totalCost = Object.values(boq)
    .filter(section => typeof section === 'object' && 'totalCost' in section)
    .reduce((sum, section) => sum + section.totalCost, 0);
  
  return boq;
}

function generateDrywallFramingBOQ(wall: Wall, frameLayer: WallLayer): BOQSection {
  const items: BOQItem[] = [];
  
  const framingType = DRYWALL_FRAMING_LIBRARY.find(
    f => f.id === frameLayer.drywallFrame.framingType
  );
  
  const wallLength = wall.geometry.length / 1000; // m
  const wallHeight = wall.geometry.height / 1000; // m
  
  // Calculate stud quantity
  const studSpacing = frameLayer.drywallFrame.studSpacing / 1000; // m
  const studQuantity = Math.ceil(wallLength / studSpacing) + 1; // +1 for end stud
  
  // Studs
  items.push({
    code: 'DRY-STD-001',
    description: `${framingType.material === 'timber' ? 'Timber' : 'Steel'} studs ${framingType.studs.size} @ ${frameLayer.drywallFrame.studSpacing}mm c/c`,
    unit: 'no',
    quantity: studQuantity,
    wastage: 5,
    totalQuantity: Math.ceil(studQuantity * 1.05),
    unitRate: framingType.cost.studsPerLinearMeter * wallHeight,
    totalCost: 0,
    designMode: wall.designMode.mode
  });
  
  // Top and bottom tracks
  items.push({
    code: 'DRY-TRK-001',
    description: `${framingType.material === 'timber' ? 'Timber' : 'Steel'} tracks ${framingType.studs.size}`,
    unit: 'm',
    quantity: wallLength * 2, // Top and bottom
    wastage: 10,
    totalQuantity: wallLength * 2 * 1.1,
    unitRate: framingType.cost.tracksPerLinearMeter,
    totalCost: 0,
    designMode: wall.designMode.mode
  });
  
  // Noggings (if required)
  if (frameLayer.drywallFrame.noggings.required) {
    const noggingRows = Math.ceil(wallHeight / (frameLayer.drywallFrame.noggings.spacing / 1000));
    
    items.push({
      code: 'DRY-NOG-001',
      description: 'Noggings/blocking',
      unit: 'm',
      quantity: wallLength * noggingRows,
      wastage: 10,
      totalQuantity: wallLength * noggingRows * 1.1,
      unitRate: framingType.cost.studsPerLinearMeter,
      totalCost: 0,
      designMode: wall.designMode.mode
    });
  }
  
  // Fasteners
  items.push({
    code: 'DRY-FST-001',
    description: framingType.material === 'timber' ? 'Nails/screws for timber frame' : 'Tek screws for steel frame',
    unit: 'kg',
    quantity: studQuantity * 0.5, // Approx 0.5kg per stud
    wastage: 10,
    totalQuantity: studQuantity * 0.5 * 1.1,
    unitRate: framingType.material === 'timber' ? 45 : 58,
    totalCost: 0,
    designMode: wall.designMode.mode
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

function generateGypsumBoardBOQ(wall: Wall, gypsumLayers: WallLayer[]): BOQSection {
  const items: BOQItem[] = [];
  
  const wallArea = (wall.geometry.length / 1000) * (wall.geometry.height / 1000);
  
  // Deduct openings
  const openingArea = wall.openings.reduce((sum, opening) => {
    return sum + (opening.dimensions.width / 1000) * (opening.dimensions.height / 1000);
  }, 0);
  
  const netArea = wallArea - openingArea;
  
  gypsumLayers.forEach((layer, index) => {
    const gypsum = GYPSUM_BOARD_LIBRARY.find(
      g => g.id === layer.gypsumBoard.boardType
    );
    
    const numLayers = layer.gypsumBoard.layers;
    const totalAreaThisLayer = netArea * numLayers;
    
    items.push({
      code: `DRY-GYP-${String(index + 1).padStart(3, '0')}`,
      description: `${gypsum.name} (${layer.gypsumBoard.orientation})`,
      unit: 'm²',
      quantity: totalAreaThisLayer,
      wastage: 10, // 10% for cuts and wastage
      totalQuantity: totalAreaThisLayer * 1.1,
      unitRate: gypsum.cost.perM2,
      totalCost: 0,
      designMode: wall.designMode.mode,
      
      details: {
        thickness: `${gypsum.dimensions.thickness}mm`,
        layers: numLayers,
        orientation: layer.gypsumBoard.orientation,
        sheets: Math.ceil(totalAreaThisLayer / 2.88) // 2.88m² per sheet (1.2 × 2.4)
      }
    });
    
    items[items.length - 1].totalCost = items[items.length - 1].totalQuantity * gypsum.cost.perM2;
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}

function generateDrywallFinishingBOQ(wall: Wall, gypsumLayers: WallLayer[]): BOQSection {
  const items: BOQItem[] = [];
  
  const wallLength = wall.geometry.length / 1000; // m
  const wallHeight = wall.geometry.height / 1000; // m
  
  // Joint tape
  const jointLength = (wallHeight * gypsumLayers.length * 2) + wallLength; // Vertical and horizontal joints
  
  items.push({
    code: 'DRY-FIN-001',
    description: 'Paper joint tape',
    unit: 'm',
    quantity: jointLength,
    wastage: 15,
    totalQuantity: jointLength * 1.15,
    unitRate: 3.50,
    totalCost: 0,
    designMode: wall.designMode.mode
  });
  
  // Joint compound (3 coats)
  const wallArea = wallLength * wallHeight;
  const compoundKg = wallArea * 1.5; // Approx 1.5kg per m² for all coats
  
  items.push({
    code: 'DRY-FIN-002',
    description: 'All-purpose joint compound',
    unit: 'kg',
    quantity: compoundKg,
    wastage: 10,
    totalQuantity: compoundKg * 1.1,
    unitRate: 16.50,
    totalCost: 0,
    designMode: wall.designMode.mode,
    
    details: {
      coats: 3,
      coverage: `${wallArea.toFixed(2)}m²`,
      buckets: Math.ceil(compoundKg / 20) // 20kg buckets
    }
  });
  
  // Screws
  items.push({
    code: 'DRY-FIN-003',
    description: 'Drywall screws',
    unit: 'kg',
    quantity: wallArea * 0.15, // Approx 0.15kg per m²
    wastage: 10,
    totalQuantity: wallArea * 0.15 * 1.1,
    unitRate: 28,
    totalCost: 0,
    designMode: wall.designMode.mode
  });
  
  // Corner bead (if external corners exist)
  const externalCorners = calculateExternalCorners(wall);
  if (externalCorners > 0) {
    items.push({
      code: 'DRY-FIN-004',
      description: 'Metal corner bead',
      unit: 'm',
      quantity: externalCorners * wallHeight,
      wastage: 5,
      totalQuantity: externalCorners * wallHeight * 1.05,
      unitRate: 18,
      totalCost: 0,
      designMode: wall.designMode.mode
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

## 6.2 ICF BOQ Generation

```ts
function generateICFBOQ(wall: Wall): WallBOQ {
  const icfLayer = wall.construction.layers.find(l => l.type === 'icf');
  const icfType = ICF_LIBRARY.find(i => i.id === icfLayer.icf.icfType);
  
  const wallArea = (wall.geometry.length / 1000) * (wall.geometry.height / 1000);
  
  const items: BOQItem[] = [];
  
  // ICF blocks
  const blockQuantity = wallArea * icfType.installation.blocksPerM2;
  
  items.push({
    code: 'ICF-BLK-001',
    description: `${icfType.name} - ${icfType.manufacturer}`,
    unit: 'no',
    quantity: blockQuantity,
    wastage: 5,
    totalQuantity: Math.ceil(blockQuantity * 1.05),
    unitRate: icfType.cost.blocksPerM2 / icfType.installation.blocksPerM2,
    totalCost: 0,
    designMode: wall.designMode.mode,
    
    details: {
      wallThickness: `${icfType.blockDimensions.totalThickness}mm`,
      foamThickness: `${icfType.wallComposition.exteriorFoam.thickness}mm + ${icfType.wallComposition.interiorFoam.thickness}mm`,
      concreteCore: `${icfType.wallComposition.concreteCore.thickness}mm`
    }
  });
  
  // Concrete
  const concreteVolume = wallArea * icfType.installation.concreteM3PerM2;
  
  items.push({
    code: 'ICF-CON-001',
    description: `${icfType.wallComposition.concreteCore.grade} concrete (slump ${icfType.wallComposition.concreteCore.slumpRequired}mm)`,
    unit: 'm³',
    quantity: concreteVolume,
    wastage: 5,
    totalQuantity: concreteVolume * 1.05,
    unitRate: getConcreteRate(icfType.wallComposition.concreteCore.grade),
    totalCost: 0,
    designMode: wall.designMode.mode
  });
  
  // Reinforcement - vertical
  const verticalBarLength = wallHeight * studQuantity;
  const verticalBarMass = calculateRebarMass(
    icfType.reinforcement.vertical.size,
    verticalBarLength
  );
  
  items.push({
    code: 'ICF-RBR-001',
    description: `${icfType.reinforcement.vertical.size} vertical reinforcement @ ${icfType.reinforcement.vertical.spacing}mm c/c`,
    unit: 'kg',
    quantity: verticalBarMass,
    wastage: 7.5,
    totalQuantity: verticalBarMass * 1.075,
    unitRate: getRebarRate(icfType.reinforcement.vertical.size),
    totalCost: 0,
    designMode: wall.designMode.mode
  });
  
  // Reinforcement - horizontal
  const horizontalBarLength = wallLength * Math.ceil(wallHeight / (icfType.reinforcement.horizontal.spacing / 1000));
  const horizontalBarMass = calculateRebarMass(
    icfType.reinforcement.horizontal.size,
    horizontalBarLength
  );
  
  items.push({
    code: 'ICF-RBR-002',
    description: `${icfType.reinforcement.horizontal.size} horizontal reinforcement @ ${icfType.reinforcement.horizontal.spacing}mm c/c`,
    unit: 'kg',
    quantity: horizontalBarMass,
    wastage: 7.5,
    totalQuantity: horizontalBarMass * 1.075,
    unitRate: getRebarRate(icfType.reinforcement.horizontal.size),
    totalCost: 0,
    designMode: wall.designMode.mode
  });
  
  // Concrete pump
  if (concreteVolume > 2) {
    items.push({
      code: 'ICF-PLT-001',
      description: 'Concrete pump hire',
      unit: 'day',
      quantity: Math.ceil(concreteVolume / 15), // Assume 15m³ per day
      wastage: 0,
      totalQuantity: Math.ceil(concreteVolume / 15),
      unitRate: 2800,
      totalCost: 0,
      designMode: wall.designMode.mode
    });
  }
  
  // Bracing
  items.push({
    code: 'ICF-BRC-001',
    description: 'Temporary bracing and alignment',
    unit: 'm²',
    quantity: wallArea,
    wastage: 0,
    totalQuantity: wallArea,
    unitRate: 35,
    totalCost: 0,
    designMode: wall.designMode.mode
  });
  
  // Calculate costs
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    icfBlocks: { items: [items[0]], totalCost: items[0].totalCost },
    concrete: { items: [items[1]], totalCost: items[1].totalCost },
    reinforcement: { 
      items: [items[2], items[3]], 
      totalCost: items[2].totalCost + items[3].totalCost 
    },
    equipment: { 
      items: items.slice(4), 
      totalCost: items.slice(4).reduce((sum, item) => sum + item.totalCost, 0)
    },
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

---

# 7. SANS Compliance for Modern Systems

## 7.1 Drywall SANS Compliance

```ts
function validateDrywallCompliance(wall: Wall): SANSComplianceCheck[] {
  const checks: SANSComplianceCheck[] = [];
  
  const frameLayer = wall.construction.layers.find(l => l.type === 'drywall_frame');
  
  // Stud spacing
  checks.push({
    rule: 'Stud Spacing',
    standard: 'SANS 10082',
    requirement: 'Maximum 600mm c/c',
    actual: `${frameLayer.drywallFrame.studSpacing}mm`,
    compliant: frameLayer.drywallFrame.studSpacing <= 600,
    message: 'Stud spacing must not exceed 600mm for gypsum board support',
    critical: true
  });
  
  // Fire rating (if fire-rated gypsum used)
  const fireRatedBoards = wall.construction.layers.filter(l => 
    l.type === 'gypsum_board' && 
    GYPSUM_BOARD_LIBRARY.find(g => g.id === l.gypsumBoard.boardType).type === 'fire_rated'
  );
  
  if (fireRatedBoards.length > 0) {
    const totalFireRating = fireRatedBoards.length * 60; // 60 min per layer
    
    checks.push({
      rule: 'Fire Rating',
      standard: 'SANS 10177',
      requirement: wall.type.fire === 'fire_rated' ? '60 minutes minimum' : 'N/A',
      actual: `${totalFireRating} minutes`,
      compliant: totalFireRating >= 60,
      message: 'Fire-rated construction requires minimum 60-minute rating',
      critical: wall.type.fire === 'fire_rated'
    });
  }
  
  // Moisture-resistant board in wet areas
  if (wall.type.location === 'bathroom' || wall.type.location === 'kitchen') {
    const hasMoistureBoard = wall.construction.layers.some(l =>
      l.type === 'gypsum_board' &&
      GYPSUM_BOARD_LIBRARY.find(g => g.id === l.gypsumBoard.boardType).performance.moistureResistant
    );
    
    checks.push({
      rule: 'Moisture Resistance',
      standard: 'SANS 10082',
      requirement: 'Moisture-resistant board required in wet areas',
      actual: hasMoistureBoard ? 'Moisture-resistant board used' : 'Standard board used',
      compliant: hasMoistureBoard,
      message: 'Wet areas require moisture-resistant (green board) gypsum',
      critical: true
    });
  }
  
  return checks;
}
```

---

# 8. Completion

Volume IX Part B establishes the complete **Modern Wall Systems** with:

- **Comprehensive material libraries** for drywall, concrete panels, ICF, SIP, sandwich panels
- **Real construction specifications** - actual stud dimensions, gypsum thicknesses, panel compositions
- **Accurate quantity calculations** - studs, boards, fasteners, insulation, concrete
- **Dual-mode system** - Standard (auto) and Engineer (custom)
- **BOQ integration** - material-accurate quantities and costs for all modern systems
- **SANS compliance** - construction standards for each system type
- **Performance data** - R-values, fire ratings, sound reduction, load capacities

Together with Volume IX Part A (Masonry), this provides a **complete wall system specification** covering traditional and modern construction methods.

---

**END OF VOLUME IX PART B**
