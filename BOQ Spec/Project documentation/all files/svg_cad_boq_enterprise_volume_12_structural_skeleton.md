# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification
## Volume XII — Structural Skeleton: Material-Based Parametric Construction & BOQ Integration

**Version:** 12.1
**Revision Date:** 2026-02-18
**Document Type:** Enterprise Engineering Specification

---

# 1. Document Control

- **Version:** 12.1
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** __________________
- **Status:** Approved for Implementation

---

# 2. Scope

Volume XII defines the **Structural Skeleton System** for the SVG-Based Parametric CAD & BOQ Platform.
This volume bridges the gap between **Foundations (Vol 7)** and **Roofs (Vol 11)**, providing the independent structural frame capabilities required for commercial, industrial, and open-plan residential projects where load-bearing brickwork is insufficient.

This document establishes:

-   **Material-First Architecture**: Structural assembly from actual standard profiles (Concrete, Steel, Rebar).
-   **Dual-Mode System**:
    -   **Standard Mode**: Deemed-to-satisfy rules for simple Lintels and Beams (SANS 10400-K).
    -   **Engineer Mode**: Full parametric "Rational Design" for Frames, Slabs, and steelwork requiring ECSA signature.
-   **Concrete Technology**: Detailed mix designs (MPa), aggregate sizing, curing specs, and formwork stripping times (SANS 2001-CC1).
-   **Reinforcement (Rebar)**: Automated Bar Bending Schedules (BBS) and tonnage calculations.
-   **Structural Steel**: Integration of the SAISC "Red Book" profile database (IPE, HEA, PFC, Angle).
-   **Suspended Slabs**: In-situ systems, Rib & Block, and Bond-Lok composite systems.
-   **BOQ Integration**: Precise quantification of Volume (m³), Area (m² Formwork/Paint), and Mass (Ton Steel/Rebar).

---

# 3. Strategic Objective

The Structural Skeleton system must:

-   **Independent Frames**: Support structures that stand independently of wall infill (RC Frames / Steel Portals).
-   **Hybrid Integration**: Allow seamless mixing of Load-Bearing Walls (Vol 9) with point-load Columns.
-   **True 3D Connectivity**: Columns must know their start (Foundation/Slab) and end (Beam/Slab) levels.
-   **Parametric Intelligence**: Changing a column height must auto-update concrete volume and rebar lengths.
-   **Rational Design Compliance**: Force "Engineer Mode" when spans or loads exceed SANS 10400 "Standard" limits.
-   **Accurate Costing**: Differentiate between "Simple Concrete" (Footings) and "Structural Concrete" (Columns/Beams) rates.

---

# 4. Material Libraries - Structural Components

## 4.1 Concrete Mix Library (SANS 878)

```ts
interface ConcreteMix {
  id: string; // e.g., "25mpa_19mm"
  grade: '10MPa'|'15MPa'|'20MPa'|'25MPa'|'30MPa'|'35MPa'|'40MPa'|'50MPa'|'60MPa';
  aggregateSize: 6 | 9 | 13 | 19 | 26 | 37; // mm
  slump: 'low' | 'medium' | 'high' | 'pump'; // 75mm standard
  cementType: 'CEM I' | 'CEM II'; 
  application: string[];
  cost: {
    perM3: number; // ZAR delivered
  };
}

const CONCRETE_LIBRARY: ConcreteMix[] = [
  {
    id: '15mpa_19mm',
    grade: '15MPa',
    aggregateSize: 19,
    slump: 'medium',
    cementType: 'CEM II',
    application: ['Mass Concrete', 'Fill', 'Unreinforced Footings', 'Blinding'],
    cost: { perM3: 1100 }
  },
  {
    id: '25mpa_19mm',
    grade: '25MPa',
    aggregateSize: 19,
    slump: 'medium',
    cementType: 'CEM II',
    application: ['Slabs', 'Make-up Concrete', 'Standard Foundations', 'Driveways'],
    cost: { perM3: 1250 }
  },
  {
    id: '30mpa_19mm',
    grade: '30MPa',
    aggregateSize: 19,
    slump: 'medium',
    cementType: 'CEM I',
    application: ['Columns', 'Beams', 'Suspended Slabs', 'Retaining Walls', 'Pool Shells'],
    cost: { perM3: 1350 }
  },
  {
    id: '40mpa_19mm',
    grade: '40MPa',
    aggregateSize: 19,
    slump: 'high',
    cementType: 'CEM I',
    application: ['Pre-stressed elements', 'High-rise Columns', 'Water Retaining Structures'],
    cost: { perM3: 1550 }
  },
  {
    id: 'self_compacting_50',
    grade: '50MPa',
    aggregateSize: 13,
    slump: 'pump',
    cementType: 'CEM I',
    application: ['Architectural Concrete', 'Complex Formwork', 'Heavily Reinforced Sections'],
    cost: { perM3: 1850 }
  }
];
```

