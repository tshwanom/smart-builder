# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification
## Volume VIII — Subfloor/Suspended Floor Systems: Dual-Mode Engineering Parameters & BOQ Integration

**Version:** 8.0  
**Revision Date:** 2026-02-18  
**Document Type:** Enterprise Engineering Specification  

---

# 1. Document Control

- **Version:** 8.0
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** __________________

---

# 2. Scope

Volume VIII defines the **Subfloor/Suspended Floor System with Dual-Mode Engineering Controls** for the SVG-Based Parametric CAD & BOQ Platform.

This document establishes:

- **Standard Mode**: Automatic SANS-compliant subfloor design using minimum requirements
- **Engineer Mode**: Advanced parametric controls for custom subfloor structural design
- Complete subfloor system integration (foundations + support structure + slab + ventilation + services)
- Beam and block, hollow core, precast, and cast-in-situ systems
- Sleeper wall, beam, and column support structures
- Ventilation compliance (SANS 10400-H)
- Underfloor treatment and damp proofing
- Services routing through subfloor void
- BOQ derivation from subfloor parameters
- SANS compliance enforcement across all subfloor components

---

# 3. Strategic Objective

The subfloor system must:

- **Operate in two modes**: Standard (auto-compliance) and Engineer (custom design)
- Generate complete SANS-compliant subfloor systems automatically
- Allow engineers to override with custom structural designs
- Integrate foundation, support structure, slab, and building services
- Calculate ventilation requirements automatically
- Generate accurate BOQ for all subfloor components
- Ensure SANS 10400-H compliance for South African projects
- Support multi-country standards via StandardConfig
- Provide plan and section views showing complete subfloor assembly

---

# 4. Dual-Mode System Architecture

## 4.1 Mode Definition

```ts
type DesignMode = 'standard' | 'engineer';

interface SubfloorDesignMode {
  mode: DesignMode;
  autoCompliance: boolean;
  engineerOverride: boolean;
  requiresApproval: boolean;
  engineerSignature?: {
    name: string;
    registrationNumber: string;
    date: Date;
    stamp: string;
  };
}
```

## 4.2 Mode Selection UI Flow

```
User Creates Floor Plan
    ↓
┌─────────────────────────────────────┐
│  Select Floor System                │
│  ○ Slab on Ground                   │
│  ○ Suspended Floor/Subfloor         │
└─────────────────────────────────────┘
    ↓
If Suspended Floor Selected:
    ↓
┌─────────────────────────────────────┐
│  Select Design Mode                 │
│  ○ Standard (SANS Auto-Compliant)   │
│  ○ Engineer (Custom Design)         │
└─────────────────────────────────────┘
    ↓
Mode: Standard               Mode: Engineer
    ↓                             ↓
Auto-calculate using         Open Engineer Modal
SANS minimum requirements    (Advanced Parameters)
    ↓                             ↓
- System type selection      - Custom system design
- Auto span calculations     - Custom span design
- Auto support spacing       - Custom support layout
- Auto ventilation           - Custom ventilation
    ↓                             ↓
Generate Complete            Validate Against SANS
Subfloor System                   ↓
    ↓                        Generate Custom
Generate BOQ                 Subfloor System
    ↓                             ↓
Ready for Drawing            Require Engineer Signature
                                  ↓
                            Generate BOQ
                                  ↓
                            Ready for Drawing
```

---

# 5. Subfloor System Type Classification

```ts
type SubfloorSystemType = 
  | 'beam_and_block'
  | 'hollow_core'
  | 'precast_planks'
  | 'cast_in_situ_slab'
  | 'timber_joist';

type SupportType =
  | 'sleeper_walls'
  | 'beams_only'
  | 'beam_and_column'
  | 'perimeter_only';

interface SubfloorConfig {
  systemType: SubfloorSystemType;
  supportType: SupportType;
  designMode: SubfloorDesignMode;
  soilClass: 'H1' | 'H2' | 'H3' | 'H4' | 'S';
}
```

---

# 6. Standard Mode: Auto-Compliant Subfloor Parameters

## 6.1 Standard Beam and Block System

```ts
interface StandardBeamAndBlock {
  id: string;
  designMode: 'standard';
  polygon: Point3D[]; // Floor area
  
  // Auto-calculated elevations
  levels: {
    naturalGroundLevel: number; // 0 reference
    finishedFloorLevel: number; // Auto: NGL + 450mm typical
    underfloorClearance: number; // Auto: 150mm SANS minimum
    slabSoffit: number; // Auto: FFL - slab depth
  };
  
  // Auto-selected system
  slab: {
    systemType: 'beam_and_block';
    
    // Standard beam specification
    beams: {
      type: 'prestressed_beam';
      size: '140mm_standard'; // Auto-selected
      spacing: 450; // mm c/c (standard for blocks)
      quantity: number; // Auto-calculated
      length: number; // Auto from span
    };
    
    // Standard block specification
    blocks: {
      type: 'hollow_concrete_block';
      size: '390x140x190'; // Standard dimension
      quantity: number; // Auto-calculated
    };
    
    // Top screed
    screed: {
      thickness: 50; // mm (standard)
      grade: '20MPa';
      reinforcement: 'Ref193'; // Mesh
      volume: number; // Auto-calculated m³
    };
  };
  
  // Auto-designed support (sleeper walls)
  support: {
    type: 'sleeper_walls';
    
    walls: {
      thickness: 115; // mm (standard single brick)
      height: number; // Auto: underfloorClearance + beam depth
      spacing: 1800; // mm (standard for beam and block)
      material: 'brick';
      strength: '7MPa';
      quantity: number; // Linear meters
    };
    
    foundations: {
      type: 'strip_footing';
      width: 450; // mm (SANS minimum)
      depth: 300; // mm (standard)
      foundingLevel: number; // Auto from soil class
      concrete: '20MPa';
    };
    
    dampProofing: {
      dpc: '375micron'; // Standard
      location: 'under_slab_and_on_walls';
    };
  };
  
  // Auto-calculated ventilation
  ventilation: {
    required: true;
    
    // SANS requirement: 1500mm² per 100m² floor area
    calculation: {
      floorArea: number; // m²
      requiredVentArea: number; // mm² (floorArea * 1500/100)
      providedVentArea: number; // mm²
      compliant: boolean;
    };
    
    airBricks: {
      type: 'standard_clay';
      size: '215x65'; // mm
      freeArea: 11000; // mm² per brick
      quantity: number; // Auto-calculated
      spacing: number; // mm (around perimeter)
    };
    
    wallOpenings: {
      inSleeperWalls: true;
      openingSize: '200x65'; // mm
      spacing: 1800; // mm (one per span)
      quantity: number; // Auto-calculated
    };
  };
  
  // Auto-specified underfloor treatment
  underfloor: {
    treatment: 'soil_poison_and_membrane';
    
    soilPoison: {
      required: true;
      product: 'standard_termiticide';
      coverage: number; // m² (full floor area)
      certification: true;
    };
    
    membrane: {
      type: 'polythene';
      thickness: '250micron';
      area: number; // m² with overlap
      overlap: 300; // mm
    };
  };
}
```

## 6.2 Standard Hollow Core System

```ts
interface StandardHollowCore {
  id: string;
  designMode: 'standard';
  polygon: Point3D[];
  
  levels: {
    naturalGroundLevel: number;
    finishedFloorLevel: number;
    underfloorClearance: number; // 150mm minimum
    slabSoffit: number;
  };
  
  slab: {
    systemType: 'hollow_core';
    
    // Auto-selected based on span
    slabDepth: 150 | 200 | 250 | 300; // mm (auto-selected)
    slabWidth: 1200; // mm (standard)
    bearing: 100; // mm each end (SANS minimum)
    quantity: number; // Linear meters
    
    // Grout joints
    grout: {
      required: true;
      grade: '25MPa';
      volume: number; // m³ for joints
    };
    
    // Top screed (optional)
    screed?: {
      thickness: 50; // mm
      grade: '20MPa';
      mesh: 'Ref193';
    };
  };
  
  support: {
    type: 'perimeter_beams';
    
    // Perimeter beams on strip footings
    perimeterBeams: {
      width: 230; // mm (match wall)
      depth: 450; // mm (typical)
      concrete: '25MPa';
      reinforcement: {
        topBars: 'Y12_@ 200mm';
        bottomBars: 'Y16_@ 150mm';
        stirrups: 'Y10_@ 200mm';
      };
    };
    
    // Internal beams (if span > 6m)
    internalBeams?: {
      width: 230; // mm
      depth: 450; // mm
      spacing: number; // mm (based on hollow core capacity)
      quantity: number;
    };
  };
  
  ventilation: {
    // Same as beam and block
    required: true;
    airBricks: {
      quantity: number;
      spacing: number;
    };
  };
}
```

## 6.3 Standard Calculation Rules

