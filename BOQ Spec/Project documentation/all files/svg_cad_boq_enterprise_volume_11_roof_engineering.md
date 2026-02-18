# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification

## Volume XI — Roof Systems: Dual-Mode Engineering Parameters & BOQ Integration

**Version:** 11.0  
**Revision Date:** 2026-02-18  
**Document Type:** Enterprise Engineering Specification

---

# 1. Document Control

- **Version:** 11.0
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** ********\_\_********

---

# 2. Scope

Volume XI defines the **Roof System Parameter System with Dual-Mode Engineering Controls** for the SVG-Based Parametric CAD & BOQ Platform.

This document establishes:

- **Standard Mode**: Automatic SANS 10400-L compliant roof design using deemed-to-satisfy rules
- **Engineer Mode**: Advanced parametric controls for custom truss and structural design
- **Roof Structural Classification**: Trusses, Rafters, Purlins, and Bracing systems
- **Wind Load Integration**: SANS 10160-3 integration for coastal and high-wind zones
- **BOQ Derivation**: Exact component calculations from engineering parameters
- **Engineer Modal Interface** specification for roof systems

---

# 3. Strategic Objective

The roof engineering system must:

- **Operate in two modes**: Standard (SANS 10400-L Auto) and Engineer (Custom/Rational Design)
- **Automate SANS Compliance**: Automatically select truss spacing, bracing, and pitch based on covering and location
- **Support Rational Design**: Allow engineers to override defaults for complex spans, Attic trusses, or specific load cases
- **Integrate Wind Loads**: Automatically calculate uplift forces and prescribe tie-down mechanisms (SANS 10160)
- **Generate Detailed BOQ**: Quantify hardware (gangnails, hurricane clips) based on engineering selection

---

# 4. Dual-Mode System Architecture

## 4.1 Mode Definition

```ts
type DesignMode = "standard" | "engineer";

interface RoofDesignModeConfig {
  mode: DesignMode;
  autoCompliance: boolean;
  engineerOverride: boolean;
  requiresApproval: boolean; // e.g. for spans > 10m
  engineerSignature?: {
    name: string;
    registrationNumber: string;
    date: Date;
    stamp: string;
  };
}
```

## 4.2 Mode Selection Logic

- **Standard Mode (Default)**: Used for spans < 8m, standard pitches (17.5° - 35°), and standard coverings (Concrete Tile/Sheeting). Applies SANS 10400-L "Deemed-to-Satisfy" rules.
- **Engineer Mode (Mandatory)**: Triggered for:
  - Spans > 10m
  - Pitches < 10° or > 45°
  - Heavy coverings (Slate, Clay)
  - Complex geometries (Attic rooms, Flying Gables)
  - High Wind Zones (Zone A - Costal)

---

# 5. Roof Type Engineering Classification

```ts
type RoofStructureSystem =
  | "prefab_truss" // Engineered timber trusses (Howe, Fink)
  | "site_cut_timber" // Traditional rafter & purlin
  | "light_steel_frame" // LSF Trusses
  | "flat_slab"; // Concrete deck

interface RoofConfig {
  system: RoofStructureSystem;
  designMode: RoofDesignModeConfig;
  windZone: "A" | "B" | "C" | "D"; // SANS 10160
  pitch: number;
  span: number;
  coveringWeight: number; // kg/m2
}
```

---

# 6. Standard Mode: Auto-Compliant Roof Parameters

## 6.1 Standard Truss System (SANS 10400-L)

```ts
interface StandardTrussSystem {
  id: string;
  type: "howe" | "fink"; // Auto-selected based on span
  spacing: 760 | 1050; // Auto-selected based on covering

  // SANS 10400-L Rules
  pitch: number; // Min 17.5 for Tiles, 5/10 for Sheeting

  // Timber Members (Auto-Sized)
  members: {
    topChord: "38x114" | "38x152"; // S5
    bottomChord: "38x114" | "38x152";
    web: "38x76" | "38x114";
  };

  // Bracing (Auto-Calculated)
  bracing: {
    diagonal: boolean; // Required for spans > 6m
    longitudinal: boolean; // Always required
    strapSize: "30x1.2mm";
  };
}
```

## 6.2 Standard Calculation Rules