## 4.2 Reinforcement Library (SANS 920)

```ts
interface RebarType {
  code: string; // e.g. "Y12"
  diameter: number; // mm
  steelType: 'High Yield' (450MPa) | 'Mild Steel' (250MPa);
  massPerMeter: number; // kg/m
  standardLengths: number[]; // e.g. [6m, 12m, 13m]
  bendingRadius: number; // Min radius (mm)
  cost: {
    perTon: number; // ZAR (Base Rate)
    cuttingAndBending: number; // ZAR/Ton extra
  };
}

const REBAR_LIBRARY: RebarType[] = [
  { code: 'R6', diameter: 6, steelType: 'Mild Steel', massPerMeter: 0.222, standardLengths: [6], bendingRadius: 12, cost: { perTon: 14500, cuttingAndBending: 2500 } },
  { code: 'R8', diameter: 8, steelType: 'Mild Steel', massPerMeter: 0.395, standardLengths: [6, 12], bendingRadius: 16, cost: { perTon: 14500, cuttingAndBending: 2500 } },
  { code: 'R10', diameter: 10, steelType: 'Mild Steel', massPerMeter: 0.617, standardLengths: [6, 12, 13], bendingRadius: 20, cost: { perTon: 14500, cuttingAndBending: 2500 } },
  { code: 'Y10', diameter: 10, steelType: 'High Yield', massPerMeter: 0.617, standardLengths: [12, 13], bendingRadius: 30, cost: { perTon: 15200, cuttingAndBending: 2800 } },
  { code: 'Y12', diameter: 12, steelType: 'High Yield', massPerMeter: 0.888, standardLengths: [12, 13], bendingRadius: 36, cost: { perTon: 15200, cuttingAndBending: 2800 } },
  { code: 'Y16', diameter: 16, steelType: 'High Yield', massPerMeter: 1.58, standardLengths: [12, 13], bendingRadius: 48, cost: { perTon: 15200, cuttingAndBending: 2800 } },
  { code: 'Y20', diameter: 20, steelType: 'High Yield', massPerMeter: 2.47, standardLengths: [12, 13], bendingRadius: 60, cost: { perTon: 15200, cuttingAndBending: 2800 } },
  { code: 'Y25', diameter: 25, steelType: 'High Yield', massPerMeter: 3.85, standardLengths: [12, 13], bendingRadius: 100, cost: { perTon: 15200, cuttingAndBending: 2800 } },
  { code: 'Y32', diameter: 32, steelType: 'High Yield', massPerMeter: 6.31, standardLengths: [12, 13], bendingRadius: 128, cost: { perTon: 15200, cuttingAndBending: 2800 } },
  { code: 'Y40', diameter: 40, steelType: 'High Yield', massPerMeter: 9.86, standardLengths: [12, 13], bendingRadius: 160, cost: { perTon: 16500, cuttingAndBending: 3200 } }
];

interface MeshRef {
  ref: string; // e.g. "Ref 193"
  longitudinal: { diameter: number; pitch: number };
  cross: { diameter: number; pitch: number };
  massPerM2: number; // kg/m2
  sheetSize: { width: 2400; length: 6000 };
  application: string[];
}

const MESH_LIBRARY: MeshRef[] = [
  { ref: 'Ref 100', longitudinal: { diameter: 4, pitch: 200 }, cross: { diameter: 4, pitch: 200 }, massPerM2: 1.00, sheetSize: { width: 2400, length: 6000 }, application: ['Floors on Ground', 'Crack Control'] },
  { ref: 'Ref 193', longitudinal: { diameter: 5.6, pitch: 200 }, cross: { diameter: 5.6, pitch: 200 }, massPerM2: 1.93, sheetSize: { width: 2400, length: 6000 }, application: ['Residential Slabs', 'Driveways'] },
  { ref: 'Ref 245', longitudinal: { diameter: 6.3, pitch: 200 }, cross: { diameter: 6.3, pitch: 200 }, massPerM2: 2.45, sheetSize: { width: 2400, length: 6000 }, application: ['Commercial Floors', 'Heavy Load Slabs'] },
  { ref: 'Ref 395', longitudinal: { diameter: 8, pitch: 200 }, cross: { diameter: 8, pitch: 200 }, massPerM2: 3.95, sheetSize: { width: 2400, length: 6000 }, application: ['Heavy Suspended Slabs', 'Industrial Floors'] },
  { ref: 'Ref 617', longitudinal: { diameter: 10, pitch: 200 }, cross: { diameter: 10, pitch: 200 }, massPerM2: 6.17, sheetSize: { width: 2400, length: 6000 }, application: ['Very Heavy Duty Pavements'] },
  { ref: 'Ref 888', longitudinal: { diameter: 12, pitch: 200 }, cross: { diameter: 12, pitch: 200 }, massPerM2: 8.88, sheetSize: { width: 2400, length: 6000 }, application: ['Specialized Engineering'] }
];
```