```ts
const SANS_SUBFLOOR_REQUIREMENTS = {
  clearance: {
    minimum: 150, // mm underfloor clearance
    recommended: 300, // mm for access
  },
  
  ventilation: {
    ratioPerFloorArea: 1500 / 100, // mm²/m² (SANS 10400-H)
    airBrickFreeArea: 11000, // mm² per standard brick
    spacing: 3000, // mm maximum between vents
  },
  
  beamAndBlock: {
    beamSpacing: 450, // mm c/c (for standard blocks)
    supportSpacing: {
      maximum: 1800, // mm for standard beams
      sleeperWallThickness: 115, // mm minimum
    },
    screedThickness: {
      minimum: 40, // mm
      standard: 50, // mm
    },
  },
  
  hollowCore: {
    slabWidth: 1200, // mm standard
    minimumBearing: 100, // mm each end
    spanCapacity: {
      150: 4000, // mm (150mm slab max span)
      200: 6000, // mm (200mm slab max span)
      250: 8000, // mm (250mm slab max span)
      300: 10000, // mm (300mm slab max span)
    },
  },
  
  sleeperWalls: {
    minimumThickness: 115, // mm
    minimumHeight: 300, // mm (including beam depth)
    maximumSpacing: 2400, // mm
    foundation: {
      minimumWidth: 450, // mm
      minimumDepth: 300, // mm
    },
  },
  
  dampProofing: {
    dpcType: '375micron',
    dpmThickness: '250micron',
    overlap: 150, // mm minimum
  },
  
  underfloorTreatment: {
    termiteTreatment: true, // Mandatory in termite areas
    membrane: 'recommended',
  }
};

function createStandardBeamAndBlock(
  floorPolygon: Point3D[],
  soilClass: string
): StandardBeamAndBlock {
  const floorArea = calculatePolygonArea(floorPolygon);
  const maxSpan = calculateMaxSpan(floorPolygon);
  
  // Auto-calculate support spacing
  const supportSpacing = maxSpan > 3600 ? 1800 : 2400;
  
  // Auto-calculate ventilation
  const requiredVentArea = floorArea * SANS_SUBFLOOR_REQUIREMENTS.ventilation.ratioPerFloorArea;
  const airBrickQuantity = Math.ceil(requiredVentArea / SANS_SUBFLOOR_REQUIREMENTS.ventilation.airBrickFreeArea);
  
  // Auto-calculate beam quantity
  const floorWidth = calculateFloorWidth(floorPolygon);
  const beamQuantity = Math.ceil(floorWidth / SANS_SUBFLOOR_REQUIREMENTS.beamAndBlock.beamSpacing);
  
  // Auto-calculate block quantity
  const blockArea = floorArea - (beamQuantity * 0.14 * maxSpan / 1000000); // Subtract beam area
  const blockQuantity = Math.ceil(blockArea / (0.39 * 0.19)); // Per block dimensions
  
  return {
    id: generateUUID(),
    designMode: 'standard',
    polygon: floorPolygon,
    
    levels: {
      naturalGroundLevel: 0,
      finishedFloorLevel: 450, // Standard rise
      underfloorClearance: 150, // SANS minimum
      slabSoffit: 450 - 140 - 50, // FFL - beam depth - screed
    },
    
    slab: {
      systemType: 'beam_and_block',
      beams: {
        type: 'prestressed_beam',
        size: '140mm_standard',
        spacing: 450,
        quantity: beamQuantity,
        length: maxSpan
      },
      blocks: {
        type: 'hollow_concrete_block',
        size: '390x140x190',
        quantity: blockQuantity
      },
      screed: {
        thickness: 50,
        grade: '20MPa',
        reinforcement: 'Ref193',
        volume: (floorArea * 50) / 1000000 // m³
      }
    },
    
    support: {
      type: 'sleeper_walls',
      walls: {
        thickness: 115,
        height: 150 + 140, // Clearance + beam depth
        spacing: supportSpacing,
        material: 'brick',
        strength: '7MPa',
        quantity: calculateSleeperWallLength(floorPolygon, supportSpacing)
      },
      foundations: {
        type: 'strip_footing',
        width: 450,
        depth: 300,
        foundingLevel: SANS_MINIMUM_REQUIREMENTS.foundingDepth[soilClass],
        concrete: '20MPa'
      },
      dampProofing: {
        dpc: '375micron',
        location: 'under_slab_and_on_walls'
      }
    },
    
    ventilation: {
      required: true,
      calculation: {
        floorArea,
        requiredVentArea,
        providedVentArea: airBrickQuantity * 11000,
        compliant: (airBrickQuantity * 11000) >= requiredVentArea
      },
      airBricks: {
        type: 'standard_clay',
        size: '215x65',
        freeArea: 11000,
        quantity: airBrickQuantity,
        spacing: calculatePerimeter(floorPolygon) / airBrickQuantity
      },
      wallOpenings: {
        inSleeperWalls: true,
        openingSize: '200x65',
        spacing: supportSpacing,
        quantity: calculateSleeperWallCount(floorPolygon, supportSpacing)
      }
    },
    
    underfloor: {
      treatment: 'soil_poison_and_membrane',
      soilPoison: {
        required: true,
        product: 'standard_termiticide',
        coverage: floorArea,
        certification: true
      },
      membrane: {
        type: 'polythene',
        thickness: '250micron',
        area: floorArea * 1.15, // 15% overlap allowance
        overlap: 300
      }
    }
  };
}
```

---

# 7. Engineer Mode: Advanced Subfloor Parameters

## 7.1 Engineer Beam and Block System

```ts
interface EngineerBeamAndBlock {
  id: string;
  designMode: 'engineer';
  polygon: Point3D[];
  
  // Engineer-specified elevations
  levels: {
    naturalGroundLevel: number;
    finishedFloorLevel: number; // Custom
    underfloorClearance: number; // Custom (min 150mm)
    slabSoffit: number; // Calculated
    excavationDepth: number; // If required
  };
  
  // Engineer-designed slab system
  slab: {
    systemType: 'beam_and_block' | 'custom';
    
    beams: {
      type: 'prestressed' | 'reinforced_concrete' | 'steel';
      
      // If prestressed
      prestressed?: {
        manufacturer: string;
        size: string; // e.g., "140mm", "200mm", "250mm"
        spacing: number; // mm c/c (custom)
        length: number; // mm
        loadCapacity: number; // kN/m
        quantity: number;
      };
      
      // If reinforced concrete
      reinforcedConcrete?: {
        width: number; // mm
        depth: number; // mm
        concrete: {
          grade: '25MPa' | '30MPa' | '40MPa';
        };
        reinforcement: {
          topBars: RebarSpec[];
          bottomBars: RebarSpec[];
          stirrups: RebarSpec;
        };
        spacing: number; // mm c/c
        quantity: number;
      };
      
      // If steel
      steel?: {
        section: string; // e.g., "IPE 200"
        spacing: number; // mm c/c
        coating: string;
        quantity: number;
      };
    };
    
    blocks: {
      type: 'hollow_concrete' | 'eps' | 'lightweight' | 'none';
      customSize?: {
        length: number; // mm
        width: number; // mm
        height: number; // mm
      };
      strength?: string;
      quantity: number;
    };
    
    screed: {
      thickness: number; // mm (min 40mm)
      grade: '15MPa' | '20MPa' | '25MPa' | '30MPa';
      reinforcement: {
        type: 'mesh' | 'fibers' | 'none';
        mesh?: {
          type: 'Ref193' | 'Ref245' | 'custom';
          overlap: number; // mm
        };
        fibers?: {
          type: string;
          dosage: number; // kg/m³
        };
      };
      volume: number; // m³
    };
    
    // Optional structural topping
    structuralTopping?: {
      required: boolean;
      thickness: number; // mm
      concrete: string;
      reinforcement: RebarSpec[];
    };
  };
  
  // Engineer-designed support structure
  support: {
    type: 'sleeper_walls' | 'beams_only' | 'beam_and_column' | 'custom';
    
    // If sleeper walls
    sleeperWalls?: {
      thickness: 115 | 140 | 230; // mm
      height: number; // mm (custom)
      spacing: number; // mm (custom)
      
      construction: {
        material: 'brick' | 'block' | 'reinforced_masonry';
        strength: '7MPa' | '10MPa' | 'custom';
        mortar: string;
        
        // If reinforced
        reinforcement?: {
          vertical: {
            size: 'Y10' | 'Y12' | 'Y16';
            spacing: number; // mm
            grouted: boolean;
          };
          horizontal: {
            type: 'brickforce' | 'ladder' | 'none';
            spacing: number; // courses
          };
        };
      };
      
      foundation: {
        type: 'strip_footing' | 'continuous_beam';
        width: number; // mm (custom)
        depth: number; // mm (custom)
        foundingLevel: number; // mm
        concrete: ConcreteSpec;
        reinforcement?: ReinforcementSpec;
      };
      
      ventilationOpenings: {
        size: number; // mm² per opening
        spacing: number; // mm centers
        quantity: number;
        lintel: {
          type: 'precast' | 'cast_in_place';
          size: string;
        };
      };
      
      dampProofing: {
        dpc: {
          type: '375micron' | '500micron' | 'bituminous' | 'torchOn';
          location: string;
        };
      };
    };
    
    // If beam and column
    beamAndColumn?: {
      columns: {
        size: {
          width: number; // mm
          depth: number; // mm
        };
        height: number; // mm
        spacing: {
          longitudinal: number; // mm
          transverse: number; // mm
        };
        quantity: number;
        positions: Point3D[];
        
        concrete: {
          grade: '25MPa' | '30MPa' | '40MPa';
        };
        
        reinforcement: {
          mainBars: {
            size: 'Y12' | 'Y16' | 'Y20' | 'Y25';
            quantity: number;
          };
          links: {
            size: 'Y8' | 'Y10';
            spacing: number; // mm
          };
        };
        
        foundation: {
          type: 'pad_footing';
          padSize: {
            width: number; // mm
            length: number; // mm
            depth: number; // mm
          };
          concrete: ConcreteSpec;
          reinforcement: ReinforcementSpec;
        };
      };
      
      beams: {
        primary: BeamSpec[];
        secondary: BeamSpec[];
      };
    };
  };
  
  // Engineer-designed ventilation
  ventilation: {
    required: boolean;
    
    customCalculation: {
      floorArea: number; // m²
      requiredVentArea: number; // mm²
      providedVentArea: number; // mm²
      ventilationRate: number; // air changes per hour
      compliant: boolean;
      justification?: string; // If non-compliant
    };
    
    airBricks: {
      type: string;
      customSize?: {
        width: number; // mm
        height: number; // mm
        freeArea: number; // mm²
      };
      quantity: number;
      locations: Point2D[];
    };
    
    mechanicalVentilation?: {
      required: boolean;
      fanCapacity: number; // m³/hr
      quantity: number;
      locations: Point2D[];
    };
  };
  
  // Engineer-specified underfloor treatment
  underfloor: {
    treatment: 'soil_poison' | 'concrete_oversite' | 'membrane' | 'combined' | 'none';
    
    // If concrete oversite (suspended slab above concrete)
    oversite?: {
      thickness: number; // mm
      grade: '15MPa' | '20MPa';
      reinforcement?: {
        mesh: string;
        overlap: number; // mm
      };
      area: number; // m²
      purpose: 'structural' | 'damp_proofing' | 'finish';
    };
    
    soilPoison?: {
      required: boolean;
      product: string;
      coverage: number; // m²
      concentration: string;
      applicationMethod: string;
      certification: boolean;
    };
    
    membrane?: {
      type: 'polythene' | 'geotextile' | 'reinforced' | 'vapour_barrier';
      thickness: string;
      area: number; // m²
      overlap: number; // mm
      sealed: boolean;
    };
    
    drainage?: {
      required: boolean;
      type: 'perimeter' | 'internal' | 'sump';
      pipeSize: number; // mm
      length: number; // m
    };
  };
  
  // Services routing
  services: {
    drainage: {
      pipes: {
        diameter: number; // mm
        material: 'PVC' | 'uPVC';
        length: number; // m
        gradient: number; // % (min 1:100)
        inverted: boolean; // Suspended or on ground
      }[];
      
      inspectionChambers: {
        quantity: number;
        size: string;
        depth: number; // mm
        locations: Point3D[];
      };
    };
    
    water: {
      pipes: {
        diameter: number; // mm
        material: 'copper' | 'PEX' | 'HDPE';
        length: number; // m
        insulation: boolean;
      }[];
      
      sleeves: {
        diameter: number; // mm
        quantity: number;
        locations: Point3D[];
      };
    };
    
    electrical: {
      conduits: {
        diameter: number; // mm
        material: 'PVC' | 'steel';
        length: number; // m
      }[];
      
      junctionBoxes: {
        quantity: number;
        locations: Point3D[];
      };
    };
  };
  
  // Loading and structural analysis
  structuralAnalysis: {
    loads: {
      deadLoad: number; // kN/m²
      liveLoad: number; // kN/m²
      totalDesignLoad: number; // kN/m² (factored)
    };
    
    spanAnalysis: {
      maxSpan: number; // mm
      maxDeflection: number; // mm
      allowableDeflection: number; // mm (L/360 typical)
      deflectionCheck: boolean;
    };
    
    bearingAnalysis: {
      bearingPressure: number; // kPa
      allowableBearing: number; // kPa
      bearingCheck: boolean;
    };
    
    calculations: {
      reference: string;
      attachments: string[]; // PDF references
    };
  };
  
  // Design notes
  designNotes: {
    generalNotes: string[];
    specialRequirements: string[];
    constructionSequence?: string[];
    qualityControl?: string[];
  };
  
  // Engineer signature
  engineerSignature: {
    required: true;
    name: string;
    registrationNumber: string;
    company: string;
    date: Date;
    digitalStamp: string;
    approved: boolean;
  };
  
  // SANS compliance validation
  complianceOverride: {
    hasOverrides: boolean;
    overrideReasons: string[];
    justification: string;
    approvedBy: string;
  };
}
```

