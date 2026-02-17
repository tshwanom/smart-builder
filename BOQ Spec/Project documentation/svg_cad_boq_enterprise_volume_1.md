# SVG-Based Parametric CAD & BOQ Engine — Enterprise Specification
## Volume I — Geometry & Projection Engines

**Generated:** 2026-02-17 UTC

---

# 1. Document Control

- Version: 1.0
- Author: Engineering Team
- Revision Date: 2026-02-17
- Approval: __________________

---

# 2. Scope

Volume I defines the **core geometry and projection engines** of the SVG-based parametric CAD and BOQ system, including:

- Geometry Engine (Walls, Roofs, Slabs, Openings)
- Projection Engine (Plan, Elevation, Section)
- Elevation & Section Algorithms
- Roof Generation Logic

Deliverables:

- Parametric 3D geometry models
- Orthographic projections
- Algorithms for elevation, section, and roof generation

---

# 3. Definitions & Terminology

| Term | Definition |
|------|------------|
| 3D Geometry | True XYZ coordinates of building elements |
| Projection | Orthographic conversion from 3D to 2D |
| Section Plane | Plane cutting through geometry to expose internal structure |
| Cut Face | Intersection of geometry with section plane |
| Elevation Plane | Orthographic projection plane for building side views |
| Hatch | Pattern fill to indicate material in sections |
| StandardConfig | Configuration object defining country drawing standards |

---

# 4. Geometry Engine

## 4.1 Wall Data Model

```ts
interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Layer {
  material: string;
  thickness: number;
}

interface Wall {
  id: string;
  start: Point3D;
  end: Point3D;
  height: number;
  thickness: number;
  type: 'external' | 'internal';
  materialLayers: Layer[];
}
```

### Notes:
- Store dimensions in **millimeters**
- All walls must include **material layers** for BOQ derivation
- Orientation vectors are computed: `direction = normalize(end - start)`

---

## 4.2 Roof Plane Data Model

```ts
interface RoofPlane {
  id: string;
  vertices: Point3D[];
  pitch: number; // degrees
  type: 'hip' | 'gable' | 'valley';
}
```

### Notes:
- Roof planes are stored in **true 3D coordinates**
- Overhangs are computed by offsetting polygon vertices outward along roof slope

---

## 4.3 Slab Data Model

```ts
interface Slab {
  id: string;
  polygon: Point3D[];
  thickness: number;
}
```

- Polygon must define a **closed loop**
- Thickness defines **vertical extrusion**
- Used for BOQ volume calculation

---

## 4.4 Opening Data Model

```ts
interface Opening {
  id: string;
  parentWallId: string;
  position: Point3D;
  width: number;
  height: number;
  type: 'door' | 'window';
}
```

- Openings stored relative to parent wall for projection calculations

---

# 5. Projection Engine

## 5.1 Plan View (Top Orthographic)

- Ignores Z-axis

```
x2d = x
y2d = y
```

- Projects walls, slabs, openings, and roof outlines

## 5.2 Elevation View

- Ignores depth axis (Y for front elevation)

```
x2d = x
y2d = z
```

- Steps:
  1. Filter walls facing view
  2. Project vertices to 2D
  3. Sort by depth (Y)
  4. Render lines and cutouts for openings

## 5.3 Section View

- Defined by vertical cutting plane (X, Y, or arbitrary)
- Intersects walls, slabs, roofs, openings
- Extract cut faces and project to 2D:

```
x2d = plane_axis_1
y2d = z
```

- Cut face rendered thick + hatch, beyond geometry light gray

---

# 6. Elevation Generation

## Algorithm Steps

1. Define viewing direction vector (e.g., front: (0,-1,0))
2. Filter walls with normal approximately facing the view
3. Project wall bottom and top lines
4. Apply depth sorting
5. Render wall faces, roof outlines, openings

### Pseudocode

```ts
function generateElevation(viewDir: Vector3D) {
  const visibleWalls = walls.filter(wall => facesDirection(wall, viewDir));
  let projectedElements = [];
  for (const wall of visibleWalls) {
    projectedElements.push(projectWall(wall, viewDir));
    for (const opening of wall.openings) {
      projectedElements.push(projectOpening(opening, viewDir));
    }
  }
  projectedElements.push(...projectRoofs(roofs, viewDir));
  return sortByDepth(projectedElements);
}
```

---

# 7. Section Generation

## Algorithm Steps

1. Define section plane (start, end, direction)
2. Intersect all geometry
3. Extract cut faces
4. Project to 2D
5. Hatch cut faces, render beyond geometry light gray

### Pseudocode

```ts
function generateSection(sectionPlane: Plane) {
  const cutElements = [];
  const beyondElements = [];
  for (const element of geometry) {
    if (intersects(element, sectionPlane)) {
      cutElements.push(intersectionFace(element, sectionPlane));
    } else if (isBeyond(element, sectionPlane)) {
      beyondElements.push(project(element));
    }
  }
  return renderSorted(beyondElements, cutElements);
}
```

---

# 8. Roof Generation

## Hip Roof Algorithm

1. Detect exterior polygon of building
2. Offset by overhang distance
3. Determine longest axis → ridge line
4. Connect ridge endpoints to polygon vertices
5. Store roof planes with pitch in 3D

### Pseudocode

```ts
function generateHipRoof(buildingPolygon: Point3D[], pitch: number) {
  const outerBoundary = offsetPolygon(buildingPolygon, overhang);
  const ridge = computeRidgeLine(outerBoundary);
  const roofPlanes = connectRidgeToCorners(ridge, outerBoundary, pitch);
  return roofPlanes;
}
```

---

# 9. Notes

- All calculations in **mm**
- Projection and section engines are **fully parametric**
- Roof, slab, wall, and opening geometries are **single source of truth** for BOQ, dimensions, and drawings
- Hidden line removal optional at Phase 2

---

# 10. Next Steps (Volume II)

- Dimensioning Engine
- Line Weight & Layering System
- Dynamic Title Block System
- BOQ Engine
- Multi-country Standard Abstraction
- Export & Rendering Pipeline
- Security, Integrity, and Testing Specification