## 4.3 Structural Steel Profiles (SAISC Red Book)

```ts
interface SteelProfile {
  designation: string; // e.g. "IPE 200"
  type: 'IPE' | 'IPE-AA' | 'HEA' | 'HEB' | 'PFC' | 'Angle' | 'Tube' | 'Column';
  dimensions: {
    depth: number; // h
    width: number; // b
    webThickness: number; // tw
    flangeThickness: number; // tf
    rootRadius?: number; // r
  };
  properties: {
    massPerMeter: number; // kg/m
    surfaceAreaPerMeter: number; // m²/m (for paint)
    sectionModulusX: number; // Zx (cm³)
    momentInertiaX: number; // Ix (cm⁴)
    radiusGyrationY?: number; // ry (cm)
  };
}

// Example Subset (Extensive list required for Enterprise)
const STEEL_LIBRARY: SteelProfile[] = [
  // IPE Sections (Beams)
  { designation: 'IPE 100', type: 'IPE', dimensions: { depth: 100, width: 55, webThickness: 4.1, flangeThickness: 5.7 }, properties: { massPerMeter: 8.1, surfaceAreaPerMeter: 0.400, sectionModulusX: 34.2, momentInertiaX: 171 } },
  { designation: 'IPE 140', type: 'IPE', dimensions: { depth: 140, width: 73, webThickness: 4.7, flangeThickness: 6.9 }, properties: { massPerMeter: 12.9, surfaceAreaPerMeter: 0.551, sectionModulusX: 77.3, momentInertiaX: 541 } },
  { designation: 'IPE 180', type: 'IPE', dimensions: { depth: 180, width: 91, webThickness: 5.3, flangeThickness: 8.0 }, properties: { massPerMeter: 18.8, surfaceAreaPerMeter: 0.698, sectionModulusX: 146, momentInertiaX: 1317 } },
  { designation: 'IPE 200', type: 'IPE', dimensions: { depth: 200, width: 100, webThickness: 5.6, flangeThickness: 8.5 }, properties: { massPerMeter: 22.4, surfaceAreaPerMeter: 0.768, sectionModulusX: 194, momentInertiaX: 1943 } },
  { designation: 'IPE 200AA', type: 'IPE-AA', dimensions: { depth: 200, width: 100, webThickness: 4.5, flangeThickness: 6.7 }, properties: { massPerMeter: 18.0, surfaceAreaPerMeter: 0.768, sectionModulusX: 168, momentInertiaX: 1600 } },

  // HEA Sections (Columns/Beams)
  { designation: 'HEA 160', type: 'HEA', dimensions: { depth: 152, width: 160, webThickness: 6, flangeThickness: 9 }, properties: { massPerMeter: 30.4, surfaceAreaPerMeter: 0.896, sectionModulusX: 220, momentInertiaX: 1670 } },
  { designation: 'HEA 200', type: 'HEA', dimensions: { depth: 190, width: 200, webThickness: 6.5, flangeThickness: 10 }, properties: { massPerMeter: 42.3, surfaceAreaPerMeter: 1.140, sectionModulusX: 389, momentInertiaX: 3690 } },

  // PFC (Channels)
  { designation: '100x50 PFC', type: 'PFC', dimensions: { depth: 100, width: 50, webThickness: 5.0, flangeThickness: 8.5 }, properties: { massPerMeter: 10.6, surfaceAreaPerMeter: 0.372, sectionModulusX: 38, momentInertiaX: 187 } },
  { designation: '180x70 PFC', type: 'PFC', dimensions: { depth: 180, width: 70, webThickness: 6.0, flangeThickness: 11.0 }, properties: { massPerMeter: 22.3, surfaceAreaPerMeter: 0.611, sectionModulusX: 165, momentInertiaX: 1475 } },

  // Angles
  { designation: '50x50x5 Angle', type: 'Angle', dimensions: { depth: 50, width: 50, webThickness: 5, flangeThickness: 5 }, properties: { massPerMeter: 3.77, surfaceAreaPerMeter: 0.194, sectionModulusX: 2.8, momentInertiaX: 10.6 } },
  { designation: '100x100x8 Angle', type: 'Angle', dimensions: { depth: 100, width: 100, webThickness: 8, flangeThickness: 8 }, properties: { massPerMeter: 12.2, surfaceAreaPerMeter: 0.392, sectionModulusX: 17.5, momentInertiaX: 111 } }
];
```

