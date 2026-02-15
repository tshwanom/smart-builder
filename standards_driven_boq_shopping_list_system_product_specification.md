# Standards‑Driven BOQ & Shopping List System

## 1. Purpose of This Document

This document defines **exactly what must be built** for Phase 1 of the system. It is written to align business vision, product behavior, and developer execution.

The goal is **not** to build a complicated, technical tool for experts only.

The goal **is** to build a **standards‑driven construction intelligence system** that empowers **anyone**—from homeowners to builders—to:

- **Sketch or Trace** a simple floor plan.
- **Auto-Comply** with national building standards (SANS 10400).
- **Instantly Generate**:
  - A **Professional BOQ** (Bank/Contractor ready).
  - A **Phased Shopping List** (What to buy, when to buy it).
  - A **Precise Cost Estimate** (Materials & Labour).

This system must remove uncertainty and guesswork from construction.

---

## 2. Target Users

### Primary Users

- Homeowners / individuals (non‑technical)
- Small contractors & builders
- Construction companies

### Secondary (Future Phases)

- Material suppliers
- Project managers
- Quantity surveyors

---

## 3. Core Product Philosophy

**The "Black Box" Principle:**

> The User provides the **Intent** (Sketch).
> The System handles the **Complexity** (Engineering, Standards, Calc).

Users should never hear about "SANS 10400" or "Brickforce spacing". They should just see a wall that is built correctly.

### What the user sees

- Simple controls
- Real‑world quantities ("285 bags of cement")
- Clear total cost

### What the system enforces silently

- National building standards
- Reinforcement rules
- Structural logic
- Waste allowances
- Mandatory construction elements

---

## 4. Country & Standards System (Phase 1)

### Phase 1 Country

- **South Africa**

### Standards Applied

- SANS 10400 (National Building Regulations)
- SANS 10100 (Concrete)
- SANS 920 (Bricks)
- SANS masonry & reinforcement rules

### Important Rule

Standards **must not** be hard‑coded into calculations.

They must exist as **rules** that can later be swapped for:

- Botswana
- Namibia
- Other countries

---

## 5. How You Design (The "Magic" Part)

### 5.1 The "Magic Trace" (Preferred)

Most users have a PDF or image of a plan.

1. **Upload** the image.
2. **Set Scale** (Click two points, type "5 meters").
3. **Trace**: The system guides the mouse, snapping to lines.

_Result: A rough image becomes a smart model in minutes._

### 5.2 The "Napkin Sketch"

Start from scratch.

- Draw a box -> It becomes a room.
- Drag a wall -> It adjusts connections.
- Intelligent sizing (e.g. standard corridor widths).

_Result: Sketching feels like playing a game, not using CAD._

---

## 6. Intelligent Building Elements

### 6.1 Rooms

Each room must support:

- Length & width (derived from sketch)
- Height (editable)
- Wall type (load‑bearing / partition)
- Finishes:
  - Floor
  - Wall
  - Ceiling

Room data drives:

- Finishes quantities
- Ceiling materials
- Floor materials

---

### 6.2 Walls (Critical)

Walls are **behavioral objects**, not lines.

Each wall must have:

- Length
- Height
- Internal / external
- Load‑bearing or non‑load‑bearing
- Associated openings

System responsibilities:

- Decide wall thickness (per standard)
- Decide foundation requirements
- Insert brickforce automatically (e.g. every 3 courses)
- Insert DPC at correct height

---

### 6.3 Smart Openings (Windows & Doors)

Drag-and-drop windows and doors into walls.

**The System Automatically:**

- Cuts the bricks.
- Inserts the correct **Lintel** (sized by span).
- Adds extra reinforcement around the opening.
- Adjusts plaster and paint calculations.

_User Action: "Put a door here."_
_System Action: "Structural engineering involved in putting a door here."_

---

### 7. Auto-Foundations

If a wall represents a structure, the system **automatically** digs the foundation.

- **Excavation**: Calculated automatically.
- **Concrete**: Volume matched to standard footing sizes.
- **Steel**: Added if terrain/load requires it.

_No manual foundation design required._

---

## 8. Roof System (Geometry‑Driven)

### Roof Definition

Users must be able to:

- Select walls
- Define roof type per wall:
  - Gable
  - Hip
- Set roof pitch (angle)

---

### Roof Calculations (System‑Driven)

From roof geometry, system must calculate:

- Roof surface area (true area, not plan area)
- Number of trusses
- Battens / purlins length
- Ridge tiles
- Hip tiles
- Roof tiles (including waste)
- Underlay

User only sets **intent**, system calculates **reality**.

---

## 9. Outputs (CRITICAL)

### 9.1 Professional BOQ (QS / Contractor)

This output must:

- Follow standard BOQ sections
- Be suitable for banks, contractors, and professionals
- Include:
  - Preliminaries
  - Site works
  - Structural works
  - Finishes
  - Roof
  - Contingencies & escalation

Export formats:

- PDF
- Excel

---

### 9.2 The "Builder's Shopping List" (The Killer Feature)

This is not just a list; it is a **Procurement Plan**.

Items must be **Grouped by Construction Phase** to be useful:

#### Phase 1: Foundations (The "Ground" List)

- Cement (bags)
- Stone (m³)
- Sand (m³)
- Reinforcement

#### Phase 2: Shell (The "Wall" List)

- Bricks (pallets/count)
- Brickforce (rolls)
- DPC (rolls)
- Window/Door Frames (if steel)
- Lintels

#### Phase 3: Roof (The "Cover" List)

- Trusses
- Tiles/Sheeting
- Timber (Battens/Purlins)

#### Phase 4: Finishes (The "Pretty" List)

- Plaster Sand
- Paint (Litres)
- Tiles (m²)
- Adhesive & Grout

**Language:** Plain English. "285 Bags of Cement", not "14.25 tons cementitious material".

---

### 9.3 Cost Summary

User must see:

- Materials only cost
- Optional labour cost
- Total project cost

User must be able to toggle:

- Materials only
- Materials + labour

---

## 10. Pricing System (Phase 1)

Phase 1 pricing:

- Static regional price tables
- Market average pricing

Later:

- Supplier‑driven pricing

Quantities and pricing must be **separate systems**.

---

## 11. Future Phases (Not Required Now)

### 11.1 Supplier Marketplace

- Suppliers sign up
- List compliant materials
- Region‑based pricing
- System matches quantities to suppliers

---

### 11.2 Project Management

- Project timelines
- Material delivery stages
- Task tracking
- Budget vs actual

---

## 12. Phase 1 Definition of Done

Phase 1 is successful when:

- A user can import or sketch a house
- Modify rooms, walls, heights, openings, finishes
- System enforces SANS standards automatically
- User receives:
  - A professional BOQ
  - A simple shopping list
  - A clear total cost

No manual quantity input.
No standards guessing.

---

## 13. Final Product Statement

> **"Don't guess. Just draw.**
>
> **Draw your dream home, and we'll tell you exactly what to buy and what it costs to build—brick for brick, cent for cent."**

This is the promise. Simplicity in the front, Engineering in the back.
