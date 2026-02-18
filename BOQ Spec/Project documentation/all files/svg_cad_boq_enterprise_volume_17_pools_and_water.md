# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification

## Volume XVII — Pools & Water Features: Structural, Hydraulic & Safety Specification

**Version:** 17.0  
**Revision Date:** 2026-02-18  
**Document Type:** Enterprise Engineering Specification

---

# 1. Document Control

- **Version:** 17.0
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** ********\_\_********

---

# 2. Scope

Volume XVII defines the **Swimming Pool & Water Feature Parameter System** for the SVG-Based Parametric CAD & BOQ Platform.
This volume addresses the high-value "Lifestyle" components of enterprise projects, covering structural shells, hydraulic circulation, heating, and critical safety compliance.

This document establishes:

- **Structure:** Gunite (Shotcrete), Hand-packed Concrete, Fiberglass/Pre-formed.
- **Finishes:** Marbelite (Plaster), Mosaic Tiling, Coping.
- **Hydraulics:** Pump sizing (Turnover rate), Filter sizing (Sand/Cartridge), Piping (Class 6-12).
- **Heating:** Solar Absorbers, Heat Pumps, Blankets.
- **Safety (SANS 10134):** Access control, Fencing, Nets, Self-latching gates.
- **Dual-Mode Engineering:** Standard (package deals) vs Engineer (custom hydraulic design).

---

# 3. Strategic Objective

The pool system must:

- **Volume Calculation:** Exact water volume (Litres) derived from complex 3D shape (Deep End/Shallow End).
- **Turnover Logic:** Automatically size the pump/filter to turnover the volume in 4-6 hours.
- **Excavation:** Calculate bulk earthworks including "over-dig" for formwork/gunite.
- **Safety First:** Flag any pool that does not have a compliant isolation barrier.

---

# 4. Structural Specification

## 4.1 Gunite / Concrete Shells

```ts
interface PoolShell {
  id: string;
  shape: "rect" | "kidney" | "lap" | "custom_polygon";
  dimensions: {
    length: number;
    width: number;
    depthShallow: number; // e.g. 1.0m
    depthDeep: number; // e.g. 1.8m
  };

  structure: {
    method: "gunite" | "hand_pack_concrete" | "shuttered_concrete";
    wallThickness: number; // e.g. 150mm
    floorThickness: number; // e.g. 150-200mm
    rebar: "Y10@200" | "Y12@200";
    ringBeam: "250x300";
  };
}
```

## 4.2 Finishes

```ts
interface PoolFinish {
  internal:
    | "marbelite_white"
    | "marbelite_charcoal"
    | "fiberglass_lining"
    | "fully_tiled";
  waterline: {
    tile: "ceramic_mosaic" | "glass_mosaic";
    height: 150; // mm
  };
  coping: {
    material: "concrete_bullnose" | "natural_stone" | "timber_deck";
    width: number;
  };
}
```

---

# 5. Hydraulic & Filtration System

## 5.1 Turnover Logic (SANS/NSPI)

- **Turnover Rate:** Volume / 4 hours (Residential) or 6 hours.
- **Pump Sizing:** Select pump (0.75kW / 1.1kW) based on required Flow Rate at Head (10m).
- **Filter Sizing:** Select Sand Filter (2-bag / 3-bag / 4-bag) to match Pump Flow Rate.

```ts
interface FiltrationPlant {
  volumeLitres: number;
  turnoverHours: 4 | 6;
  reqFlowRate: number; // L/min

  equipment: {
    pump: "0.45kW" | "0.75kW" | "1.1kW";
    filter: "sand_2bag" | "sand_3bag" | "cartridge_100";
    saltChlorinator: boolean;
  };
}
```

## 5.2 Piping & Lights

- **Suction:** Weir (Skimmer), Vacuum Point.
- **Return:** Aimflow jets (2-4 depending on size).
- **Lighting:** LED (Blue/White/RGB), quantity based on length (1 per 4m).

---

# 6. Safety Compliance (SANS 10134)

The system **MUST** verify access control. A pool cannot be finalised without a Safety Solution.

```ts
interface PoolSafety {
  primaryBarrier: "fence" | "wall" | "building_wall";
  height: number; // Min 1.2m

  gate: {
    selfLatching: boolean;
    opensOutwards: boolean;
  };

  secondaryProtection?: {
    net: "solid_pvc" | "mesh_safety";
    cover: "solar_bubble" | "automated_slat";
  };
}
```

---

# 7. BOQ Generation Logic (Volume 17)

## 7.1 Structural Quantities

1.  **Excavation (m3):** `(Shell_Vol + Overdig) * Bulking`.
2.  **Concrete/Gunite (m3):** `(Surface_Area * Thickness) * 1.05`.
3.  **Rebar (ton):** Mesh Ref 395/500 or Bars.
4.  **Marbelite (m2):** Internal Surface Area.
5.  **Mosaic (m):** Perimeter Length.

## 7.2 Equipment & Systems

1.  **Plant:** Pump, Filter, DB-Box (Pool), Chlorinator (Prime Cost Items).
2.  **Piping (m):** Distance from Weir to Plant + Plant to Jets.
3.  **Heating:** Solar Panels (m2 based on Pool Area x 60-80%).

---

# 8. Engineer Modal Interface

### Tab 1: Dimensions

- **Shape Tool:** Drag points to define custom shape.
- **Profile:** Draw depth profile (Shallow -> Deep).
- **Calculated:** Volume (L) and Mass (kg) updates in real-time.

### Tab 2: Specification

- **Color Picker:** Marbelite color.
- **Coping:** Select stone type.

### Tab 3: Plant Room

- **Location:** Place the pump/filter assembly (distance calc).
- **Selection:** Auto-suggest Pump size based on Volume.

### Tab 4: Safety Check

- **Compliance Output:** "Pass/Fail" on Fencing.
- **Warning:** "Gate required on East boundary".

---

**END OF VOLUME XVII**