---

# 5. Component Construction Modules

## 5.1 Reinforced Concrete Column

```ts
interface RCColumn {
  id: string;
  gridRef: string; // e.g. "C-3"
  
  geometry: {
    shape: 'Square' | 'Rectangular' | 'Circular' | 'L-Shape';
    dimA: number; // Width / Diameter (mm)
    dimB?: number; // Depth (mm) - Optional for Square/Circular
    dimC?: number; // Flange width for L-Shape
    dimD?: number; // Flange thickness for L-Shape
    height: number; // mm
  };
  
  levels: {
    baseLevel: number; // e.g., -0.300 (Top of Foundation)
    topLevel: number; // e.g., +2.850 (Underside of Beam)
  };

  concrete: {
    mixClass: string; // e.g., "30mpa_19mm"
    finish: 'Off-shutter' | 'Smooth' | 'Bagged' | 'Exposed_Aggregate';
  };

  reinforcement: {
    mainPrescription: string; // e.g., "4Y16"
    stirrupPrescription: string; // e.g., "R8-200"
    starterBars: boolean; // Auto-generate connection to floor above
    lapLength: number; // mm (40*D typically)
    
    // Derived
    calculatedMass: number; // kg
    calculatedLength: number; // m
  };

  designMode: 'Standard' | 'Engineer';
  
  status: {
    isLoadBearing: boolean;
    fireRating: 60 | 120 | 180; // Minutes
  }
}
```

## 5.2 Reinforced Concrete Beam

```ts
interface RCBeam {
  id: string;
  type: 'Upstand' | 'Downstand' | 'Hidden' | 'Lintel' | 'Ring_Beam';
  
  geometry: {
    width: number; // mm
    depth: number; // mm
    span: number; // mm (Clear span)
    supportLeft: string; // Column ID or Wall ID
    supportRight: string; // Column ID or Wall ID
  };

  loads: {
    wallLoadAbove?: boolean; // Carrying brickwork?
    slabLoadSide?: 'None' | 'One_Way' | 'Two_Way';
    pointLoads?: { pos: number, magnitude: number }[];
  };

  concrete: {
    mixClass: string;
    camber: number; // mm (Pre-camber for long spans)
  };
  
  reinforcement: {
    topSteel: string; // "2Y12"
    bottomSteel: string; // "3Y16"
    shearLinks: string; // "R8-150"
  };
}
```

## 5.3 Suspended Slab System