---

# 8. Supporting Data Models

## 8.1 Beam Specification

```ts
interface BeamSpec {
  id: string;
  type: 'ground_beam' | 'suspended_beam' | 'perimeter_beam' | 'internal_beam';
  
  geometry: {
    width: number; // mm
    depth: number; // mm
    length: number; // mm
    position: {
      start: Point3D;
      end: Point3D;
    };
  };
  
  concrete: {
    grade: '20MPa' | '25MPa' | '30MPa' | '40MPa';
    volume: number; // m³
    overbreakAllowance: number; // %
  };
  
  reinforcement: {
    topBars: {
      size: 'Y10' | 'Y12' | 'Y16' | 'Y20' | 'Y25';
      quantity: number;
      spacing: number; // mm c/c (or specific positions)
      length: number; // mm
    }[];
    
    bottomBars: {
      size: 'Y10' | 'Y12' | 'Y16' | 'Y20' | 'Y25';
      quantity: number;
      spacing: number; // mm c/c
      length: number; // mm
    }[];
    
    stirrups: {
      size: 'Y8' | 'Y10' | 'Y12';
      spacing: number; // mm c/c
      quantity: number;
      pattern: 'standard' | 'variable'; // Variable for higher shear zones
    };
  };
  
  formwork: {
    type: 'timber' | 'steel' | 'permanent';
    area: number; // m²
    soffit: boolean;
    sides: boolean;
  };
  
  bearing: {
    startSupport: {
      type: 'wall' | 'column' | 'foundation';
      bearing: number; // mm
    };
    endSupport: {
      type: 'wall' | 'column' | 'foundation';
      bearing: number; // mm
    };
  };
  
  loading: {
    selfWeight: number; // kN/m
    slabLoad: number; // kN/m
    wallLoad?: number; // kN/m (if beam supports wall)
    totalUDL: number; // kN/m (ultimate design load)
  };
}
```

## 8.2 Concrete Specification

```ts
interface ConcreteSpec {
  grade: '15MPa' | '20MPa' | '25MPa' | '30MPa' | '40MPa';
  volume: number; // m³
  overbreakAllowance: number; // % (typically 5-10%)
  totalVolume: number; // volume * (1 + overbreakAllowance/100)
  
  additives?: {
    waterproofer?: boolean;
    plasticizer?: boolean;
    retarder?: boolean;
    accelerator?: boolean;
    fibers?: {
      type: 'steel' | 'synthetic';
      dosage: number; // kg/m³
    };
  };
  
  testing: {
    cubeTests: number; // quantity
    slumpTest: boolean;
    frequencyPerVolume: number; // tests per m³
  };
  
  placement: {
    method: 'pump' | 'skip' | 'chute' | 'direct';
    vibration: boolean;
    curing: 'water' | 'membrane' | 'sheeting';
  };
}
```

## 8.3 Reinforcement Specification

```ts
interface ReinforcementSpec {
  bars: {
    size: 'Y8' | 'Y10' | 'Y12' | 'Y16' | 'Y20' | 'Y25' | 'Y32';
    quantity: number;
    length: number; // mm
    totalMass: number; // kg
    location: 'top' | 'bottom' | 'vertical' | 'horizontal';
    spacing?: number; // mm c/c
  }[];
  
  mesh?: {
    type: 'Ref193' | 'Ref245' | 'Ref283' | 'Ref393' | 'custom';
    area: number; // m²
    overlap: number; // mm (minimum 300mm)
    totalArea: number; // including overlap
  };
  
  accessories: {
    bindingWire: number; // kg (typically 5kg per tonne rebar)
    spacers: number; // quantity
    chairs: number; // quantity
    coverBlocks: number; // quantity
  };
  
  cover: {
    top: number; // mm
    bottom: number; // mm
    sides: number; // mm
  };
  
  bendingSchedule?: {
    reference: string;
    shapes: BendingShape[];
  };
}

interface BendingShape {
  mark: string;
  size: string;
  shape: string; // e.g., "L", "U", "straight"
  dimensions: number[]; // mm
  quantity: number;
  totalLength: number; // mm
  mass: number; // kg
}
```

## 8.4 Damp Proofing Specification

```ts
interface DampProofSpec {
  dpm: {
    type: 'polythene' | 'bituminous' | 'reinforced';
    thickness: '250micron' | '375micron' | '500micron';
    area: number; // m²
    overlap: number; // mm (minimum 150mm)
    totalArea: number; // including overlap
    sealed: boolean;
    tapeJoints: boolean;
  };
  
  dpc: {
    type: '375micron' | '500micron' | 'bituminous' | 'torchOn' | 'slate';
    width: number; // mm
    length: number; // m
    location: 'under_slab' | 'on_walls' | 'both';
    overlap: number; // mm
  };
  
  waterproofing?: {
    type: 'bituminous' | 'torchOn' | 'liquid' | 'cementitious';
    coats: number;
    area: number; // m²
    location: string;
  };
}
```

---

# 9. Engineer Modal Interface Specification

## 9.1 Subfloor Engineer Modal Component

```tsx
interface SubfloorEngineerModalProps {
  floorPolygon: Point3D[];
  standardParams: StandardBeamAndBlock;
  onSave: (engineerParams: EngineerBeamAndBlock) => void;
  onCancel: () => void;
}

const SubfloorEngineerModal: React.FC<SubfloorEngineerModalProps> = ({
  floorPolygon,
  standardParams,
  onSave,
  onCancel
}) => {
  return (
    <Modal size="xxl" isOpen={true}>
      <ModalHeader>
        <div className="flex justify-between items-center">
          <h2>Engineer Design Mode: Subfloor System</h2>
          <Badge variant="warning">
            Requires Structural Engineer Signature
          </Badge>
        </div>
      </ModalHeader>
      
      <ModalBody>
        <Tabs>
          <TabList>
            <Tab>System Selection</Tab>
            <Tab>Slab Design</Tab>
            <Tab>Support Structure</Tab>
            <Tab>Ventilation</Tab>
            <Tab>Underfloor</Tab>
            <Tab>Services</Tab>
            <Tab>Loading & Analysis</Tab>
            <Tab>SANS Compliance</Tab>
            <Tab>Engineer Signature</Tab>
          </TabList>
          
          <TabPanels>
            {/* Tab 1: System Selection */}
            <TabPanel>
              <SystemSelectionForm />
            </TabPanel>
            
            {/* Tab 2: Slab Design */}
            <TabPanel>
              <SlabDesignForm systemType={selectedSystemType} />
            </TabPanel>
            
            {/* Tab 3: Support Structure */}
            <TabPanel>
              <SupportStructureForm />
            </TabPanel>
            
            {/* Tab 4: Ventilation */}
            <TabPanel>
              <VentilationDesignForm />
            </TabPanel>
            
            {/* Tab 5: Underfloor */}
            <TabPanel>
              <UnderfloorTreatmentForm />
            </TabPanel>
            
            {/* Tab 6: Services */}
            <TabPanel>
              <ServicesRoutingForm />
            </TabPanel>
            
            {/* Tab 7: Loading & Analysis */}
            <TabPanel>
              <StructuralAnalysisForm />
            </TabPanel>
            
            {/* Tab 8: SANS Compliance */}
            <TabPanel>
              <SANSComplianceValidator
                params={engineerParams}
                showOverrides={true}
              />
            </TabPanel>
            
            {/* Tab 9: Engineer Signature */}
            <TabPanel>
              <EngineerSignatureForm
                onSign={handleSignature}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalBody>
      
      <ModalFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={!signatureValid}
        >
          Save Engineer Design
        </Button>
      </ModalFooter>
    </Modal>
  );
};
```

## 9.2 Tab Details

### Tab 1: System Selection

```tsx
const SystemSelectionForm = () => (
  <FormGrid>
    <FormSection title="Subfloor System Type">
      <Select
        label="System Type"
        options={[
          'Beam and Block',
          'Hollow Core Slab',
          'Precast Planks',
          'Cast-in-Situ Suspended Slab',
          'Timber Joist (Residential Only)'
        ]}
        onChange={handleSystemTypeChange}
      />
      
      <InfoBox>
        <p>Selected: {systemType}</p>
        <p>Typical span range: {spanRange}</p>
        <p>Typical applications: {applications}</p>
      </InfoBox>
    </FormSection>
    
    <FormSection title="Floor Levels">
      <NumberInput
        label="Natural Ground Level (mm)"
        value={0}
        readOnly={true}
        tooltip="Reference level"
      />
      
      <NumberInput
        label="Finished Floor Level (mm)"
        min={300}
        max={1200}
        tooltip="Height above natural ground level"
      />
      
      <NumberInput
        label="Underfloor Clearance (mm)"
        min={150}
        defaultValue={300}
        tooltip="SANS minimum 150mm, recommend 300mm for access"
      />
      
      <CalculationDisplay
        label="Slab Soffit Level (calculated)"
        value={calculateSlabSoffit()}
        unit="mm"
      />
    </FormSection>
    
    <FormSection title="Support Type">
      <Select
        label="Support Structure"
        options={[
          'Sleeper Walls (Traditional)',
          'Beams Only',
          'Beam and Column Grid',
          'Perimeter Support Only',
          'Custom Configuration'
        ]}
      />
    </FormSection>
  </FormGrid>
);
```

