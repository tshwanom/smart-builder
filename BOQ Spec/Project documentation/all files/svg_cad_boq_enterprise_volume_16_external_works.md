# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification

## Volume XVI — External Works: Site Development, Landscaping & Security

**Version:** 16.0  
**Revision Date:** 2026-02-18  
**Document Type:** Enterprise Engineering Specification

---

# 1. Document Control

- **Version:** 16.0
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** ********\_\_********

---

# 2. Scope

Volume XVI defines the **External Works Parameter System** for the SVG-Based Parametric CAD & BOQ Platform.
This volume moves beyond the building envelope to quantify the entire site development, converting the "Plot" into a "finished product".

This document establishes:

- **Civil Works:** Bulk earthworks, Cut & Fill calculation, Stormwater management.
- **Retaining Structures:** Gravity walls, Gabions, Concrete block walls.
- **Hardscaping:** Driveways, Patios, Paving (Brick/Cobble/Slab), Kerbing.
- **Softscaping:** Lawn establishment, Planting beds, Irrigation points.
- **Perimeter Security:** Boundary walls, Fencing (Palisade/Mesh/Electric), Gates.
- **Dual-Mode Engineering:** Standard (Decorative) vs Engineer (Structural Civil).

---

# 3. Strategic Objective

The external works system must:

- **Terrain Awareness:** (Future) Integrate with Surveyor Points/Contours to calculate Cut & Fill volumes.
- **Site Logic:** Understand "Inside Boundary" vs "Road Reserve".
- **Drainage:** Quantify surface water channels and soakaways.
- **Curb Appeal:** Allow detailed specification of driveway patterns and garden layouts.

---

# 4. Civil Engineering & Earthworks

## 4.1 Earthworks Specification

```ts
interface Earthworks {
  operation: "site_allowance" | "bulk_excavation" | "filling" | "cart_away";
  soilType: "soft" | "intermediate" | "hard_rock";
  volume: number; // m3

  // Compaction
  compaction: {
    layerThickness: 150; // mm
    density: "93% MOD AASHTO" | "98% MOD AASHTO";
  };
}
```

## 4.2 Retaining Walls

```ts
interface RetainingWall {
  type:
    | "gravity_brick"
    | "reinforced_concrete"
    | "gabion_basket"
    | "interlocking_block";
  height: number;
  length: number;

  // Engineering
  drainage: {
    subsoilPipe: boolean;
    fabricFilter: boolean;
    stoneBackfill: number; // m3
  };

  structure: {
    footingWidth: number;
    wallThickness: number; // Base vs Top
    batterAngle: number; // degrees
  };
}
```

---

# 5. Hardscaping (Paving & Driveways)

## 5.1 Paving Types

```ts
interface PavingSystem {
  id: string;
  type: "driveway" | "pathway" | "patio" | "pool_surround";
  trafficLoad: "pedestrian" | "light_vehicle" | "heavy_vehicle";

  // Surface
  paver: {
    material: "clay_brick" | "concrete_bond" | "slate" | "cobble";
    thickness: 50 | 60 | 80; // mm (80mm for driveway)
    pattern: "herringbone" | "stretcher" | "basket_weave";
  };

  // Sub-base (Crucial for cost)
  layerworks: {
    beddingSand: 25; // mm
    subbaseG5: number; // mm (e.g. 150mm)
    compaction: boolean;
  };

  // Edging
  edging: {
    type: "conc_kerb" | "soldier_course_brick" | "hidden_haunching";
    length: number;
  };
}
```

---

# 6. Softscaping (Landscaping)

```ts
interface Landscaping {
  type: "lawn_kikuyu" | "lawn_lm" | "artificial_turf" | "planting_bed";
  area: number;

  // Soil Prep
  prep: {
    compost: number; // m3 per 100m2
    fertilizer: string;
    topsoilImport: number; // m3
  };

  // Plant material
  planting?: {
    trees: { size: "20L" | "50L" | "100L"; count: number }[];
    shrubs: { size: "4L" | "10L"; count: number }[];
  };
}
```

---

# 7. Perimeter Security

## 7.1 Fencing Solution

```ts
interface BoundaryFence {
  side: "front" | "back" | "left" | "right";
  length: number;

  system: {
    type: "brick_wall" | "palisade_steel" | "clearvu_mesh" | "electric_strand";
    height: 1800 | 2100 | 2400; // mm
  };

  foundation: {
    type: "strip_footing" | "post_concrete";
    size: string;
  };

  // Access control
  gates: {
    type: "sliding" | "swing" | "pedestrian";
    width: number;
    motorized: boolean; // Links to Vol 18 (Electrical)
  }[];
}
```

---

# 8. BOQ Generation Logic (Volume 16)

## 8.1 Paving Quantification

1.  **Pavers (m2):** `Area * 1.05 (Cutting)`.
2.  **Bedding Sand (m3):** `Area * 0.025m`.
3.  **Sub-base G5 (m3):** `Area * 0.15m * 1.3 (Bulking factor)`.
4.  **Kerbing (m):** Perimeter length of paved area.

## 8.2 Wall Quantification

1.  **Brick Wall:** Same logic as Vol 9 (Masonry), but with "Facebrick both sides" option.
2.  **Palisade:** `Length / Panel_Width` = Number of Panels + Posts.

## 8.3 Gate Quantification

1.  **Gate (No):** Prime Cost Item + Installation Labor.
2.  **Track (m):** For sliding gates (`Length * 2`).

---

# 9. Engineer/Landscape Architect Modal Interface

### Tab 1: Site Plan

- **Draw Tool:** Outline Driveways, Lawns, and Pools.
- **Layers:** "Hardscaping" vs "Softscaping".

### Tab 2: Levels (Civil Engineer)

- **Slopes:** Define fall for stormwater (min 1:60).
- **Retaining:** Click-and-drag Retaining wall on boundary.

### Tab 3: Specification

- **Paving:** Select Paver, Grouting (Sand/Cement).
- **Planting:** Drag & Drop Trees (Visual placeholders).

### Tab 4: Security

- **Perimeter:** Assign specific fence types to specific boundary lines.
- **Electrification:** Checkbox for "Add 6-strand Electric Fence top".

---

**END OF VOLUME XVI**
