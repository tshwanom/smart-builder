# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification

## Volume XIII — Architectural Finishes: Dual-Mode Specification & BOQ Integration

**Version:** 13.2 (Fully Expanded)
**Revision Date:** 2026-02-18
**Document Type:** Enterprise Engineering Specification
**Status:** **APPROVED FOR IMPLEMENTATION**

---

# 1. Document Control

- **Version:** 13.2
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Dependencies:**
  - Volume 9 (Walls) - Substrate definitions
  - Volume 8 (Subfloors) - Screed definitions
  - Volume 10 (Ceilings) - Integration
  - Volume 12 (Structure) - Column/Beam cladding

---

# 2. Scope

Volume XIII defines the **Architectural Finishes Parameter System** for the SVG-Based Parametric CAD & BOQ Platform.
This volume acts as the "Skin" layer of the application, covering all surface treatments applied to the Structural Skeleton (Vol 12) and Walls (Vol 9).

## 2.1 Primary Systems

1.  **Floor Finishes:** Screeds, Tiling (Ceramic/Porcelain/Stone), Carpeting, Timber, Vinyl/Laminate.
2.  **Wall Finishes:** Plaster & Paint systems, Cladding (Stone/Timber), Wallpaper, Tiling.
3.  **Ceiling Finishes:** Plasterboard, Skimming, Bulkheads, Cornices.
4.  **Joinery & Trim:** Skirting, Architraves, Dado rails, Transition strips.

## 2.2 Dual-Mode Philosophy

