# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification

## Volume XV — Vertical Circulation: Dual-Mode Engineering Parameters & BOQ Integration

**Version:** 15.0  
**Revision Date:** 2026-02-18  
**Document Type:** Enterprise Engineering Specification

---

# 1. Document Control

- **Version:** 15.0
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** ********\_\_********

---

# 2. Scope

Volume XV defines the **Vertical Circulation & Safety Parameter System** for the SVG-Based Parametric CAD & BOQ Platform.
This volume ensures safe and compliant movement between levels, covering Staircases, Ramps, Lifts, and protective Barriers (Balustrades).

This document establishes:

- **Staircases:** Concrete, Steel, Timber, Spiral, Dog-leg geometries.
- **Balustrades:** Glass, Stainless Steel, Mild Steel, Masonry.
- **Ramps:** ADA/SANS 10400-S compliant access ramps.
- **Safety Rules:** Headroom checks, Rise/Run ratios, Handrail heights.
- **Dual-Mode Engineering:** Standard (Auto-Compliant) vs Engineer (Custom Design).
- **BOQ Quantification:** Concrete volume, Formwork (complicated), Railing linear meters.

---

# 3. Strategic Objective

The circulation system must:

- **Geometric Solvency:** Automatically calculate step counts based on Floor-to-Floor height.
- **Safety First:** Prevent creation of dangerous stairs (e.g. risers > 200mm).
- **Integration:** Cut holes in slabs automatically where stairs pass through.
- **Detailing:** Distinguish between "Waist" (structural thickness) and "Finishes" (treads/risers).

---

# 4. Dual-Mode Architecture

## 4.1 Specification Modes

| Feature      | **Standard Mode** (SANS 10400-M)               | **Engineer Mode** (Rational Design)                   |
| :----------- | :--------------------------------------------- | :---------------------------------------------------- |
| **Geometry** | Max Riser 170mm / Min Tread 250mm.             | Custom Riser/Tread (e.g. Fire Escape steepness).      |
| **Material** | Reinforced Concrete / Standard Steel Stringer. | Cantilevered treads, Floating glass stairs.           |
| **Railings** | Standard 1m high, <100mm gap.                  | Frameless glass (requires thickness calc), Wire rope. |
| **Width**    | Min 750mm (Residential) / 1100mm (Public).     | Custom widths.                                        |

---

# 5. Staircase Specification

## 5.1 Concrete Stairs (In-Situ)

```ts
interface ConcreteStair {
  id: string;
  type: "straight" | "dog_leg" | "u_shape" | "spiral";

  geometry: {
    floorToFloorHeight: number; // mm
    width: number; // mm
    riserHeight: number; // Auto-calc: Height / Steps
    treadDepth: number; // mm
    waistThickness: number; // mm (Structural throat)
  };

  // Reinforcement
  rebar: {
    mainBars: "Y12" | "Y16";
    distBars: "Y10";
    spacing: number;
  };

  // Finishes
  finish: {
    tread: "tile" | "timber" | "screed";
    nosing: "aluminum" | "none";
    riser: "paint" | "tile";
  };
}
```

## 5.2 Steel & Timber Stairs

```ts
interface ConstructedStair {
  stringer: {
    type: "central_spine" | "side_stringers" | "floating";
    material: "steel_pfc" | "timber_laminated";
    size: string; // e.g. "200x75 PFC"
  };

  treads: {
    material: "oak" | "teak" | "checker_plate" | "glass";
    thickness: number;
    fixing: "bolted" | "welded";
  };
}
```

---

# 6. Balustrade Specifications

## 6.1 Railing Types

```ts
interface BalustradeSystem {
  type: 'glass_frameless' | 'glass_spigot' | 'stainless_cables' | 'mild_steel_verticals';
  height: 1000 | 1100; // mm
  location: 'stair' | 'balcony' | 'void';

  // Glass Spec
  glass?: {
      thickness: 10 | 12 | 15 | 19; // mm
      type: 'tempered' | 'laminated_toughened';
      fixing: 'channel' | 'standoff';
  };

  // Metal Spec
  metal?: {
      grade: '304' | '316' (coastal);
      postSize: string; // "50mm Round"
      handrail: 'timber' | 'steel' | 'none';
  };
}
```

---

# 7. Safety & Compliance Rules (SANS 10400-M)

1.  **Rise & Going Rule:** `2 * Riser + Tread >= 570mm AND <= 650mm`.
2.  **Headroom:** Min **2.1m** vertical clearance above pitch line.
3.  **Landings:** Required every 3m vertical rise max.
4.  **Sphere Rule:** No opening in balustrade > 100mm (prevents child head entrapment).
5.  **Side Loading:** Balustrade must withstand 0.5kN/m (Res) or 1.5kN/m (Public).

---

# 8. BOQ Generation Logic (Volume 15)

## 8.1 Concrete Stair Quantities

1.  **Concrete (m3):** `(Steps_Vol + Waist_Vol + Landing_Vol) * 1.05`.
2.  **Formwork (m2):**
    - _Soffit:_ Sloped area underneath.
    - _Risers:_ `Width * Riser_Height * Number_of_Steps`.
    - _Strings:_ Side edges.
3.  **Rebar (ton):** Calculated per m run based on Waist thickness (approx 100kg/m3).

## 8.2 Balustrade Quantities

1.  **Railing (m):** Linear length along pitch line.
2.  **Glass (m2):** `Length * Height * 1.05` (Custom cutting).
3.  **Fixings (No):** Spigots count (2 per meter approx).

## 8.3 Finishes (Stair Specific)

1.  **Tiling (m2):** `(Tread_Depth + Riser_Height) * Width * Steps`.
2.  **Nosings (m):** `Width * Steps`.

---

# 9. Engineer Modal Interface

### Tab 1: Stair Generator

- **Auto-Calc:** Input "Height Difference", System output "18 Risers @ 172mm".
- **Rule Check:** "Warning: Riser too high!" (Red flag if > 200mm).

### Tab 2: Structure

- **Waist:** Slider for concrete thickness (standard 150-200mm).
- **Stringer:** Profile selector for Steel stairs.

### Tab 3: Balustrade Designer

- **Panel Style:** Glass / Cable / Bar.
- **Handrail:** Side mount vs Top mount.

### Tab 4: 3D Visualization

- **Headroom View:** Visual check of slab opening vs stair path.
- **Walkthrough:** First person view.

---

**END OF VOLUME XV**
