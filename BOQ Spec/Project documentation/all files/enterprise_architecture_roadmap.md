# Enterprise System Architecture & Roadmap: Completing the BIM Vision

## 1. Executive Summary

To achieve **True Enterprise Grade** status, the system must evolve from a "House Builder" (Walls/Roofs/Foundations) to a **Full Construction Engine** capable of handling complex multi-discipinary projects.

We have identified critical gaps in **Structural Framing**, **Finishes**, and **MEP (Mechanical, Electrical, Plumbing)**. This document outlines the roadmap to architectural completeness.

---

## 2. The "Dual-Mode" Standard

All new modules will adhere to the **Dual-Mode Engineering Architecture** established in Volume 7 & 11:

| Feature        | **Standard Mode** (Auto-Pilot)         | **Engineer Mode** (Power-User)        |
| :------------- | :------------------------------------- | :------------------------------------ |
| **Logic**      | "Deemed-to-Satisfy" Rules (SANS 10400) | Rational Design / First Principles    |
| **Input**      | Minimal (Click & Drag)                 | Parametric (Loads, Grades, Moments)   |
| **Output**     | Compliant Residential Spec             | Engineered Commercial/Industrial Spec |
| **Compliance** | Auto-Check against tables              | Engineer Signature/Override required  |

---

## 3. Systematic Gap Analysis & Proposed Volumes

We will create detailed Engineering Specifications for the following missing domains:

### 3.1 Structural Skeleton (New Volume 12)

_Current State:_ System handles load-bearing walls but lacks independent structural frames.

- **Scope:**
  - **RC Columns:** Square/Round/Rectangular, Reinforcement schedules (Y-bars/Stirrups).
  - **RC Beams:** Upstand/Downstand/Hidden beams, Span/Depth ratios.
  - **Steel Sections:** I-Beams, H-Columns (IPE/HEA), Base plates, Bolted connections.
  - **Slabs:** Suspended slabs (Rib & Block vs In-situ).
- **Engineering Logic (Vol 12):**
  - _Standard:_ Auto-size lintels and simple beams based on clear span (SANS 10400-K).
  - _Engineer:_ Define point loads, moments, shear reinforcement, custom steel grades (350W).

### 3.2 Architectural Finishes (New Volume 13)

_Current State:_ Basic "material" selection exists, but lacks layering and quantification details.

- **Scope:**
  - **Floor Finishes:** Screeds, Tiling (Ceramic/Porcelain), Carpets, Laminates, Skirting (Timber/PVC/Tile).
  - **Wall Finishes:**
    - _Wet:_ Plaster (Internal/External), Paint systems (Primer + 2 coats), Waterproofing.
    - _Dry:_ Cladding (Stone/Timber), Wallpaper, Dado rails.
  - **Ceiling Finishes:** Cornices, Bulkheads, Shadow-lines.
- **Engineering Logic (Vol 13):**
  - _Standard:_ Auto-calculate primer/undercoat/topcoat quantities based on surface area and spread rates.
  - _Engineer:_ Spec specialized systems (Epoxy floors, Acoustic paneling, Fire-rated coatings).

### 3.3 MEP Systems (New Volume 14)

_Current State:_ Basic "points" exist (sockets/taps) but no system logic (wiring/piping).

- **Scope:**
  - **Electrical (SANS 10142):**
    - DB Boards (Phase balancing).
    - Conduit routing (Slab vs Wall).
    - Wire sizing (1.5mm Light vs 2.5mm Power vs 6mm Stove).
    - Solar/Inverter integration.
  - **Plumbing (SANS 10252):**
    - Hot/Cold reticulation (Copper vs PEX/Multilayer).
    - Drainage (Stack systems, Vent valves, Inspection Eyes).
    - Geysers (Solar/Gas/Electric) & Heat Pumps.
  - **HVAC:**
    - Split Units (Back-to-back vs piping runs).
    - Ducted Systems (diffusers, return air).
- **Engineering Logic (Vol 14):**
  - _Standard:_ Auto-route "shortest path" pipes/wires using Manhattan distance + wall constraints. Auto-size Geyser based on bedroom count.
  - _Engineer:_ Manual pipe routing, Pressure ratings, DB circuit design, Solar yield calculations.

---

## 4. Implementation Priority Map

We are currently at **Volume 11 (Roofs)**. The proposed execution order to "Close the Loop" is:

1.  **Structure (Vol 12):** We cannot put Finishes or MEP into a building that doesn't structurally exist (e.g. Columns in open plan areas).
2.  **Finishes (Vol 13):** Floors and Walls need to be "finished" to define thickness and levels for MEP fixtures.
3.  **MEP (Vol 14):** The nervous system runs through the Structure and behind the Finishes.

---

## 5. Summary of Deliverables

I will create the following detailed specification documents:

1.  `svg_cad_boq_enterprise_volume_12_structural_skeleton.md`
2.  `svg_cad_boq_enterprise_volume_13_architectural_finishes.md`
3.  `svg_cad_boq_enterprise_volume_14_mep_systems.md`
4.  `svg_cad_boq_enterprise_volume_15_vertical_circulation.md`
5.  `svg_cad_boq_enterprise_volume_16_external_works.md`
6.  `svg_cad_boq_enterprise_volume_17_pools_and_water.md`
7.  `svg_cad_boq_enterprise_volume_18_specialized_systems.md`

Does this comprehensive roadmap accurately illustrate the "Enterprise Grade" scope you are envisioning?