### Tab 2: Slab Design (Beam and Block)

```tsx
const BeamAndBlockSlabForm = () => (
  <FormGrid>
    <FormSection title="Prestressed Beams">
      <TextInput
        label="Beam Manufacturer"
        placeholder="e.g., Midrand Prestress"
      />
      
      <Select
        label="Beam Size"
        options={[
          '140mm Standard',
          '180mm Heavy Duty',
          '200mm Long Span',
          '250mm Extra Long Span',
          'Custom'
        ]}
      />
      
      <NumberInput
        label="Beam Spacing (mm c/c)"
        min={400}
        max={600}
        step={50}
        defaultValue={450}
        tooltip="Standard 450mm for hollow blocks"
      />
      
      <NumberInput
        label="Beam Length (mm)"
        min={2000}
        max={8000}
        tooltip="Based on floor span"
      />
      
      <NumberInput
        label="Load Capacity (kN/m)"
        min={5}
        max={25}
        tooltip="Per manufacturer specifications"
      />
      
      <CalculationDisplay
        label="Number of Beams Required"
        value={calculateBeamQuantity()}
        calculated={true}
      />
    </FormSection>
    
    <FormSection title="Infill Blocks">
      <Select
        label="Block Type"
        options={[
          'Hollow Concrete Block (390x140x190)',
          'EPS Block (Lightweight)',
          'Clay Block',
          'Custom'
        ]}
      />
      
      {blockType === 'Custom' && (
        <div>
          <NumberInput label="Block Length (mm)" />
          <NumberInput label="Block Width (mm)" />
          <NumberInput label="Block Height (mm)" />
        </div>
      )}
      
      <Select
        label="Block Strength"
        options={['Standard', 'Load Bearing', 'Lightweight']}
      />
      
      <CalculationDisplay
        label="Block Quantity"
        value={calculateBlockQuantity()}
        calculated={true}
      />
    </FormSection>
    
    <FormSection title="Top Screed">
      <NumberInput
        label="Screed Thickness (mm)"
        min={40}
        max={75}
        defaultValue={50}
        tooltip="SANS minimum 40mm"
      />
      
      <Select
        label="Concrete Grade"
        options={['15MPa', '20MPa', '25MPa', '30MPa']}
        defaultValue="20MPa"
      />
      
      <Select
        label="Reinforcement"
        options={[
          'Ref 193 Mesh',
          'Ref 245 Mesh',
          'Steel Fibers',
          'Synthetic Fibers',
          'None (Not Recommended)'
        ]}
        defaultValue="Ref 193 Mesh"
      />
      
      {reinforcement.includes('Mesh') && (
        <NumberInput
          label="Mesh Overlap (mm)"
          min={300}
          defaultValue={300}
          tooltip="SANS minimum 300mm"
        />
      )}
      
      {reinforcement.includes('Fibers') && (
        <NumberInput
          label="Fiber Dosage (kg/m³)"
          min={3}
          max={6}
        />
      )}
      
      <CalculationDisplay
        label="Screed Volume (m³)"
        value={calculateScreedVolume()}
        calculated={true}
      />
    </FormSection>
    
    <FormSection title="Optional Structural Topping">
      <Checkbox
        label="Add Structural Topping Slab"
        tooltip="For additional strength or to span over beams"
      />
      
      {hasStructuralTopping && (
        <div>
          <NumberInput
            label="Topping Thickness (mm)"
            min={50}
            max={150}
          />
          
          <Select
            label="Concrete Grade"
            options={['25MPa', '30MPa', '40MPa']}
          />
          
          <RebarDesigner
            label="Topping Reinforcement"
            allowMultipleLayers={true}
          />
        </div>
      )}
    </FormSection>
    
    <SlabDesignSummary
      beams={beamSpec}
      blocks={blockSpec}
      screed={screedSpec}
      totalDepth={calculateTotalDepth()}
    />
  </FormGrid>
);
```

### Tab 3: Support Structure (Sleeper Walls)

```tsx
const SleeperWallsSupportForm = () => (
  <FormGrid>
    <FormSection title="Sleeper Wall Configuration">
      <Select
        label="Wall Thickness"
        options={[
          '115mm (Single Brick)',
          '140mm (Block)',
          '230mm (Double Brick)'
        ]}
        defaultValue="115mm"
      />
      
      <NumberInput
        label="Wall Height (mm)"
        min={300}
        max={1000}
        tooltip="From foundation top to beam soffit"
      />
      
      <NumberInput
        label="Wall Spacing (mm)"
        min={1200}
        max={2400}
        defaultValue={1800}
        tooltip="Maximum 2400mm for standard beams"
      />
      
      <CalculationDisplay
        label="Total Wall Length (m)"
        value={calculateSleeperWallLength()}
        calculated={true}
      />
    </FormSection>
    
    <FormSection title="Wall Construction">
      <Select
        label="Material"
        options={[
          'Clay Brick',
          'Concrete Block',
          'Reinforced Masonry'
        ]}
      />
      
      <Select
        label="Unit Strength"
        options={['7MPa', '10MPa', '14MPa']}
        defaultValue="7MPa"
      />
      
      <Select
        label="Mortar Type"
        options={[
          'Class I (1:3 cement:sand)',
          'Class II (1:4 cement:sand)',
          'Class III (1:6 cement:sand)'
        ]}
      />
      
      {material === 'Reinforced Masonry' && (
        <div>
          <h4>Vertical Reinforcement</h4>
          <Select
            label="Bar Size"
            options={['Y10', 'Y12', 'Y16']}
          />
          <NumberInput
            label="Spacing (mm)"
            min={400}
            max={1200}
          />
          <Checkbox
            label="Grouted Cores"
          />
          
          <h4>Horizontal Reinforcement</h4>
          <Select
            label="Type"
            options={['Brickforce', 'Ladder Reinforcement', 'None']}
          />
          <NumberInput
            label="Spacing (courses)"
            min={2}
            max={6}
          />
        </div>
      )}
    </FormSection>
    
    <FormSection title="Wall Foundation">
      <Select
        label="Foundation Type"
        options={[
          'Strip Footing',
          'Continuous Beam',
          'Pad Footings'
        ]}
        defaultValue="Strip Footing"
      />
      
      <NumberInput
        label="Foundation Width (mm)"
        min={450}
        max={900}
        step={50}
        defaultValue={450}
      />
      
      <NumberInput
        label="Foundation Depth (mm)"
        min={300}
        max={600}
        defaultValue={300}
      />
      
      <NumberInput
        label="Founding Level (mm below NGL)"
        min={450}
        max={1500}
        tooltip="Based on soil class"
      />
      
      <Select
        label="Concrete Grade"
        options={['20MPa', '25MPa']}
        defaultValue="20MPa"
      />
      
      <RebarDesigner
        label="Foundation Reinforcement"
        preset="strip_footing_minimum"
      />
    </FormSection>
    
    <FormSection title="Ventilation Openings in Walls">
      <NumberInput
        label="Opening Size (mm²)"
        min={5000}
        max={15000}
        defaultValue={13000}
        tooltip="Approximately 200x65mm"
      />
      
      <NumberInput
        label="Spacing (mm)"
        min={1200}
        max={2400}
        defaultValue={1800}
        tooltip="One per span recommended"
      />
      
      <Select
        label="Lintel Type"
        options={[
          'Precast Concrete (75x230)',
          'Cast-in-Place',
          'Steel Angle'
        ]}
      />
      
      <CalculationDisplay
        label="Number of Openings"
        value={calculateOpeningsQuantity()}
        calculated={true}
      />
    </FormSection>
    
    <FormSection title="Damp Proof Course">
      <Select
        label="DPC Type"
        options={[
          '375 micron Polythene',
          '500 micron Polythene',
          'Bituminous DPC',
          'Torch-on Membrane'
        ]}
        defaultValue="375 micron"
      />
      
      <MultiSelect
        label="DPC Location"
        options={[
          'Under slab/beam bearing',
          'On top of wall',
          'Both'
        ]}
      />
      
      <NumberInput
        label="DPC Width (mm)"
        min={230}
        max={450}
      />
    </FormSection>
  </FormGrid>
);
```

### Tab 4: Ventilation Design

```tsx
const VentilationDesignForm = () => (
  <FormGrid>
    <Alert variant="info">
      SANS 10400-H requires minimum 1500mm² ventilation per 100m² floor area
    </Alert>
    
    <FormSection title="Ventilation Calculation">
      <CalculationDisplay
        label="Floor Area"
        value={floorArea}
        unit="m²"
        calculated={true}
      />
      
      <CalculationDisplay
        label="SANS Required Vent Area"
        value={floorArea * 15}
        unit="mm²"
        calculated={true}
        tooltip="1500mm² per 100m² = 15mm² per m²"
      />
      
      <NumberInput
        label="Provided Vent Area (mm²)"
        min={0}
        value={calculateProvidedVentArea()}
        readOnly={true}
        calculated={true}
      />
      
      <ValidationBadge
        pass={providedVentArea >= requiredVentArea}
        message={
          providedVentArea >= requiredVentArea
            ? 'Ventilation adequate'
            : 'INCREASE VENTILATION AREA'
        }
      />
      
      {providedVentArea < requiredVentArea && (
        <Alert variant="warning">
          Shortfall: {requiredVentArea - providedVentArea} mm²
        </Alert>
      )}
    </FormSection>
    
    <FormSection title="Air Bricks (Perimeter)">
      <Select
        label="Air Brick Type"
        options={[
          'Standard Clay (215x65mm)',
          'Terracotta (215x65mm)',
          'Plastic (215x65mm)',
          'Custom Size'
        ]}
      />
      
      {airBrickType === 'Custom' && (
        <div>
          <NumberInput label="Width (mm)" />
          <NumberInput label="Height (mm)" />
        </div>
      )}
      
      <NumberInput
        label="Free Area per Brick (mm²)"
        min={8000}
        max={15000}
        defaultValue={11000}
        tooltip="Effective ventilation area (not overall size)"
      />
      
      <NumberInput
        label="Quantity"
        min={4}
        onChange={handleAirBrickQuantityChange}
      />
      
      <NumberInput
        label="Spacing Around Perimeter (mm)"
        min={1000}
        max={4000}
        calculated={true}
        readOnly={true}
        value={calculateAirBrickSpacing()}
        tooltip="Perimeter / quantity"
      />
      
      <ValidationBadge
        pass={airBrickSpacing <= 3000}
        message={
          airBrickSpacing <= 3000
            ? 'Spacing adequate'
            : 'Reduce spacing (max 3000mm)'
        }
      />
    </FormSection>
    
    <FormSection title="Sleeper Wall Openings">
      <Checkbox
        label="Include Openings in Sleeper Walls"
        defaultChecked={true}
        tooltip="Allows air circulation between support bays"
      />
      
      {hasSleeperOpenings && (
        <div>
          <NumberInput
            label="Opening Size (mm²)"
            defaultValue={13000}
          />
          
          <NumberInput
            label="Openings per Wall"
            min={1}
            max={3}
          />
          
          <CalculationDisplay
            label="Total Additional Vent Area"
            value={calculateSleeperVentArea()}
            unit="mm²"
            calculated={true}
          />
        </div>
      )}
    </FormSection>
    
    <FormSection title="Mechanical Ventilation (Optional)">
      <Checkbox
        label="Include Mechanical Ventilation"
        tooltip="For areas with poor natural ventilation"
      />
      
      {hasMechanicalVent && (
        <div>
          <NumberInput
            label="Fan Capacity (m³/hr)"
            min={50}
            max={500}
          />
          
          <NumberInput
            label="Number of Fans"
            min={1}
            max={4}
          />
          
          <Select
            label="Fan Type"
            options={[
              'Inline Extract Fan',
              'Wall Mounted Fan',
              'Solar Powered'
            ]}
          />
          
          <TextArea
            label="Fan Locations"
            placeholder="Describe fan placement..."
          />
        </div>
      )}
    </FormSection>
    
    <VentilationSummary
      required={requiredVentArea}
      provided={providedVentArea}
      airBricks={airBrickSpec}
      openings={sleeperOpeningSpec}
      mechanical={mechanicalVentSpec}
      compliant={isCompliant}
    />
  </FormGrid>
);
```