```ts
interface SuspendedSlab {
  id: string;
  type: 'In-Situ_Solid' | 'Rib_and_Block' | 'Hollow_Core' | 'Bond_Lok' | 'Post_Tensioned';
  
  geometry: {
    areaPoly: Point2D[];
    thickness: number; // Total structural depth
    level: number; // Top of Concret Level (TOC)
  };

  // Type: Rib and Block (Most common residential)
  ribBlockSpec?: {
    blockType: 'Polystyrene' | 'Concrete' | 'Clay';
    ribSize: '100x60' | '150x60';
    spacing: number; // Typically 500mm or 600mm centers
    toppingThickness: number; // Typically 50-75mm
    meshRef: string; // e.g., "Ref 193"
    beamFill: boolean; // Between ribs at supports
  };

  // Type: Bond-Lok (Steel decking)
  bondLokSpec?: {
    profile: 'Bond-Lok' | 'Viper';
    steelGauge: 0.8 | 1.0 | 1.2; // mm
    concreteGrade: string;
    proppingRequired: boolean;
  };

  propping: {
    height: number;
    duration: number; // Days to strip
    backPropping: boolean;
  };
}
```

---

# 6. BOQ Generation Algorithms

## 6.1 Concrete Volume (m³)

Logic must account for the intersection of elements to avoid double counting.
*Rule: Slabs cut Columns; Beams cut Colums; Slabs cut Beams (Priority: Slab > Beam > Column).*

```ts
function calculateColumnConcrete(col: RCColumn): number {
  // Volume = Area * Height
  let area = 0;
  if (col.geometry.shape === 'Circular') {
    area = Math.PI * Math.pow(col.geometry.dimA / 2000, 2); // m²
  } else if (col.geometry.shape === 'L-Shape') {
    // Area of two rectangles minus overlap
    const A = col.geometry.dimA; // Width
    const B = col.geometry.dimB; // Depth
    const C = col.geometry.dimC; // Flange Width
    const D = col.geometry.dimD; // Flange Thickness
    
    // Generic L-Shape Calc needed here
    // ...
  } else {
    area = (col.geometry.dimA / 1000) * ((col.geometry.dimB || col.geometry.dimA) / 1000);
  }
  
  const vol = area * (col.geometry.height / 1000);
  return vol * 1.05; // +5% Wastage
}

function calculateRibBlockConcrete(slab: SuspendedSlab): number {
  // Volume is ONLY the topping + ribs, not the blocks (which are voids/fillers)
  const fullVolume = slab.geometry.area * (slab.geometry.thickness / 1000);
  
  if (slab.ribBlockSpec.blockType === 'Polystyrene') {
     // Detailed math:
     // Block Vol = 0.44m wide * (Depth-0.05)
     // Rib Vol = 0.06m wide * (Depth-0.05)
     // Topping Vol = 0.05m
     // Ratio typically 0.065 m3/m2 for 170mm slab
     return slab.geometry.area * 0.085 * 1.05; 
  }
  return fullVolume * 1.0; // Solid slab logic
}
```

## 6.2 Formwork Area (m²)

Costing depends on the "Contact Area" (where concrete touches the shutter).

```ts
function calculateBeamFormwork(beam: RCBeam): number {
  // Soffit (Bottom) + 2 Sides
  const soffitWidth = beam.geometry.width / 1000;
  const sideHeight = (beam.geometry.depth - slabThickness) / 1000; // Deduct slab thickness if T-Beam
  
  const perimeter = soffitWidth + (2 * sideHeight);
  return perimeter * (beam.geometry.span / 1000);
}

function calculateColumnFormwork(col: RCColumn): number {
    // Perimeter * Height
    const perimeter = (col.geometry.dimA + (col.geometry.dimB || col.geometry.dimA)) * 2 / 1000;
    return perimeter * (col.geometry.height / 1000);
}
```

## 6.3 Reinforcement (Ton)

Logic converts simple prescriptions (e.g., "4Y16") into mass.

