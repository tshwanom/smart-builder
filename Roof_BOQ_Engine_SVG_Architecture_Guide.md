# Roof BOQ Engine + SVG Plan Visualization

## Technical Architecture & Implementation Guide

------------------------------------------------------------------------

# 1. Objective

Build an accurate **roof BOQ calculation system** without 3D modeling
by:

1.  Computing roof planes analytically (mathematical surfaces).
2.  Trimming planes using 2D computational geometry.
3.  Extracting ridge / valley / hip / eave edges.
4.  Rendering results in SVG (plan view only).
5.  Calculating all BOQ quantities from analytical geometry.

No meshes.\
No 3D rendering.\
No WebGL.

Everything is derived from 2D math + slope factors.

------------------------------------------------------------------------

# 2. Core Principle

Each roof plane is defined as a mathematical function:

z(x, y) = baselineHeight + dot((P - baselineRef), inwardNormal) \*
slopeRise

Where:

-   baselineRef → reference point on eave line\
-   inwardNormal → unit vector pointing toward ridge\
-   slopeRise → rise per 1 unit horizontal run\
-   baselineHeight → height at eave

The visible roof surface is the **lower envelope** of all planes.

At any (x, y), the visible surface is the plane with the lowest z-value.

------------------------------------------------------------------------

# 3. System Architecture

## 3.1 Data Flow

Walls (2D footprint)\
↓\
Generate roof planes\
↓\
Trim planes (2D polygon clipping)\
↓\
Classify edges\
↓\
Compute BOQ metrics\
↓\
Render SVG

------------------------------------------------------------------------

# 4. Data Structures

## 4.1 Vec2

interface Vec2 { x: number y: number }

------------------------------------------------------------------------

## 4.2 RoofPlane

interface RoofPlane { id: string baseline: \[Vec2, Vec2\] baselineRef:
Vec2 baselineHeight: number inwardNormal: Vec2 slopeRise: number
trimmedPolygon?: Vec2\[\] }

------------------------------------------------------------------------

## 4.3 RoofEdge

interface RoofEdge { start: Vec2 end: Vec2 type: "EAVE" \| "RIDGE" \|
"VALLEY" \| "HIP" planeA: string planeB?: string }

------------------------------------------------------------------------

# 5. Step 1 --- Generate Roof Planes

For each footprint edge:

1.  Baseline = footprint edge\
2.  inwardNormal = perpendicular vector pointing inside\
3.  slopeRise = based on pitch (e.g. tan(angle))\
4.  baselineHeight = eave height

Ensure inwardNormal is unit length.

------------------------------------------------------------------------

# 6. Step 2 --- Trim Planes (Ownership Computation)

Each plane initially owns the entire footprint.

For each pair of planes P and Q:

f(P) = zP - zQ

Expand to:

f(P) = C + gradX \* Px + gradY \* Py

Where:

grad = nP \* slopeP - nQ \* slopeQ

The line where f(P) = 0 is the ridge/valley line.

Clip P's polygon to:

f(P) ≤ 0

Use Sutherland--Hodgman clipping against this half-plane.

------------------------------------------------------------------------

# 7. Edge Extraction & Classification

After trimming, inspect each polygon edge.

If edge lies on footprint boundary → EAVE

If edge is shared between planes → RIDGE / VALLEY / HIP

Classification rule:

If inward normals face each other → RIDGE\
If inward normals face away → VALLEY\
If exterior intersection → HIP

------------------------------------------------------------------------

# 8. BOQ Calculations

## 8.1 Plan Area

Use Shoelace formula to compute 2D polygon area.

## 8.2 True Roof Surface Area

slopeFactor = sqrt(1 + slopeRise²)\
trueArea = planArea \* slopeFactor

## 8.3 Ridge / Valley / Hip Lengths

length = distance(p1, p2)

If sloped length required:

trueLength = length \* slopeFactor

## 8.4 Rafter Length

horizontalRun = max distance from baseline to ridge\
rafterLength = horizontalRun \* slopeFactor

------------------------------------------------------------------------

# 9. SVG Rendering Layer

Render analytical results only.

## Roof Plane

`<polygon points="x1,y1 x2,y2 x3,y3" />`{=html}

## Edge

`<line x1="" y1="" x2="" y2="" />`{=html}

Color coding example:

EAVE → black\
RIDGE → red\
VALLEY → blue dashed\
HIP → green

------------------------------------------------------------------------

# 10. Precision Guidelines

Use EPS = 1e-9 for:

-   Height comparisons\
-   Cross product checks\
-   Parallel detection

Always normalize vectors.

Avoid mutating original polygon arrays during clipping.

------------------------------------------------------------------------

# 11. Why 3D Is Not Required

3D introduces:

-   Floating point drift\
-   Mesh triangulation errors\
-   Projection complexity

Analytical planes provide:

-   Exact ridge positions\
-   Exact areas\
-   Deterministic BOQ outputs

------------------------------------------------------------------------

# 12. Conclusion

This system:

-   Produces accurate ridge and valley geometry\
-   Computes exact sloped roof areas\
-   Generates reliable BOQ metrics\
-   Renders clean SVG roof plan view\
-   Avoids unnecessary 3D complexity

It is optimized for construction-grade BOQ software.