### Tab 5: Underfloor Treatment

```tsx
const UnderfloorTreatmentForm = () => (
  <FormGrid>
    <FormSection title="Underfloor Treatment Strategy">
      <MultiSelect
        label="Treatment Types"
        options={[
          'Soil Poison (Termite Treatment)',
          'Polythene Membrane',
          'Concrete Oversite',
          'Perimeter Drainage',
          'None (Not Recommended)'
        ]}
        defaultValue={['Soil Poison', 'Polythene Membrane']}
      />
    </FormSection>
    
    <FormSection title="Soil Poison Treatment">
      <Alert variant="warning">
        Termite treatment mandatory in termite-prone areas
      </Alert>
      
      <Checkbox
        label="Soil Poison Required"
        defaultChecked={true}
      />
      
      {soilPoisonRequired && (
        <div>
          <TextInput
            label="Product Name"
            placeholder="e.g., Termidor, Premise"
          />
          
          <NumberInput
            label="Coverage Area (m²)"
            value={floorArea}
            readOnly={true}
          />
          
          <TextInput
            label="Concentration"
            placeholder="e.g., 0.06%"
          />
          
          <Select
            label="Application Method"
            options={[
              'Pre-construction (before slab)',
              'Post-construction (perimeter)',
              'Combined'
            ]}
          />
          
          <Checkbox
            label="Treatment Certification Required"
            defaultChecked={true}
          />
          
          <NumberInput
            label="Warranty Period (years)"
            min={5}
            max={20}
          />
        </div>
      )}
    </FormSection>
    
    <FormSection title="Polythene Membrane">
      <Select
        label="Membrane Type"
        options={[
          '250 micron Polythene',
          '375 micron Polythene',
          '500 micron Heavy Duty',
          'Reinforced Membrane',
          'Geotextile',
          'Vapour Barrier'
        ]}
      />
      
      <NumberInput
        label="Coverage Area (m²)"
        value={floorArea}
        tooltip="Total floor area"
      />
      
      <NumberInput
        label="Overlap (mm)"
        min={150}
        max={500}
        defaultValue={300}
        tooltip="SANS minimum 150mm"
      />
      
      <CalculationDisplay
        label="Total Membrane Area (with overlap)"
        value={calculateMembraneArea()}
        unit="m²"
        calculated={true}
      />
      
      <Checkbox
        label="Seal Laps with Tape"
        defaultChecked={true}
      />
    </FormSection>
    
    <FormSection title="Concrete Oversite (Optional)">
      <Alert variant="info">
        Concrete oversite provides additional structural support and damp protection
      </Alert>
      
      <Checkbox
        label="Include Concrete Oversite"
        tooltip="50-75mm unreinforced concrete over ground"
      />
      
      {hasOversite && (
        <div>
          <NumberInput
            label="Oversite Thickness (mm)"
            min={50}
            max={100}
            defaultValue={75}
          />
          
          <Select
            label="Concrete Grade"
            options={['15MPa', '20MPa']}
            defaultValue="15MPa"
          />
          
          <Checkbox
            label="Include Reinforcement Mesh"
          />
          
          {oversiteReinforcement && (
            <Select
              label="Mesh Type"
              options={['Ref 193', 'Ref 245']}
            />
          )}
          
          <CalculationDisplay
            label="Oversite Volume (m³)"
            value={calculateOversiteVolume()}
            calculated={true}
          />
          
          <Select
            label="Purpose"
            options={[
              'Structural (load bearing)',
              'Damp proofing',
              'Finish surface',
              'Combined'
            ]}
          />
        </div>
      )}
    </FormSection>
    
    <FormSection title="Drainage (Optional)">
      <Checkbox
        label="Include Underfloor Drainage"
        tooltip="For sites with high water table or poor drainage"
      />
      
      {hasDrainage && (
        <div>
          <Select
            label="Drainage Type"
            options={[
              'Perimeter Drain',
              'Internal Drainage System',
              'Sump with Pump',
              'Combined'
            ]}
          />
          
          <NumberInput
            label="Drain Pipe Diameter (mm)"
            options={[75, 110, 160]}
            defaultValue={110}
          />
          
          <NumberInput
            label="Total Drain Length (m)"
          />
          
          <TextArea
            label="Drainage Layout Description"
            placeholder="Describe drain routing and discharge point..."
          />
        </div>
      )}
    </FormSection>
    
    <UnderfloorTreatmentSummary
      soilPoison={soilPoisonSpec}
      membrane={membraneSpec}
      oversite={oversiteSpec}
      drainage={drainageSpec}
    />
  </FormGrid>
);
```

### Tab 6: Services Routing

```tsx
const ServicesRoutingForm = () => (
  <FormGrid>
    <Alert variant="info">
      Services routed through subfloor void must be accessible and properly supported
    </Alert>
    
    <FormSection title="Drainage System">
      <h4>Main Drain Pipes</h4>
      
      <DynamicList
        label="Drainage Pipes"
        addButtonText="+ Add Drain Pipe"
        items={drainagePipes}
        renderItem={(pipe, index) => (
          <div key={index}>
            <NumberInput
              label="Diameter (mm)"
              options={[75, 110, 160]}
            />
            
            <Select
              label="Material"
              options={['uPVC', 'PVC']}
            />
            
            <NumberInput
              label="Length (m)"
            />
            
            <NumberInput
              label="Gradient (%)"
              min={1}
              max={4}
              step={0.1}
              defaultValue={1}
              tooltip="SANS minimum 1:100 (1%)"
            />
            
            <Checkbox
              label="Suspended (on hangers)"
              tooltip="vs. laid on ground"
            />
            
            <TextInput
              label="Route Description"
              placeholder="e.g., Kitchen to main drain"
            />
          </div>
        )}
      />
      
      <h4>Inspection Chambers</h4>
      
      <NumberInput
        label="Number of Chambers"
        min={1}
        max={10}
      />
      
      <Select
        label="Chamber Size"
        options={[
          '300x300mm',
          '450x450mm',
          '600x600mm',
          '900x900mm'
        ]}
      />
      
      <NumberInput
        label="Average Chamber Depth (mm)"
        min={300}
        max={1200}
      />
      
      <TextArea
        label="Chamber Locations"
        placeholder="Describe inspection chamber positions..."
      />
    </FormSection>
    
    <FormSection title="Water Supply">
      <h4>Water Pipes</h4>
      
      <DynamicList
        label="Water Supply Pipes"
        addButtonText="+ Add Water Pipe"
        items={waterPipes}
        renderItem={(pipe, index) => (
          <div key={index}>
            <NumberInput
              label="Diameter (mm)"
              options={[15, 20, 25, 32, 40, 50]}
            />
            
            <Select
              label="Material"
              options={[
                'Copper',
                'PEX (Cross-linked Polyethylene)',
                'HDPE',
                'Multilayer Composite'
              ]}
            />
            
            <NumberInput
              label="Length (m)"
            />
            
            <Checkbox
              label="Insulation Required"
              tooltip="For areas with freezing risk"
            />
            
            <TextInput
              label="Route Description"
              placeholder="e.g., Main supply to bathrooms"
            />
          </div>
        )}
      />
      
      <h4>Sleeves Through Walls/Beams</h4>
      
      <NumberInput
        label="Number of Sleeves"
        min={0}
      />
      
      <NumberInput
        label="Typical Sleeve Diameter (mm)"
        min={50}
        max={150}
      />
      
      <TextArea
        label="Sleeve Locations"
        placeholder="Describe where pipes penetrate structure..."
      />
    </FormSection>
    
    <FormSection title="Electrical Conduits">
      <h4>Conduit Runs</h4>
      
      <DynamicList
        label="Electrical Conduits"
        addButtonText="+ Add Conduit"
        items={electricalConduits}
        renderItem={(conduit, index) => (
          <div key={index}>
            <NumberInput
              label="Diameter (mm)"
              options={[20, 25, 32, 40, 50]}
            />
            
            <Select
              label="Material"
              options={[
                'PVC (Light Duty)',
                'PVC (Heavy Duty)',
                'Galvanised Steel'
              ]}
            />
            
            <NumberInput
              label="Length (m)"
            />
            
            <TextInput
              label="Circuit Description"
              placeholder="e.g., DB to kitchen sockets"
            />
          </div>
        )}
      />
      
      <h4>Junction Boxes</h4>
      
      <NumberInput
        label="Number of Junction Boxes"
        min={0}
      />
      
      <TextArea
        label="Junction Box Locations"
        placeholder="Describe junction box positions..."
      />
    </FormSection>
    
    <FormSection title="Access and Maintenance">
      <Alert variant="warning">
        All services must be accessible for maintenance and repairs
      </Alert>
      
      <Checkbox
        label="Accessible Underfloor Space (300mm+ clearance)"
        checked={underfloorClearance >= 300}
        disabled={true}
      />
      
      <Checkbox
        label="Services Supported on Hangers"
      />
      
      <Checkbox
        label="Services Grouped for Easy Access"
      />
      
      <Checkbox
        label="Access Hatches Provided"
      />
      
      {hasAccessHatches && (
        <div>
          <NumberInput
            label="Number of Access Hatches"
            min={1}
          />
          
          <Select
            label="Hatch Size"
            options={[
              '450x450mm',
              '600x600mm',
              '900x600mm'
            ]}
          />
        </div>
      )}
    </FormSection>
    
    <ServicesRoutingSummary
      drainage={drainageSpec}
      water={waterSpec}
      electrical={electricalSpec}
      access={accessSpec}
    />
  </FormGrid>
);
```

