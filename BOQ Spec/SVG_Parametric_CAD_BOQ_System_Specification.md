# SVG-Based Parametric CAD & BOQ Engine

## Multi-Country Technical Drawing System (SANS-Compliant Ready)

**Generated:** 2026-02-16 23:35 UTC

------------------------------------------------------------------------

# 1. SYSTEM OBJECTIVE

Develop a fully parametric architectural drawing and BOQ engine capable
of:

-   Floor Plans
-   Roof Plans
-   Elevations
-   Sections
-   Automatic Dimensioning
-   Dynamic Title Blocks
-   Multi-country drawing standard compliance (SANS, EU, US, UK, etc.)
-   Live BOQ extraction directly from geometry

Technology Stack: - Next.js - Zustand - Pure SVG rendering -
Geometry-first architecture

NO WebGL. NO raster rendering. All output must remain vector-based.

------------------------------------------------------------------------

# 2. CORE ARCHITECTURE

The system must be divided into three independent layers:

## 2.1 Geometry Engine (Source of Truth)

All geometry must be stored in millimeters (mm). Never store projected
2D coordinates.

### Wall Structure

``` ts
interface Point3D {
  x: number
  y: number
  z: number
}

interface Wall {
  id: string
  start: Point3D
  end: Point3D
  height: number
  thickness: number
  type: "external" | "internal"
  materialLayers: Layer[]
}
```

### Roof Plane

``` ts
interface RoofPlane {
  id: string
  vertices: Point3D[]
  pitch: number
  type: "hip" | "gable" | "valley"
}
```

### Slab

``` ts
interface Slab {
  id: string
  polygon: Point3D[]
  thickness: number
}
```

All BOQ calculations must derive from this geometry layer.

------------------------------------------------------------------------

# 3. PROJECTION ENGINE

All views must be derived from mathematical projection of 3D geometry.

## 3.1 Plan View (Top Orthographic)

Ignore Z-axis:

x2d = x\
y2d = y

## 3.2 Elevation View (Front)

Ignore Y-axis:

x2d = x\
y2d = z

## 3.3 Section View

1.  Define section plane.
2.  Intersect geometry with plane.
3.  Extract cut faces.
4.  Project intersection to 2D.

------------------------------------------------------------------------

# 4. ELEVATION GENERATION

Steps:

1.  Define viewing direction vector.
2.  Filter walls facing that direction.
3.  Project orthographically.
4.  Perform depth sorting.
5.  Render using hierarchy.

Depth example (front elevation):

depth = y

Higher Y value = further from viewer.

------------------------------------------------------------------------

# 5. SECTION ENGINE

## 5.1 Section Plane Definition

Defined by: - Start point - End point - Viewing direction

Example: x = 2000 (vertical plane)

## 5.2 Intersection Logic

If wall spans across plane:

-   Compute intersection rectangle
-   Height = wall.height
-   Width = wall.thickness

## 5.3 Rendering Rules

  Geometry Type       Render Style
  ------------------- ----------------------
  Cut Geometry        Thick stroke + Hatch
  Beyond Geometry     Thin grey stroke
  In Front Geometry   Hidden or dashed

------------------------------------------------------------------------

# 6. ROOF GENERATION (HIP BASIC ALGORITHM)

1.  Detect closed exterior boundary.
2.  Offset boundary by overhang distance.
3.  Determine longest axis.
4.  Generate ridge along longest axis.
5.  Connect ridge endpoints to boundary vertices.
6.  Store all roof planes in 3D.

------------------------------------------------------------------------

# 7. DIMENSION ENGINE

Each dimension consists of:

-   Extension lines
-   Dimension line
-   Arrowheads
-   Measurement text

Distance calculation (3D):

distance = sqrt((x2-x1)\^2 + (y2-y1)\^2 + (z2-z1)\^2)

Units configurable globally (mm / m).

------------------------------------------------------------------------

# 8. LINE WEIGHT HIERARCHY

  Element         Stroke Width
  --------------- --------------
  Section Cut     4px
  External Wall   3px
  Internal Wall   2px
  Fixtures        1px
  Dimensions      1px
  Grid Lines      0.5px

All values configurable via StandardConfig.

------------------------------------------------------------------------

# 9. DYNAMIC TITLE BLOCK SYSTEM

## 9.1 Functional Requirements

The title block must dynamically detect:

-   Which views exist (Plan, Elevation, Section)
-   Scale per view
-   Drawing number
-   Revision history
-   Selected country standard
-   Project metadata

## 9.2 View Registry (Zustand)

``` ts
interface ViewEntry {
  id: string
  type: "plan" | "elevation" | "section"
  scale: string
}

interface ViewRegistry {
  views: ViewEntry[]
}
```

The TitleBlock component must:

-   Auto-generate drawing title based on view type
-   Display scale
-   Display revision table
-   Update automatically when views are added or removed

------------------------------------------------------------------------

# 10. MULTI-COUNTRY STANDARD CONFIGURATION

Create global configuration object:

``` ts
interface StandardConfig {
  country: "SANS" | "EU" | "US" | "UK"
  lineWeights: object
  hatchPatterns: object
  dimensionStyle: object
  titleBlockLayout: object
}
```

No drawing standards may be hardcoded. All rendering logic must
reference StandardConfig.

------------------------------------------------------------------------

# 11. BOQ INTEGRATION

BOQ must derive directly from geometry.

Examples:

Wall area = length × height\
Slab volume = area × thickness\
Roof area = polygon area

Section validation ensures material accuracy.

Drawings and BOQ must share the same geometry engine.

------------------------------------------------------------------------

# 12. EXPORT SYSTEM

Must support:

-   SVG export
-   Vector PDF export
-   Scale-correct printing

SVG viewBox must match real-world dimensions.

------------------------------------------------------------------------

# 13. PERFORMANCE REQUIREMENTS

-   Support 300+ walls
-   Memoize projection calculations
-   Use Zustand selectors
-   Avoid full redraw on small updates
-   Cache bounding boxes for intersection tests

------------------------------------------------------------------------

# 14. DEVELOPMENT PHASES

## Phase 1

-   Plan engine
-   Wall rendering
-   Basic dimensioning

## Phase 2

-   Roof generation
-   Elevations

## Phase 3

-   Section engine
-   Hatch rendering

## Phase 4

-   Dynamic title block
-   Multi-country configuration
-   PDF export

------------------------------------------------------------------------

# FINAL ENGINEERING PRINCIPLE

Plan = Top orthographic projection\
Elevation = Remove one axis\
Section = Intersect then project

All views must be mathematically derived from true 3D geometry.

If implemented according to this document, the platform will be capable
of producing professional, country-standard compliant architectural
technical drawings and fully integrated BOQs.