```ts
function calculateRebarMass(col: RCColumn): number {
  // Main Bars
  const mainBarCount = parseInt(col.reinforcement.mainPrescription[0]); // "4"
  const mainBarCode = col.reinforcement.mainPrescription.slice(1); // "Y16"
  const mainBarInfo = REBAR_LIBRARY.find(r => r.code === mainBarCode);
  
  // Length includes Lap (40 * Diameter) at bottom + Starter (40 * D) at top
  const lapLength = (mainBarInfo.diameter * 40) / 1000; 
  const totalLength = (col.geometry.height / 1000) + lapLength + lapLength;
  
  const mainMass = mainBarCount * totalLength * mainBarInfo.massPerMeter;

  // Stirrups
  // Logic: Height / Spacing = Count. Length = Perimeter + Hooks.
  const stirrupCode = col.reinforcement.stirrupPrescription.split('-')[0]; // "R8"
  const stirrupSpacing = parseInt(col.reinforcement.stirrupPrescription.split('-')[1]); // "200"
  
  const stirrupCount = Math.ceil(col.geometry.height / stirrupSpacing);
  const colPerim = (col.geometry.dimA + (col.geometry.dimB || col.geometry.dimA)) * 2;
  const stirrupLen = (colPerim - (8 * 40)) + 300; // Deduct cover, add hooks
  
  const stirrupInfo = REBAR_LIBRARY.find(r => r.code === stirrupCode);
  const stirrupMass = stirrupCount * (stirrupLen/1000) * stirrupInfo.massPerMeter;
  
  return (mainMass + stirrupMass) / 1000; // Return tons
}
```

---

# 7. Dual-Mode Engineering Logic

## 7.1 Standard Mode (Auto-Pilot)
This mode applies **Deemed-to-Satisfy** rules from SANS 10400-K. It is valid only for:
1.  Single or Double storey residential.
2.  Spans < 6.0m.
3.  Standard Loading (1.5 kN/m² Live Load).

**Auto-Sizing Rules:**
*   **Lintels**:
    *   Opening < 1.0m: 110x75 Pre-stressed Lintel.
    *   Opening 1.0m - 2.0m: 2x 110x75 Pre-stressed Lintels side-by-side.
    *   Opening 2.0m - 3.0m: 230x300 RC Beam (4Y12 Main).
*   **RC Beams**:
    *   Depth = Span / 15 (min 230mm).
    *   Width = 230mm (to match standard wall).
*   **Slabs**:
    *   Type: Rib & Block (170mm or 255mm system based on span).

## 7.2 Engineer Mode (Rational Design)
This mode unlocks full parametric overriding.
*   **Trigger**: Any span > 6m, Column Height > 3.0m, or "Commercial" Project Type.
*   **Capabilities**:
    *   Define non-standard concrete (e.g., 40MPa).
    *   Specify rebar by separate "Bending Schedule" input (or JSON import).
    *   Steelwork: Select specific I-Section profiles from library.
    *   **Signature Lock**: Design cannot be finalized/BOQ'd without an "Engineer Signature" entity attached to the scope.

---

# 8. Engineer Modal Interface Specification (React/TSX)

This section defines the exact UI components for the Structural Engineering Module.

## 8.1 RC Column Editor Modal

```tsx
interface RCColumnEditorProps {
  columnId: string;
  isOpen: boolean;
  onSave: (data: RCColumn) => void;
  onCancel: () => void;
}

export const RCColumnEditor: React.FC<RCColumnEditorProps> = ({ columnId, isOpen, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState('geometry');
  const [columnData, setColumnData] = useState<RCColumn>(initialData);

  return (
    <Modal isOpen={isOpen} size="xl" title="Reinforced Concrete Column Editor">
      <Tabs active={activeTab} onChange={setActiveTab}>
        <Tab id="geometry" label="Geometry & Levels" />
        <Tab id="concrete" label="Concrete Mix" />
        <Tab id="rebar" label="Reinforcement" />
        <Tab id="loads" label="Loads & Analysis" />
      </Tabs>

      <ModalBody>
        {activeTab === 'geometry' && (
          <div className="grid grid-cols-2 gap-4">
            <FormSection title="Profile">
               <Select label="Shape" options={['Square', 'Rectangular', 'Circular', 'L-Shape']} 
                       value={columnData.geometry.shape} 
                       onChange={(v) => updateGeometry('shape', v)} />
               <Input type="number" label="Width (Dim A)" suffix="mm" value={columnData.geometry.dimA} />
               <Input type="number" label="Depth (Dim B)" suffix="mm" value={columnData.geometry.dimB} />
            </FormSection>
            
            <FormSection title="Levels">
               <LevelPicker label="Base Level" value={columnData.levels.baseLevel} />
               <LevelPicker label="Top Level" value={columnData.levels.topLevel} />
               <InfoBox>Calculated Height: {columnData.geometry.height} mm</InfoBox>
            </FormSection>
            
            <div className="col-span-2">
               <Preview3D element={columnData} />
            </div>
          </div>
        )}

        {activeTab === 'rebar' && (
          <div className="rebar-configurator">
            <h3 className="text-lg font-bold">Main Reinforcement</h3>
            <div className="flex gap-4">
              <Select label="Count" options={[4,6,8,10,12]} value={rebar.count} />
              <Select label="Bar Size" options={['Y10','Y12','Y16','Y20','Y25','Y32']} value={rebar.code} />
            </div>
            
            <h3 className="text-lg font-bold mt-4">Stirrups / Links</h3>
            <div className="flex gap-4">
              <Select label="Size" options={['R6','R8','R10']} value={links.code} />
              <Input type="number" label="Spacing" suffix="mm c/c" value={links.spacing} />
            </div>
            
            <RebarCrossSectionView data={rebar} />
            
            <Alert variant="info">
              Total Steel Mass: {calculateRebarMass(columnData).toFixed(2)} kg
            </Alert>
          </div>
        )}
      </ModalBody>
      
      <ModalFooter>
         <Button variant="secondary" onClick={onCancel}>Cancel</Button>
         <Button variant="primary" onClick={() => onSave(columnData)}>Update Column</Button>
      </ModalFooter>
    </Modal>
  );
};
```