### Tab 7: Loading & Structural Analysis

```tsx
const StructuralAnalysisForm = () => (
  <FormGrid>
    <FormSection title="Design Loads">
      <NumberInput
        label="Dead Load (kN/m²)"
        min={0}
        step={0.1}
        tooltip="Self weight of slab, screed, finishes, partitions"
      />
      
      <NumberInput
        label="Live Load (kN/m²)"
        min={1.5}
        max={5.0}
        defaultValue={1.5}
        tooltip="SANS 10160: Residential 1.5 kN/m², Offices 2.5 kN/m²"
      />
      
      <NumberInput
        label="Load Factor"
        min={1.2}
        max={1.6}
        step={0.1}
        defaultValue={1.4}
        tooltip="Ultimate limit state load factor"
      />
      
      <CalculationDisplay
        label="Total Design Load (kN/m²)"
        value={calculateTotalDesignLoad()}
        calculated={true}
        formula="(DL + LL) × Load Factor"
      />
    </FormSection>
    
    <FormSection title="Span Analysis">
      <CalculationDisplay
        label="Maximum Span (mm)"
        value={maxSpan}
        calculated={true}
      />
      
      <NumberInput
        label="Allowable Deflection Ratio"
        options={['L/250', 'L/300', 'L/360', 'L/500']}
        defaultValue="L/360"
        tooltip="SANS 10100: L/360 for floors with brittle finishes"
      />
      
      <CalculationDisplay
        label="Maximum Allowable Deflection (mm)"
        value={maxSpan / 360}
        calculated={true}
      />
      
      <NumberInput
        label="Calculated Deflection (mm)"
        tooltip="From structural analysis or manufacturer data"
      />
      
      <ValidationBadge
        pass={calculatedDeflection <= allowableDeflection}
        message={
          calculatedDeflection <= allowableDeflection
            ? 'Deflection acceptable'
            : 'DEFLECTION EXCEEDS LIMIT - REDUCE SPAN OR INCREASE DEPTH'
        }
      />
    </FormSection>
    
    <FormSection title="Bearing Analysis">
      <NumberInput
        label="Applied Bearing Pressure (kPa)"
        tooltip="Load on support / bearing area"
      />
      
      <NumberInput
        label="Allowable Bearing Pressure (kPa)"
        tooltip="From soil report or support capacity"
      />
      
      <CalculationDisplay
        label="Safety Factor"
        value={allowableBearing / appliedBearing}
        calculated={true}
      />
      
      <ValidationBadge
        pass={allowableBearing / appliedBearing >= 1.5}
        message={
          allowableBearing / appliedBearing >= 1.5
            ? 'Bearing capacity adequate (SF ≥ 1.5)'
            : 'INSUFFICIENT BEARING CAPACITY'
        }
      />
    </FormSection>
    
    <FormSection title="Design Calculations">
      <TextArea
        label="Load Calculation Summary"
        rows={4}
        placeholder="Document load sources, assumptions, and calculations..."
      />
      
      <TextArea
        label="Span/Deflection Analysis"
        rows={4}
        placeholder="Document span capacity, deflection checks, and member sizing..."
      />
      
      <TextArea
        label="Bearing/Support Analysis"
        rows={4}
        placeholder="Document bearing pressures, support sizing, and foundation adequacy..."
      />
      
      <FileUpload
        label="Attach Calculation Sheets (PDF)"
        accept=".pdf"
        multiple={true}
      />
      
      <TextInput
        label="Calculation Reference Number"
        placeholder="e.g., CALC-SUB-001"
      />
    </FormSection>
    
    <FormSection title="Special Considerations">
      <TextArea
        label="Special Requirements"
        rows={3}
        placeholder="e.g., Point loads, equipment loads, access requirements..."
      />
      
      <TextArea
        label="Construction Sequence Notes"
        rows={3}
        placeholder="Critical construction steps and sequencing..."
      />
      
      <TextArea
        label="Quality Control Requirements"
        rows={3}
        placeholder="Testing, inspection, and acceptance criteria..."
      />
    </FormSection>
  </FormGrid>
);
```

### Tab 8: SANS Compliance

```tsx
const SubfloorSANSComplianceTab = () => (
  <FormGrid>
    <ComplianceCheckList
      checks={[
        {
          rule: 'Underfloor Clearance',
          standard: 'SANS 10400-H',
          requirement: 'Minimum 150mm',
          actual: `${underfloorClearance}mm`,
          status: underfloorClearance >= 150 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Ventilation Area',
          standard: 'SANS 10400-H',
          requirement: `${floorArea * 15}mm² (1500mm²/100m²)`,
          actual: `${providedVentArea}mm²`,
          status: providedVentArea >= (floorArea * 15) ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Air Brick Spacing',
          standard: 'SANS 10400-H',
          requirement: 'Maximum 3000mm between vents',
          actual: `${airBrickSpacing}mm`,
          status: airBrickSpacing <= 3000 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Sleeper Wall Thickness',
          standard: 'SANS 10400',
          requirement: 'Minimum 115mm',
          actual: `${sleeperWallThickness}mm`,
          status: sleeperWallThickness >= 115 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Sleeper Wall Spacing',
          standard: 'Structural Design',
          requirement: 'Maximum per beam capacity',
          actual: `${sleeperWallSpacing}mm`,
          status: validateSleeperSpacing() ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'DPC Provision',
          standard: 'SANS 10400-H',
          requirement: 'DPC required on all masonry',
          actual: hasDPC ? 'Provided' : 'Not provided',
          status: hasDPC ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'DPM Overlap',
          standard: 'SANS 10400-H',
          requirement: 'Minimum 150mm',
          actual: `${dpmOverlap}mm`,
          status: dpmOverlap >= 150 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Screed Thickness',
          standard: 'SANS 2001-CC1',
          requirement: 'Minimum 40mm',
          actual: `${screedThickness}mm`,
          status: screedThickness >= 40 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Deflection Limit',
          standard: 'SANS 10100',
          requirement: 'L/360 max (brittle finishes)',
          actual: `L/${maxSpan/calculatedDeflection}`,
          status: (maxSpan/calculatedDeflection) >= 360 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Bearing Safety Factor',
          standard: 'SANS 10400-H',
          requirement: 'SF ≥ 1.5',
          actual: `SF = ${bearingSafetyFactor.toFixed(2)}`,
          status: bearingSafetyFactor >= 1.5 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Drainage Gradient',
          standard: 'SANS 10252',
          requirement: 'Minimum 1:100 (1%)',
          actual: `${drainageGradient}%`,
          status: drainageGradient >= 1 ? 'pass' : 'fail',
          override: false
        },
        {
          rule: 'Termite Treatment',
          standard: 'SANS 10400-H',
          requirement: 'Required in termite areas',
          actual: hasTermiteTreatment ? 'Provided' : 'Not provided',
          status: hasTermiteTreatment ? 'pass' : 'fail',
          override: false
        }
      ]}
    />
    
    <FormSection title="Compliance Overrides">
      <Alert variant="warning" show={hasOverrides}>
        Engineer override requires detailed justification and professional signature
      </Alert>
      
      {failedChecks.map(check => (
        <OverrideControl
          key={check.rule}
          check={check}
          onOverride={(reason) => handleOverride(check, reason)}
        >
          <TextArea
            label={`Justification for ${check.rule} Override`}
            required={true}
            placeholder="Provide detailed engineering justification..."
          />
        </OverrideControl>
      ))}
    </FormSection>
    
    <FormSection title="Referenced Standards">
      <CheckboxGroup
        label="Applicable SANS Standards"
        options={[
          'SANS 10400-H (Foundation and Floors)',
          'SANS 10160 (Loading)',
          'SANS 10100 (Structural Concrete)',
          'SANS 10252 (Drainage)',
          'SANS 2001-CC1 (Concrete Mix)',
          'SANS 920 (Steel Reinforcement)',
          'SANS 227 (Masonry)'
        ]}
        defaultChecked={[
          'SANS 10400-H',
          'SANS 10160',
          'SANS 10100'
        ]}
      />
    </FormSection>
    
    <FormSection title="Drawing References">
      <TextInput
        label="Foundation Detail Drawing"
        placeholder="e.g., DRG-FND-001"
      />
      
      <TextInput
        label="Subfloor Plan Drawing"
        placeholder="e.g., DRG-SUB-001"
      />
      
      <TextInput
        label="Section Detail Drawing"
        placeholder="e.g., DRG-SEC-001"
      />
      
      <TextInput
        label="Services Layout Drawing"
        placeholder="e.g., DRG-SVC-001"
      />
    </FormSection>
  </FormGrid>
);
```

### Tab 9: Engineer Signature

```tsx
// Same as Foundation Volume VII Tab 6
// Identical signature requirements and process
```

---

# 10. Subfloor BOQ Generation

## 10.1 Complete BOQ Structure

```ts
interface SubfloorBOQ {
  foundations: BOQSection;      // Strip footings for sleeper walls/columns
  sleeperWalls: BOQSection;     // Masonry walls
  columns: BOQSection;          // If beam-column system
  beams: BOQSection;            // Ground beams and suspended beams
  slab: BOQSection;             // Beams, blocks, screed, or hollow core
  dampProofing: BOQSection;     // DPC and DPM
  underfloor: BOQSection;       // Oversite, membrane, soil poison
  ventilation: BOQSection;      // Air bricks and openings
  services: BOQSection;         // Drainage, water, electrical
  finishes: BOQSection;         // Top screed, curing
  testing: BOQSection;          // Cube tests, compaction tests
  totalCost: number;
}
```

## 10.2 Standard Mode BOQ Example