```ts
const SANS_ROOF_RULES = {
  trussSpacing: {
    concrete_tile: 760, // mm
    metal_sheet: 1050, // mm
  },

  battenMinSizes: {
    concrete_tile: "38x38",
    metal_sheet: "50x76", // Purlins
  },

  bracingRequirements: (span: number) => ({
    diagonal: span > 6.0,
    crossBracing: span > 10.0,
  }),
};

function createStandardRoof(
  span: number,
  coveringType: string,
): StandardTrussSystem {
  // 1. Select Truss Type
  const type = span <= 6 ? "fink" : "howe";

  // 2. Select Spacing
  const spacing = coveringType === "tile" ? 760 : 1050;

  // 3. Size Members (Rule of Thumb / Table 2 SANS 10400-L)
  const chordSize = span > 8 ? "38x152" : "38x114";

  return {
    id: generateUUID(),
    type,
    spacing,
    pitch: coveringType === "tile" ? 22.5 : 10,
    members: {
      topChord: chordSize,
      bottomChord: chordSize,
      web: "38x76",
    },
    bracing: {
      diagonal: span > 6,
      longitudinal: true,
      strapSize: "30x1.2mm",
    },
  };
}
```

---

# 7. Engineer Mode: Advanced Roof Parameters

## 7.1 Engineer Truss Design

```ts
interface EngineerTrussDesign {
  id: string;
  designMode: "engineer";

  // Custom Geometry
  profile: "attic" | "scissors" | "parallel_chord" | "custom";
  pitch: number; // Custom pitch
  heelHeight: number; // Raised heel for insulation

  // Loading Parameters
  loads: {
    deadLoad: number; // kN/m2 (Custom covering weight)
    liveLoad: number; // kN/m2 (Maintenance/Storage)
    windLoad: number; // kN/m2 (Terrain Category)
    pointLoads: PointLoad[]; // Water tanks, AC units
  };

  // Member Specification
  timberGrade: "S5" | "S7" | "Lamstock";
  treatment: "H2" | "H3" | "H4";

  // Detailed Member Sizing
  members: {
    topChord: string; // User input e.g. "2x 50x228"
    bottomChord: string;
    webs: string;
  };

  // Connection Detail
  connections: {
    plateSystem: "MiTek" | "International";
    boltSize?: string; // For bolted trusses
  };

  // Engineer Signature
  engineerSignature: {
    required: true;
    name: string;
    ecsaNumber: string;
    date: Date;
  };
}
```

---

# 8. Engineer Modal Interface Specification

## 8.1 Roof Engineer Modal Tabs

### Tab 1: Structural Geometry

- **Truss Profile**: Select from advanced list (Attic, Scissor, Mono).
- **Pitch & Heel**: Override standard pitch, define raised heels.
- **Span Override**: Manually specify effective span if different from wall plate.
- **Overhangs**: Custom eaves details.

### Tab 2: Loading & Wind

- **Wind Zone**: Select SANS 10160 Zone (A-D) or Custom Velocity.
- **Terrain Category**: 1 (Exposed) to 4 (City).
- **Additional Loads**: Add Solar Panel loads, Water Tank points, HVAC units.
- **Uplift Check**: Visual indicator of uplift safety factor.

### Tab 3: Member Specification

- **Timber Grade**: S5 / S7 / Laminated.
- **Section Sizes**: Dropdowns for all standard timber sizes + Custom.
- **Treatment**: H2 (Internal) / H3 (External).

### Tab 4: Bracing & Anchoring

- **Tie-Downs**: Specify strap types (Hurricane clips, Wire ties, Hoop iron).
- **Bracing Layout**: Checkboxes for Diagonal, Cross, Longitudinal.
- **Wall Plate Anchor**: Bolt specs (M10/M12) and spacing.

### Tab 5: Compliance & Signature

- **SANS Checklist**:
  - [ ] Pitch compatible with covering?
  - [ ] Span within limits for timber grade?
  - [ ] Uplift resisted by anchorage?
- **Digital Signature**: Canvas padding for ECSA engineer signature.

---

# 9. BOQ Integration Implications

## 9.1 Standard vs Engineer BOQ

| Item                | Standard Mode                      | Engineer Mode                            |
| ------------------- | ---------------------------------- | ---------------------------------------- |
| **Trusses**         | Estimated Price based on Span/Type | Exact Price based on Volume/Design       |
| **Timber**          | Standard S5 Pine                   | Custom Grade (S7/Lam) pricing            |
| **Anchors**         | Standard Wire/Hoop iron            | Specific Hurricane Clips/Bolts (Counted) |
| **Bracing**         | Standard 30x1.2mm Strap            | Custom dimensions/lengths                |
| **Engineering Fee** | N/A                                | Added "Rational Design Fee" line item    |

## 9.2 Costing Algorithms

```ts
// Engineer Mode Costing
function calculateEngineerTrussCost(design: EngineerTrussDesign): number {
  const timberVol = calculateTimberVolume(design.members);
  const plateCost = estimatePlateCost(design.connections);
  const fabricationCost = timberVol * FABRICATION_RATE;
  const designFee = RATIONAL_DESIGN_BASE_FEE;

  return timberVol * TIMBER_RATE + plateCost + fabricationCost + designFee;
}
```

---

**END OF VOLUME XI - ENGINEERING SPECIFICATION**
