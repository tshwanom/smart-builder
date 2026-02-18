# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification

## Volume XIV — MEP Systems: Mechanical, Electrical, Plumbing Specification & BOQ Integration

**Version:** 14.0  
**Revision Date:** 2026-02-18  
**Document Type:** Enterprise Engineering Specification

---

# 1. Document Control

- **Version:** 14.0
- **Author:** Engineering Team
- **Revision Date:** 2026-02-18
- **Approval:** ********\_\_********

---

# 2. Scope

Volume XIV defines the **MEP (Mechanical, Electrical, and Plumbing) Parameter System** for the SVG-Based Parametric CAD & BOQ Platform.
This volume represents the "Nervous System" and "Circulatory System" of the building, integrating complex routing logic within the Structural Skeleton (Vol 12).

This document establishes:

- **Electrical:** Wiring, DB Boards, Outlets, Lighting, Earthing (SANS 10142).
- **Plumbing:** Supply (Hot/Cold), Drainage (Sewer/Stormwater), Sanware (SANS 10252).
- **HVAC:** Split Units, Ducted Systems, Ventilation.
- **Routing Logic:** "Manhattan Distance" pathfinding through walls/ceilings.
- **Dual-Mode Engineering:** Standard (Auto-Route) vs Engineer (Schematic Design).
- **BOQ Quantification:** Linear meters of Pipe/Wire, Count of Fittings/Accessories.

---

# 3. Strategic Objective

The MEP system must:

- **Connectivity:** Understand that a switch connects to a light, and a tap connects to a geyser.
- **Capacity Checks:** Warn if too many plugs are on one breaker, or if a pipe is undersized for flow.
- **Collision Avoidance:** Prevent pipes clashing with steel columns (Basic Level).
- **Schematic Generation:** Auto-generate Single Line Diagrams (Electrical) and Isometric Layouts (Plumbing).

---

# 4. Electrical Systems (SANS 10142)

## 4.1 Electrical Components

```ts
interface ElectricalPoint {
  id: string;
  type: "socket" | "switch" | "light" | "isolator" | "db_board";
  mountingHeight: number; // AFL

  // Circuit Logic
  circuitId: string; // Links to DB Breaker
  loadInWatts: number; // e.g. 3500W for Geyser
  phase: "Red" | "White" | "Blue" | "Single";
}

interface CircuitBreaker {
  amperage: 10 | 20 | 32 | 40 | 63;
  type: "SP" | "DP" | "TP"; // Poles
  curve: "B" | "C" | "D"; // Trip curve
  cableSize: "1.5mm" | "2.5mm" | "4mm" | "6mm" | "10mm";
}
```

## 4.2 Wiring Logic (Standard Mode)

1.  **Grouping:** Auto-group points by room (e.g., "Kitchen Plugs Circuit").
2.  **Routing:** Calculate path: Point -> Ceiling Void -> Orthogonal Route -> DB Board.
3.  **Vertical Drops:** Add (Ceiling Height - Mounting Height) for each point.
4.  **Conduit:** Assume PVC conduit in walls, wireways in ceiling.

---

# 5. Plumbing Systems (SANS 10252)

## 5.1 Supply System (Pressurized)

```ts
interface SupplyPoint {
  id: string;
  type: "tap" | "mixer" | "cistern" | "washing_machine";
  reqFlow: number; // L/min
  reqTemp: "cold" | "hot" | "balanced";
}

interface PipeSegment {
  material: "copper" | "pex" | "multilayer";
  diameter: 15 | 22 | 28 | 32; // mm
  length: number;
  fittings: {
    elbows: number;
    tees: number;
    couplers: number;
  };
}
```

## 5.2 Drainage System (Gravity)

- **Slope Logic:** Enforce minimum gradients (1:60 for <110mm, 1:100 for 110mm).
- **Venting:** Ensure every stack has a Vent Valve or Open Vent to atmosphere.
- **Inspection:** Auto-place Rodding Eyes at directional changes > 45°.

---

# 6. HVAC Systems

## 6.1 Split Units

- **Indoor Unit:** Wall mounted.
- **Outdoor Unit:** Ground/Wall bracket mounted.
- **Piping:** Insulated Copper pair + Comms cable + Condensate drain.
- **Constraint:** Max pipe length check (e.g. 15m).

## 6.2 Ducted Systems (Engineer Mode)

- **Ducting:** Galvanized sheet metal or Flexible duct.
- **Diffusers:** Ceiling grid integration.
- **Return Air:** Grilles and filter boxes.

---

# 7. BOQ Generation Logic (Volume 14)

## 7.1 Electrical Quantification

1.  **Wire (m):** `(Horizontal_Route + Vertical_Drops) * 1.1 (Wastage)`.
2.  **Conduit (m):** Same as wire length within walls/slab.
3.  **Accessories (No):** Count of Sockets, Switches, Light Fittings.
4.  **DB Board:** Enclosure + Total Breakers + Earth Leakage + Main Switch.

## 7.2 Plumbing Quantification

1.  **Pipe (m):** `Sum(Segment_Lengths) * 1.05`.
2.  **Fittings (No):** Auto-detected Tees (Junctions) and Elbows (Turns).
3.  **Insulation (m):** For all Hot Water pipes.
4.  **Sanware:** Baths, Basins, WC suites (Prime Cost Items).

---

# 8. Engineer Modal Interface

### Tab 1: Layout & Points

- **Toolbox:** Drag & Drop Sockets, Switches, Taps.
- **Auto-Place:** "Place socket every 3m on perimeter walls".

### Tab 2: Circuits & DB (Electrical)

- **Load Schedule:** Table of Circuits, Amps, Wire Size.
- **Phase Balance:** Visual check of R/W/B loading (Commercial).

### Tab 3: Piping Design (Plumbing)

- **Material Spec:** Select Class 0/1/2 Copper or PEX-Al-PEX.
- **Geyser Sizing:** Calculator (Persons \* 50L + Kitchen).

### Tab 4: Schematics

- **View:** Generated "Skeleton View" of just pipes/wires.
- **Clash Check:** Highlight pipes intersecting Columns.

---

**END OF VOLUME XIV**