```ts
function generateStandardSubfloorBOQ(
  subfloor: StandardBeamAndBlock
): SubfloorBOQ {
  const boq: SubfloorBOQ = {
    foundations: generateFoundationsBOQ(subfloor.support.foundations),
    sleeperWalls: generateSleeperWallsBOQ(subfloor.support.walls),
    columns: { items: [], totalCost: 0 }, // Not applicable
    beams: generateBeamsBOQ(subfloor.slab.beams),
    slab: generateSlabBOQ(subfloor.slab),
    dampProofing: generateDampProofingBOQ(subfloor.support.dampProofing),
    underfloor: generateUnderfloorBOQ(subfloor.underfloor),
    ventilation: generateVentilationBOQ(subfloor.ventilation),
    services: { items: [], totalCost: 0 }, // Minimal in standard
    finishes: generateFinishesBOQ(subfloor.slab.screed),
    testing: generateTestingBOQ(subfloor),
    totalCost: 0
  };
  
  // Calculate total
  boq.totalCost = Object.values(boq)
    .filter(section => typeof section === 'object' && 'totalCost' in section)
    .reduce((sum, section) => sum + section.totalCost, 0);
  
  return boq;
}

function generateBeamsBOQ(beamSpec: any): BOQSection {
  const items: BOQItem[] = [];
  
  // Prestressed beams (supplied and installed)
  items.push({
    code: 'SUB-BEAM-001',
    description: `${beamSpec.size} prestressed concrete beams`,
    unit: 'no',
    quantity: beamSpec.quantity,
    wastage: 2, // Minimal wastage for prestressed
    totalQuantity: beamSpec.quantity * 1.02,
    unitRate: getBeamRate(beamSpec.size),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Beam installation/crane hire
  if (beamSpec.quantity > 20) {
    items.push({
      code: 'SUB-PLT-001',
      description: 'Crane hire for beam installation',
      unit: 'day',
      quantity: Math.ceil(beamSpec.quantity / 40), // 40 beams per day
      wastage: 0,
      totalQuantity: Math.ceil(beamSpec.quantity / 40),
      unitRate: getCraneHireRate(),
      totalCost: 0,
      designMode: 'standard'
    });
  }
  
  // Calculate totals
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}

function generateSlabBOQ(slabSpec: any): BOQSection {
  const items: BOQItem[] = [];
  
  // Hollow blocks
  items.push({
    code: 'SUB-BLK-001',
    description: `${slabSpec.blocks.size} hollow concrete blocks`,
    unit: 'no',
    quantity: slabSpec.blocks.quantity,
    wastage: 5, // 5% breakage
    totalQuantity: slabSpec.blocks.quantity * 1.05,
    unitRate: getBlockRate(slabSpec.blocks.size),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Screed concrete
  items.push({
    code: 'SUB-SCR-001',
    description: `${slabSpec.screed.grade} screed concrete`,
    unit: 'm³',
    quantity: slabSpec.screed.volume,
    wastage: 7.5,
    totalQuantity: slabSpec.screed.volume * 1.075,
    unitRate: getConcreteRate(slabSpec.screed.grade),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Screed mesh
  const screedArea = slabSpec.screed.volume / (slabSpec.screed.thickness / 1000);
  
  items.push({
    code: 'SUB-MSH-001',
    description: `${slabSpec.screed.reinforcement} welded mesh`,
    unit: 'm²',
    quantity: screedArea,
    wastage: 10, // 10% for overlap
    totalQuantity: screedArea * 1.1,
    unitRate: getMeshRate(slabSpec.screed.reinforcement),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Mesh chairs/spacers
  items.push({
    code: 'SUB-ACC-001',
    description: 'Mesh chairs/spacers',
    unit: 'no',
    quantity: Math.ceil(screedArea * 4), // 4 per m²
    wastage: 10,
    totalQuantity: Math.ceil(screedArea * 4) * 1.1,
    unitRate: getChairRate(),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Power float finish
  items.push({
    code: 'SUB-FIN-001',
    description: 'Power float finish to screed',
    unit: 'm²',
    quantity: screedArea,
    wastage: 0,
    totalQuantity: screedArea,
    unitRate: getPowerFloatRate(),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Curing compound
  items.push({
    code: 'SUB-CUR-001',
    description: 'Curing compound',
    unit: 'm²',
    quantity: screedArea,
    wastage: 10,
    totalQuantity: screedArea * 1.1,
    unitRate: getCuringCompoundRate(),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Calculate totals
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}

function generateVentilationBOQ(ventSpec: any): BOQSection {
  const items: BOQItem[] = [];
  
  // Air bricks
  items.push({
    code: 'SUB-VNT-001',
    description: `${ventSpec.airBricks.size} clay air bricks`,
    unit: 'no',
    quantity: ventSpec.airBricks.quantity,
    wastage: 5,
    totalQuantity: ventSpec.airBricks.quantity * 1.05,
    unitRate: getAirBrickRate(ventSpec.airBricks.size),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Lintels for sleeper wall openings
  items.push({
    code: 'SUB-LNT-001',
    description: 'Precast lintels for sleeper wall openings',
    unit: 'no',
    quantity: ventSpec.wallOpenings.quantity,
    wastage: 2,
    totalQuantity: ventSpec.wallOpenings.quantity * 1.02,
    unitRate: getLintelRate('75x230'),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Calculate totals
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}

function generateUnderfloorBOQ(underfloorSpec: any): BOQSection {
  const items: BOQItem[] = [];
  
  // Soil poison
  if (underfloorSpec.soilPoison.required) {
    items.push({
      code: 'SUB-PSN-001',
      description: `${underfloorSpec.soilPoison.product} termite treatment`,
      unit: 'm²',
      quantity: underfloorSpec.soilPoison.coverage,
      wastage: 0,
      totalQuantity: underfloorSpec.soilPoison.coverage,
      unitRate: getSoilPoisonRate(),
      totalCost: 0,
      designMode: 'standard'
    });
    
    items.push({
      code: 'SUB-PSN-002',
      description: 'Termite treatment certification',
      unit: 'no',
      quantity: 1,
      wastage: 0,
      totalQuantity: 1,
      unitRate: getCertificationRate(),
      totalCost: 0,
      designMode: 'standard'
    });
  }
  
  // Polythene membrane
  items.push({
    code: 'SUB-MEM-001',
    description: `${underfloorSpec.membrane.thickness} polythene membrane`,
    unit: 'm²',
    quantity: underfloorSpec.membrane.area,
    wastage: 0, // Already included overlap in calculation
    totalQuantity: underfloorSpec.membrane.area,
    unitRate: getMembraneRate(underfloorSpec.membrane.thickness),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Sealing tape
  items.push({
    code: 'SUB-MEM-002',
    description: 'Membrane sealing tape',
    unit: 'm',
    quantity: calculateTapeLength(underfloorSpec.membrane.area),
    wastage: 10,
    totalQuantity: calculateTapeLength(underfloorSpec.membrane.area) * 1.1,
    unitRate: getTapeRate(),
    totalCost: 0,
    designMode: 'standard'
  });
  
  // Calculate totals
  items.forEach(item => {
    item.totalCost = item.totalQuantity * item.unitRate;
  });
  
  return {
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0)
  };
}
```

## 10.3 Engineer Mode BOQ Example

```ts
function generateEngineerSubfloorBOQ(
  subfloor: EngineerBeamAndBlock
): SubfloorBOQ {
  // Similar structure but with custom specifications
  
  const boq: SubfloorBOQ = {
    foundations: generateEngineerFoundationsBOQ(
      subfloor.support.sleeperWalls.foundation
    ),
    sleeperWalls: generateEngineerSleeperWallsBOQ(
      subfloor.support.sleeperWalls
    ),
    columns: subfloor.support.beamAndColumn 
      ? generateColumnsBOQ(subfloor.support.beamAndColumn.columns)
      : { items: [], totalCost: 0 },
    beams: generateEngineerBeamsBOQ(subfloor.slab.beams),
    slab: generateEngineerSlabBOQ(subfloor.slab),
    dampProofing: generateEngineerDampProofingBOQ(
      subfloor.support.sleeperWalls.dampProofing
    ),
    underfloor: generateEngineerUnderfloorBOQ(subfloor.underfloor),
    ventilation: generateEngineerVentilationBOQ(subfloor.ventilation),
    services: generateServicesBOQ(subfloor.services),
    finishes: generateEngineerFinishesBOQ(subfloor.slab.screed),
    testing: generateEngineerTestingBOQ(subfloor),
    totalCost: 0
  };
  
  // Mark all items as engineer-designed
  Object.values(boq).forEach(section => {
    if (section.items) {
      section.items.forEach(item => {
        item.designMode = 'engineer';
        item.engineerRef = subfloor.engineerSignature.registrationNumber;
        item.customSpecification = true;
      });
    }
  });
  
  // Calculate total
  boq.totalCost = Object.values(boq)
    .filter(section => typeof section === 'object' && 'totalCost' in section)
    .reduce((sum, section) => sum + section.totalCost, 0);
  
  return boq;
}
```

---

# 11. Drawing Generation

## 11.1 Subfloor Plan View

```ts
function renderSubfloorPlan(subfloor: SubfloorSystem): SVGElement[] {
  const elements: SVGElement[] = [];
  
  // Floor outline
  elements.push({
    type: 'polygon',
    points: subfloor.polygon,
    stroke: '#000000',
    strokeWidth: 3,
    fill: 'none'
  });
  
  // Sleeper walls (dashed)
  subfloor.support.sleeperWalls?.forEach(wall => {
    elements.push({
      type: 'line',
      start: wall.start,
      end: wall.end,
      stroke: '#000000',
      strokeWidth: wall.thickness / scale,
      dashArray: [10, 5] // Dashed for subfloor elements
    });
    
    // Ventilation openings in walls
    wall.ventilationOpenings.forEach(opening => {
      elements.push({
        type: 'rect',
        position: opening.position,
        width: 200,
        height: 65,
        stroke: '#666666',
        fill: 'none'
      });
    });
  });
  
  // Beams (if visible in plan)
  if (showBeamsInPlan) {
    subfloor.slab.beams.forEach(beam => {
      elements.push({
        type: 'line',
        start: beam.geometry.position.start,
        end: beam.geometry.position.end,
        stroke: '#000000',
        strokeWidth: 1,
        dashArray: [5, 5]
      });
    });
  }
  
  // Air bricks (perimeter)
  subfloor.ventilation.airBricks.forEach(brick => {
    elements.push({
      type: 'rect',
      position: brick.position,
      width: 215,
      height: 65,
      stroke: '#000000',
      fill: '#cccccc'
    });
    
    // Air brick symbol
    elements.push({
      type: 'text',
      position: brick.position,
      content: 'AB',
      fontSize: 8,
      fontWeight: 'bold'
    });
  });
  
  // Dimensions
  elements.push(...generateSubfloorDimensions(subfloor));
  
  // Notes and labels
  elements.push({
    type: 'text',
    position: { x: 100, y: -50 },
    content: 'SUSPENDED FLOOR PLAN',
    fontSize: 12,
    fontWeight: 'bold'
  });
  
  elements.push({
    type: 'text',
    position: { x: 100, y: -30 },
    content: `System: ${subfloor.systemType}`,
    fontSize: 8
  });
  
  elements.push({
    type: 'text',
    position: { x: 100, y: -15 },
    content: `FFL: +${subfloor.levels.finishedFloorLevel}mm`,
    fontSize: 8
  });
  
  return elements;
}
```