- **Standard Mode (Builder's Grade):**
  - Auto-selection of "Deemed-to-Satisfy" finishes based on Room Type (e.g., Bathroom = Tile, Bedroom = Carpet).
  - Generic specifications (e.g., "Ceramic Tile P.C Sum R150/m²").
  - Standard wastage factors (10%).

- **Engineer/Architect Mode (Rational Design):**
  - Exact specification of material layers (Primer -> Bonding -> Adhesive -> Tile -> Grout -> Sealer).
  - Custom waste factors based on layout (e.g., 15% for diagonal tiling).
  - Detailed Method Statements (SANS 10107 compliance).

---

# 3. Reference Standards (South Africa / International)

The specification complies with:

- **SANS 10107:** The design and installation of ceramic tiling.
- **SANS 10400-T:** Fire protection (Flame spread ratings for wall/ceiling linings).
- **SANS 10400-O:** Lighting and Ventilation (Reflectance values).
- **SANS 10155:** Accuracy in buildings (Tolerances for finishes).
- **SANS 2001-EMI:** Cement plaster.

---

# 4. Material Libraries & Data Structures

## 4.1 Tiling & Stone Library

The system must support a rich database of tile products with physical and pricing attributes.

```typescript
export interface TileProduct {
  id: string;
  name: string; // e.g., "Johnson 600x600 Ivory Polished"
  material: "ceramic" | "porcelain" | "natural_stone" | "terrazzo";

  // Dimensions
  length: number; // mm (600)
  width: number; // mm (600)
  thickness: number; // mm (9)

  // Packaging
  boxQuantity: number; // m2 per box (e.g., 1.44)
  weightPerBox: number; // kg (for transport calc)

  // Properties
  slipRating: "R9" | "R10" | "R11" | "R12"; // DIN 51130
  wearRating: "PEI-1" | "PEI-2" | "PEI-3" | "PEI-4" | "PEI-5";
  rectified: boolean; // Affects grout line width

  // Commercial
  pricePerM2: number;
  supplierCode: string;
}

export interface TilingSystem {
  tileId: string;
  pattern: "stack" | "brick_50" | "brick_33" | "diamond" | "herringbone";
  groutWidth: number; // mm (e.g. 2mm for rectified, 5mm for ceramic)
  groutColor: string;
  movementJoints: boolean; // Auto-calc: Perimeter + every 5m
  trim: "pvc" | "aluminium" | "steel" | "brass";
}
```

## 4.2 Paint & Coating Library

Defining the "Paint System" rather than just the topcoat is crucial for accurate costing.

```typescript
export interface PaintProduct {
  id: string;
  type: "primer" | "undercoat" | "topcoat" | "sealer";
  base: "water" | "solvent" | "epoxy";
  finish: "matt" | "eggshell" | "satin" | "gloss" | "high_gloss";

  // Technical
  spreadRate: number; // m2 per Liter (e.g. 8)
  dft: number; // Dry Film Thickness per coat (microns)
  voc: "low" | "medium" | "high"; // Green building rating

  // Commercial
  packSizes: number[]; // [1, 5, 20] Liters
  pricePerLiter: number;
}

export interface PaintSpecification {
  substrateType: "plaster_new" | "plaster_old" | "rhinolite" | "board";
  location: "interior" | "exterior" | "wet_area";

  layers: {
    primer: string; // Product ID
    undercoat?: string;
    topCoats: string;
    coatsCount: number; // usually 2
  }[];
}
```

## 4.3 Vinyl, Laminate & Timber

Supporting modern floating floor systems.

```typescript
export interface FloatingFloor {
  type: "laminate" | "lvt" | "spc" | "engineered_wood";
  thickness: number; // mm (e.g., 8mm , 5mm SPC)
  wearLayer?: number; // mm (e.g. 0.55mm)

  underlay: {
    type: "foam" | "rubber_cork" | "acoustic";
    thickness: number;
    integrated: boolean; // Some SPC has built-in underlay
  };

  skirting: {
    matchFloor: boolean;
    profileId?: string;
  };
}
```

---

# 5. Component Modules & Logic

## 5.1 Room Data Sheet (RDS) Logic

The Engine utilizes a "Room Data Sheet" approach. Instead of applying finishes to individual walls manually, the user defines a `RoomFinishSchedule`.

```typescript
export interface RoomFinishSchedule {
  roomId: string;

  // 1. Floor
  floor: {
    finishId: string; // Link to Tiling/Carpet System
    skirtingId: string; // Link to Skirting Profile
  };

  // 2. Walls (Array to handle feature walls)
  walls: {
    defaultFinish: string; // e.g., "Paint-Neutral-Matt"
    featureWalls?: {
      wallId: string;
      finishId: string; // e.g., "Wallpaper-Damask"
    }[];
    dadoRail?: {
      height: number;
      finishBelow: string;
      finishAbove: string;
    };
    tiling?: {
      height: "floor_to_ceiling" | number; // e.g., 2100mm
      walls: "all" | "wet_only";
    };
  };

  // 3. Ceiling
  ceiling: {
    finishId: string; // "Paint-White-Matt"
    corniceId: string;
  };
}
```

## 5.2 Quantities Logic (The Algorithmic Core)

### 5.2.1 Tiling Quantification Algorithm

The engine does NOT just return $m^2$. It calculates the full Bill of Materials.

**Input:** Room Area ($A_{room} = 20m^2$), Perimeter ($P = 18m$), Tile (600x600).

1.  **Net Area:** $A_{net} = A_{room}$
2.  **Wastage Factor ($W$):**
    - Square/Rectangular Room: 10%
    - Complex/L-Shape: 12%
    - Diagonal Pattern: 15%
3.  **Gross Tile Area:** $A_{gross} = A_{net} \times (1 + W)$
4.  **Tile Count:** $N_{tiles} = \lceil A_{gross} / (0.6 \times 0.6) \rceil$
5.  **Adhesive:**
    - Bed Thickness ($t_{bed}$) typically 6mm for 600x600.
    - Consumption $\approx 1.6 kg/m^2$ per mm thickness.
    - $Mass_{adh} = A_{net} \times 6 \times 1.6 \times 1.05 (waste) = 201.6 kg$
    - Bags = $\lceil 201.6 / 20 \rceil = 11$ bags.
6.  **Grout:**
    - Formula: $kg/m^2 = \frac{(L+W) \times H \times J \times \rho}{L \times W}$
    - $L,W$ = Tile Dims, $H$ = Thickness, $J$ = Joint Width, $\rho$ = Density (1.7).
    - Total Grout = $A_{net} \times Rate_{grout}$.
7.  **Edge Trims:** $L_{trim} = P_{openings} + P_{transitions}$.

### 5.2.2 Painting Quantification Algorithm

**Input:** Wall Area Net ($A_{wall} = 50m^2$).

1.  **Primer (1 Coat):** $Vol_{prime} = \lceil A_{wall} / 8 \rceil$ Liters.
2.  **Top Coat (2 Coats):** $Vol_{top} = \lceil (A_{wall} \times 2) / 8 \rceil$ Liters.
3.  **Labor:** $Hours = A_{wall} \times 0.4$ hrs/m² (includes prep, masking, painting).

### 5.2.3 Cornice & Skirting

**Input:** Room Perimeter ($P$).

1.  **Net Length:** $L_{net} = P - \sum(DoorWidths)$.
2.  **Gross Length:** $L_{gross} = L_{net} \times 1.05$ (Cuts/Mitres).
3.  **Lengths Required:** $N_{lengths} = \lceil L_{gross} / L_{standard} \rceil$ (usually 3.0m lengths).

---

# 6. Engineer Modal Interface Design

The UI for configuring Finishes (Volume 13) operates on a "Room Palette" logic.

## 6.1 Finishes Matrix (Grid View)

A Data-Grid view showing all rooms as rows and elements as columns.

| Room Name   | Floor Finish      | Wall Finish       | Ceiling Finish | Skirting      | Cornice           |
| :---------- | :---------------- | :---------------- | :------------- | :------------ | :---------------- |
| **Lounge**  | Porcelain 600x600 | Paint (Dove Grey) | Paint (White)  | Meranti 140mm | Polystyrene 100mm |
| **Kitchen** | Porcelain 600x600 | Tile Splashback   | Paint (White)  | Tile Skirting | Polystyrene 100mm |
| **Bed 1**   | Carpet (Charcoal) | Paint (Cream)     | Paint (White)  | Pine 70mm     | Polystyrene 70mm  |

**Actions:**

- **Bulk Edit:** Select multiple rows -> Right Click -> "Change Floor to Laminate".
- **Copy/Paste:** Copy settings from one room to another.

## 6.2 Material Builder Modal

When clicking a cell (e.g. "Porcelain 600x600"), a detailed modal opens:

- **Header:** Finish ID / Name.
- **Section A: The Aesthetic (Visible Layer)**
  - Select Product (Image preview).
  - Pattern (Stack/Bond/Diamond).
  - Grout Color (Picker).
- **Section B: The Engineering (Substrate)**
  - Substrate: "Screed" (Default) or "Timber".
  - Preparation: "Prime" / "Chip" / "Self-level".
  - Fixative: "Standard Adhesive" vs "Flexible" (Auto-suggest based on tile size).
- **Section C: Costing Override**
  - Toggle "Supply Only" vs "Supply & Fit".
  - Override Labor Rate ($/m²).

---

# 7. BOQ Output Structure

Volume 13 generates specific Trade Bills in the final BOQ.

## 7.1 Bill No. 12: Floor Coverings

> **Item 1.1:** 600x600mm 'Polished Ivory' porcelain tiles fixed with approved adhesive to cement screed (risk of cracking).
>
> - Unit: $m^2$ | Qty: 145 | Rate: 350 | Total: 50,750
>
> **Item 1.2:** 100mm high cut tile skirting to match floor.
>
> - Unit: $m$ | Qty: 85 | Rate: 45 | Total: 3,825

## 7.2 Bill No. 13: Painting & Decorating

> **Item 2.1:** Prepare and apply one coat alkali resistant primer and two coats super acrylic paint to internal plastered walls.
>
> - Unit: $m^2$ | Qty: 450 | Rate: 85 | Total: 38,250

---

# 8. Detailed Installation Protocols (SANS ISO 9001 Compliance)

To ensure the "Engineer Mode" provides valid construction data, standard method statements are embedded.

## 8.1 Ceramic & Porcelain Tiling Protocol (SANS 10107)

**Phase 1: Surface Preparation (Hold Point 1)**

1.  **Moisture Test:** Screed moisture content must be <5% (Concrete scale). Use Hygrometer.
2.  **Levelness Test:** Maximum deviation 3mm over 3m straight edge. If invalid -> Issue "Self-Levering Screed" instruction.
3.  **Cleanliness:** Surface must be wire-brushed, vacuumed, and free of oil/bitumen.
4.  **Priming:** Apply bonding liquid (Keycoat) to all porous surfaces 4 hours before tiling.

**Phase 2: Setting Out**

1.  establish datum line (usually center of door or center of room) to ensure symmetry.
2.  Cut tiles at perimeter must be > 50% of tile width where possible.

**Phase 3: Application (The System)**

1.  **Adhesive Mixing:** Mechanical mix only (paddle mixer). Let stand for 5 mins, re-mix.
2.  **Trowel Selection:**
    - Small Ceramics (200x200): 6mm Notched Trowel.
    - Large Porcelain (600x600+): 10mm or 12mm Notched Trowel.
3.  **Butter Method:** For large format tiles, "Butter" the back of the tile with adhesive to ensure 100% coverage (Solid Bed).
4.  **Movement Joints:**
    - Perimeter: 5mm gap sealed with Silicone.
    - Intermediate: Every 5m in both directions.
    - Structural: Must align with screed/slab joints.

**Phase 4: Grouting & Sealing**

1.  Wait 24 hours minimum before foot traffic/grouting.
2.  Grout must comprise Water + Grout Mix + Bonding Liquid (for flexibility).
3.  Sealing: Natural Stone requires 2 coats of penetrative sealer (Pre-grout and Post-grout).

## 8.2 Painting Protocol

**Phase 1: Plaster Preparation**

1.  **Curing:** New plaster must cure for 28 days (or moisture < 5%).
2.  **Sanding:** Sand down trowel marks with 80-grit paper.
3.  **Filling:** Crack-fill minor shrinkage cracks with Polyfilla.

**Phase 2: The Paint System**

1.  **Primer:** Apply 1 coat Masonry Primer or Bonding Liquid (if very powdery).
2.  **Undercoat:** Apply 1 coat Universal Undercoat (crucial for color changes or adhesion).
3.  **Top Coats:** Apply 2 coats pure acrylic (allow 4 hours drying between coats).

---

# 9. Failure Mode & Effects Analysis (FMEA)

The software includes warnings based on these common failures:

| Failure Mode                      | Cause                                       | Software Mitigation                                         |
| :-------------------------------- | :------------------------------------------ | :---------------------------------------------------------- |
| **Tile Debonding (Hollow sound)** | Poor coverage; Dried adhesive ("Skinning"). | Warning if "Butter Backing" not selected for tiles > 600mm. |
| **Tile Crazing**                  | Adhesive too strong/rigid for tile type.    | Auto-select "Flexible Adhesive" for Porcelain/Upper Floors. |
| **Grout Cracking**                | Movement; Grout too wet.                    | Add "Bonding Liquid to Grout" BOQ Item for large floors.    |
| **Paint Peeling**                 | Moisture trapped; No primer.                | Mandatory "Primer" item in BOQ for "New Plaster" substrate. |
| **Efflorescence**                 | Moisture migration through slab.            | Suggest "Epoxy Barrier" if moisture risk is ticked.         |
| **Laminate Peaking**              | No expansion gap at wall.                   | Ensure Skirting covers >12mm gap.                           |

---

# 10. Quality Control (QC) Checklists

The system generates a printable QC sheet for the Site Foreman.

## Checklist 13.1: Tiling Inspection

- [ ] Screed levelness checked (3mm/3m)?
- [ ] Primer applied and dry?
- [ ] Adhesive mixing ratio correct (approx 5L water / 20kg)?
- [ ] Trowel size confirmed (10mm for 600x600)?
- [ ] Back-buttering performed on large tiles?
- [ ] Movement joints clean and open (no adhesive bridging)?
- [ ] Lippage check (< 1mm difference)?

## Checklist 13.2: Painting Inspection

- [ ] Plaster moisture content < 15%?
- [ ] All surfaces sanded and dusted?
- [ ] Primer coat visible and uniform?
- [ ] Crack filler sanded smooth?
- [ ] Cutting-in uses wet-edge technique?
- [ ] No roller marks or holidays (missed spots)?

---

# 11. Maintenance Data (O&M Manual)

Upon handover, the system exports this data for the Homeowner's Manual:

- **Spare Stock:** Keep 1 box of tiles and 1L of paint for future repairs.
- **Cleaning:**
  - Porcelain: Neutral detergent only. No acids.
  - Laminate: Damp cloth only. No wet mops.
- **Sealer Re-application:** Natural Stone requires re-sealing every 2-3 years.

---

# 12. Implementation Roadmap (Software)

To implement Volume 13, the following software tasks are required:

1.  **Database:**
    - Create `FinishProduct` table (inherits from `Material`).
    - Create `RoomFinishSchedule` link table.
2.  **Frontend (Canvas):**
    - Clicking a Room -> "Finishes" Tab in Properties Panel.
    - Visual indication of floor finish (Hatch pattern / Texture).
3.  **Engine:**
    - Implement `FinishesCalculator.ts`.
    - Add `calculateTiling(area, perimeter, tileSpec)` function.
    - Add `calculatePainting(area, paintSpec)` function.

---

**END OF SPECIFICATION VOLUME XIII**
