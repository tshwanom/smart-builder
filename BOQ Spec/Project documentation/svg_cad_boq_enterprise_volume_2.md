# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification
## Volume II — Dimensioning, Title Blocks, BOQ & Multi-Country Compliance

**Generated:** 2026-02-17 UTC

---

# 1. Document Control

- Version: 2.0
- Author: Engineering Team
- Revision Date: 2026-02-17
- Approval: __________________

---

# 2. Scope

Volume II defines the **dimensioning engine, dynamic title block system, BOQ derivation engine, and multi-country compliance configuration**. It builds on Volume I (Geometry & Projection Engines) and focuses on: 

- Automatic measurement extraction
- Multi-standard title block generation
- BOQ computation from geometry
- Compliance with SANS, EU EN, UK BS, US ANSI standards

---

# 3. Dimensioning Engine

## 3.1 Principles

- Dimensions are derived from **true 3D geometry**
- Extension lines, dimension lines, and arrowheads are generated automatically
- Units configurable (mm, m)
- Text placement is dynamic and avoids overlaps

## 3.2 Distance Calculation

```
distance = sqrt((x2-x1)^2 + (y2-y1)^2 + (z2-z1)^2)
```

## 3.3 Dimension Types

| Type | Description |
|------|-------------|
| Linear | Between two points along a straight axis |
| Aligned | Along a wall or object edge |
| Radial | For circles and arcs |
| Angular | Angle between two lines |

## 3.4 Algorithm Pseudocode

```ts
function generateDimension(start: Point3D, end: Point3D) {
  const dist = computeDistance(start, end);
  const arrow = createArrowheads(start, end);
  const line = createDimensionLine(start, end);
  const label = placeText(dist, optimalPosition(line));
  return { line, arrow, label };
}
```

---

# 4. Dynamic Title Block System

## 4.1 Requirements

- Detect which views are present (Plan, Elevation, Section)
- Show scale per view
- Include project metadata
- Revision table with automatic updates
- Multi-country standard selection

## 4.2 Architecture

- **View Registry** in Zustand tracks all views
- **TitleBlock Component** reads registry and renders metadata

```ts
interface ViewEntry {
  id: string;
  type: 'plan' | 'elevation' | 'section';
  scale: string;
}

interface ViewRegistry {
  views: ViewEntry[];
}
```

- Auto-update triggers when new views are added or removed

---

# 5. BOQ Engine

## 5.1 Principles

- Quantities derived directly from geometry engine
- Consistent with elevations, sections, and plans
- Supports multiple materials, layers, and openings

## 5.2 Example Calculations

```
Wall Area = length * height
Slab Volume = area * thickness
Roof Area = polygonArea(vertices)
```

## 5.3 Algorithm Pseudocode

```ts
function generateBOQ(geometry) {
  const boqItems = [];
  for (const wall of geometry.walls) {
    const area = computeWallArea(wall);
    boqItems.push({ item: 'Wall', material: wall.materialLayers, quantity: area });
  }
  for (const slab of geometry.slabs) {
    const volume = computeSlabVolume(slab);
    boqItems.push({ item: 'Slab', material: slab.materialLayers, quantity: volume });
  }
  // Repeat for roofs, openings, etc.
  return boqItems;
}
```

## 5.4 Export

- CSV, XLSX, ERP integration
- Multi-currency support
- Waste factor configurable per material
- VAT rules configurable per country

---

# 6. Multi-Country Standard Compliance

## 6.1 StandardConfig Object

```ts
interface StandardConfig {
  country: 'SANS' | 'EU' | 'US' | 'UK';
  lineWeights: Record<string, number>;
  hatchPatterns: Record<string, string>;
  dimensionStyle: object;
  titleBlockLayout: object;
}
```

- Every drawing engine reads from StandardConfig
- No hardcoded line weights, hatches, or title blocks
- Ensures compliance with local and international standards

## 6.2 Compliance Mapping Tables

- Example: SANS line weights vs EN line weights
- Section hatch pattern differences
- Title block layout variations per country
- Dimension style conventions per standard

---

# 7. Notes

- BOQ and drawing outputs **share the same geometry engine** to avoid inconsistencies
- All algorithms fully parametric and dynamically update with geometry changes
- Multi-standard configuration ensures **portability across countries**

---

# 8. Next Steps (Volume III)

- Rendering & Export Pipeline (SVG, PDF, Print)
- Line Weight & Layering Engine
- Security & Integrity Layer
- Testing & Validation Specification
- Deployment Architecture & Performance Optimization