## 11.2 Subfloor Section View

```ts
function renderSubfloorSection(
  subfloor: SubfloorSystem,
  sectionPlane: Plane
): SVGElement[] {
  const elements: SVGElement[] = [];
  
  // Natural ground level line
  elements.push({
    type: 'line',
    start: { x: 0, y: 0 },
    end: { x: 10000, y: 0 },
    stroke: '#000000',
    strokeWidth: 1
  });
  
  elements.push({
    type: 'text',
    position: { x: -200, y: 5 },
    content: 'NGL',
    fontSize: 8
  });
  
  // Foundation
  const foundationY = -subfloor.support.sleeperWalls.foundation.foundingLevel;
  
  elements.push({
    type: 'rect',
    position: { x: 0, y: foundationY },
    width: subfloor.support.sleeperWalls.foundation.width,
    height: subfloor.support.sleeperWalls.foundation.depth,
    stroke: '#000000',
    strokeWidth: 4,
    fill: 'url(#concrete-hatch)'
  });
  
  // Sleeper wall
  const wallY = foundationY + subfloor.support.sleeperWalls.foundation.depth;
  
  elements.push({
    type: 'rect',
    position: { x: (subfloor.support.sleeperWalls.foundation.width - subfloor.support.sleeperWalls.thickness) / 2, y: wallY },
    width: subfloor.support.sleeperWalls.thickness,
    height: subfloor.support.sleeperWalls.height,
    stroke: '#000000',
    strokeWidth: 3,
    fill: 'url(#brick-hatch)'
  });
  
  // DPC
  elements.push({
    type: 'line',
    start: { x: 0, y: wallY },
    end: { x: subfloor.support.sleeperWalls.foundation.width, y: wallY },
    stroke: '#FF0000',
    strokeWidth: 2,
    dashArray: [10, 5]
  });
  
  elements.push({
    type: 'text',
    position: { x: subfloor.support.sleeperWalls.foundation.width + 20, y: wallY },
    content: 'DPC',
    fontSize: 6,
    fill: '#FF0000'
  });
  
  // Beam
  const beamY = wallY + subfloor.support.sleeperWalls.height;
  
  elements.push({
    type: 'rect',
    position: { x: 0, y: beamY },
    width: subfloor.slab.beams.prestressed.size === '140mm' ? 140 : 200,
    height: 140,
    stroke: '#000000',
    strokeWidth: 2,
    fill: 'url(#concrete-hatch)'
  });
  
  // Blocks
  const blockY = beamY;
  
  for (let i = 1; i < 3; i++) {
    elements.push({
      type: 'rect',
      position: { x: 140 + (i * 390), y: blockY },
      width: 390,
      height: 190,
      stroke: '#000000',
      strokeWidth: 1,
      fill: 'url(#block-hatch)'
    });
  }
  
  // Screed
  const screedY = beamY + 190;
  
  elements.push({
    type: 'rect',
    position: { x: 0, y: screedY },
    width: 5000,
    height: subfloor.slab.screed.thickness,
    stroke: '#000000',
    strokeWidth: 2,
    fill: 'url(#concrete-hatch-light)'
  });
  
  // Mesh in screed
  elements.push({
    type: 'line',
    start: { x: 0, y: screedY + 25 },
    end: { x: 5000, y: screedY + 25 },
    stroke: '#000000',
    strokeWidth: 0.5,
    dashArray: [2, 2]
  });
  
  // Finished floor level line
  const fflY = screedY + subfloor.slab.screed.thickness;
  
  elements.push({
    type: 'line',
    start: { x: -500, y: fflY },
    end: { x: 5500, y: fflY },
    stroke: '#0000FF',
    strokeWidth: 1,
    dashArray: [15, 5]
  });
  
  elements.push({
    type: 'text',
    position: { x: -200, y: fflY - 5 },
    content: 'FFL',
    fontSize: 8,
    fill: '#0000FF'
  });
  
  // Underfloor space
  elements.push({
    type: 'rect',
    position: { x: subfloor.support.sleeperWalls.foundation.width, y: wallY },
    width: 1800 - subfloor.support.sleeperWalls.foundation.width,
    height: subfloor.support.sleeperWalls.height,
    stroke: 'none',
    fill: 'rgba(200, 230, 255, 0.3)'
  });
  
  elements.push({
    type: 'text',
    position: { x: 900, y: wallY + 100 },
    content: 'VENTILATED UNDERFLOOR SPACE',
    fontSize: 7,
    textAnchor: 'middle'
  });
  
  // Polythene membrane on ground
  elements.push({
    type: 'line',
    start: { x: 0, y: -50 },
    end: { x: 5000, y: -50 },
    stroke: '#FF6600',
    strokeWidth: 2
  });
  
  elements.push({
    type: 'text',
    position: { x: 2500, y: -60 },
    content: `${subfloor.underfloor.membrane.thickness} POLYTHENE MEMBRANE`,
    fontSize: 6,
    fill: '#FF6600',
    textAnchor: 'middle'
  });
  
  // Dimensions
  elements.push(...generateSectionDimensions(subfloor));
  
  // Detail references
  if (subfloor.designMode === 'engineer') {
    elements.push({
      type: 'circle',
      center: { x: 2500, y: beamY },
      radius: 30,
      stroke: '#000000',
      strokeWidth: 2,
      fill: 'none'
    });
    
    elements.push({
      type: 'text',
      position: { x: 2500, y: beamY + 5 },
      content: 'ENG',
      fontSize: 12,
      fontWeight: 'bold',
      textAnchor: 'middle'
    });
    
    elements.push({
      type: 'text',
      position: { x: 2500, y: beamY + 50 },
      content: `Pr.Eng: ${subfloor.engineerSignature.name}`,
      fontSize: 6,
      textAnchor: 'middle'
    });
  }
  
  return elements;
}
```

---

# 12. Testing & Validation

## 12.1 Standard Mode Tests

```ts
describe('Standard Subfloor Creation', () => {
  it('should create SANS-compliant beam and block system', () => {
    const floorPolygon = createTestFloorPolygon(10000, 8000);
    const subfloor = createStandardBeamAndBlock(floorPolygon, 'H2');
    
    expect(subfloor.designMode).toBe('standard');
    expect(subfloor.levels.underfloorClearance).toBeGreaterThanOrEqual(150);
    expect(subfloor.slab.screed.thickness).toBeGreaterThanOrEqual(40);
    expect(subfloor.ventilation.calculation.compliant).toBe(true);
  });
  
  it('should calculate correct ventilation area', () => {
    const floorArea = 100; // m²
    const subfloor = createStandardBeamAndBlock(
      createTestFloorPolygon(10000, 10000),
      'H2'
    );
    
    const requiredVentArea = floorArea * 15; // 1500mm²
    expect(subfloor.ventilation.calculation.providedVentArea)
      .toBeGreaterThanOrEqual(requiredVentArea);
  });
  
  it('should generate complete BOQ', () => {
    const subfloor = createTestStandardSubfloor();
    const boq = generateStandardSubfloorBOQ(subfloor);
    
    expect(boq.foundations.items.length).toBeGreaterThan(0);
    expect(boq.sleeperWalls.items.length).toBeGreaterThan(0);
    expect(boq.slab.items.length).toBeGreaterThan(0);
    expect(boq.ventilation.items.length).toBeGreaterThan(0);
    expect(boq.underfloor.items.length).toBeGreaterThan(0);
    expect(boq.totalCost).toBeGreaterThan(0);
  });
});
```

## 12.2 Engineer Mode Tests

```ts
describe('Engineer Subfloor Design', () => {
  it('should allow custom clearance height', () => {
    const subfloor = createEngineerSubfloor({
      underfloorClearance: 450 // Custom (>150mm minimum)
    });
    
    expect(subfloor.levels.underfloorClearance).toBe(450);
    expect(subfloor.designMode).toBe('engineer');
  });
  
  it('should require engineer signature', () => {
    const subfloor = createEngineerSubfloor();
    
    expect(() => {
      validateSubfloor(subfloor);
    }).toThrow('Engineer signature required');
  });
  
  it('should validate SANS ventilation compliance', () => {
    const subfloor = createEngineerSubfloor({
      ventilationArea: 500 // Below required for 100m² floor
    });
    
    const validation = validateSubfloorCompliance(subfloor);
    const ventCheck = validation.find(c => c.rule === 'Ventilation Area');
    
    expect(ventCheck.compliant).toBe(false);
    expect(subfloor.complianceOverride.hasOverrides).toBe(true);
  });
});
```

---

# 13. Integration Notes

## 13.1 Integration with Foundation System (Volume VII)

- Subfloor sleeper walls sit on strip footings designed in Volume VII
- Columns sit on pad footings designed in Volume VII
- Foundation BOQ and subfloor BOQ are separate but linked
- Total cost = Foundation cost + Subfloor cost

## 13.2 Integration with Wall System

- Perimeter walls bear on perimeter beams
- Wall loads calculate required beam capacity
- DPC continuity from subfloor to walls

## 13.3 Integration with Services

- Drainage pipes route through subfloor void
- Water and electrical penetrate structure at defined points
- Services layout coordinates with support structure

---

# 14. Notes

- **Subfloor is a complete system** requiring coordination of multiple disciplines
- **Standard mode** provides fast SANS-compliant solutions for typical residential
- **Engineer mode** allows custom structural design for complex projects
- **Ventilation is critical** and automatically calculated to SANS requirements
- **BOQ is comprehensive** covering all subfloor components
- **Drawings show complete assembly** in plan and section views

---

# 15. Completion

Volume VIII establishes the complete **Subfloor/Suspended Floor System** with:

- Dual-mode design (Standard and Engineer)
- Complete system integration (foundations + support + slab + services)
- Multiple system types (beam and block, hollow core, precast, cast-in-situ)
- SANS-compliant ventilation calculations
- Comprehensive BOQ generation
- Detailed engineer modal interface
- Plan and section view rendering
- Professional engineer signature system

This completes the subfloor specification for the enterprise-grade SVG-Based Parametric CAD & BOQ Platform.

---

**END OF VOLUME VIII**