## 8.2 Structural Steel Beam Editor

```tsx
interface SteelBeamEditorProps {
  beamId: string;
  onSave: (data: SteelBeam) => void;
}

export const SteelBeamEditor: React.FC<SteelBeamEditorProps> = (props) => {
  // Database lookup for SAISC Red Book
  const [profileType, setProfileType] = useState('IPE');
  const availableProfiles = STEEL_LIBRARY.filter(p => p.type === profileType);
  
  return (
    <Modal title="Structural Steel Editor">
       <div className="layout-split">
          <div className="controls">
             <Select label="Profile Family" options={['IPE','HEA','Channel','Angle']} 
                     value={profileType} onChange={setProfileType} />
                     
             <DataGrid 
                data={availableProfiles}
                columns={['Designation', 'Mass (kg/m)', 'Depth', 'Flange Width']}
                onSelect={(row) => setSelectedProfile(row)}
             />
             
             <FormSection title="Connections">
                <Select label="Left Connection" options={['Pinned', 'Moment', 'Welded']} />
                <Select label="Right Connection" options={['Pinned', 'Moment', 'Welded']} />
                <Checkbox label="Base Plate Required?" />
             </FormSection>
          </div>
          
          <div className="preview">
             <SectionViewer profile={selectedProfile} />
             <LoadCapacityGraph span={props.span} profile={selectedProfile} />
          </div>
       </div>
    </Modal>
  );
}
```

---

# 9. SANS Compliance Checklist (Vol 12)

The system enforces the following SANS restrictions:

1.  **Min Cover**: Foundations (50mm), External Columns (40mm), Slabs (30mm). -> *SANS 10100-1*
2.  **Min Dimension**: Load-bearing columns min width 230mm. (Standard Mode).
3.  **Max Span/Depth**: warning if Beam L/d > 20 (Deflection risk).
4.  **Min Steel**: Columns must have > 0.4% steel area. (Alert if user inputs too little rebar).
5.  **Corrosion**: Coastal zones require Galvanized Lintels / 40mm Cover.

---

# 10. Construction & Workmanship (SANS 2001-CC1)

## 10.1 Tolerances
*   **Position**: Columns must be within ±15mm of grid line.
*   **Verticality**: Max deviation 10mm per 3m height.
*   **Level**: Top of concrete ±10mm.

## 10.2 Formwork Stripping Times
*   **Vertical Sides (Columns/Beams)**: 24 hours (if > 15°C).
*   **Soffits (Slabs)**: 7 days (props remain).
*   **Props (Slabs)**: 21 days (or when concrete reaches 25MPa).

## 10.3 Curing
*   Concrete must be kept moist for minimum 7 days.
*   Methods: Ponding, spraying, or curing compound.

---

**END OF VOLUME XII**
