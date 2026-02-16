import { RoofPlane, RoofGeometry, Vec2, RoofEdge, RoofEdgeType } from './types'
import { createRoofPlane } from './RoofPlane'
import { computeStraightSkeleton, SkeletonResult } from './StraightSkeleton'
import { PlaneClipper } from './PlaneClipper'

export interface EdgeDirective {
  behavior: 'hip' | 'gable' | 'none'
  pitch?: number
  baselineHeight?: number
}

export interface RoofInput {
  footprint: Vec2[]           // Outer wall face polygon (from union of wall rectangles)
  edgeDirectives: EdgeDirective[]
  defaultPitch: number
  overhang: number            // Roof overhang beyond outer face
}

export class RoofEngine {

    /**
     * Generates roof geometry from a footprint polygon using the Straight Skeleton.
     * 
     * Input footprint = outer wall face (computed by GeometryBuilder via polygon union).
     * The overhang extends the footprint outward for the eave polygon.
     * The returned geometry.footprint = the INPUT footprint (outer wall face, green line).
     */
    static generate(input: RoofInput): RoofGeometry {
        const { footprint, edgeDirectives, defaultPitch, overhang } = input
        const n = footprint.length

        // Detect coordinate scale
        const maxCoord = footprint.reduce((m, p) => Math.max(m, Math.abs(p.x), Math.abs(p.y)), 0)
        const isMillimeters = maxCoord > 500
        const plateHeight = isMillimeters ? 2700 : 2.7

        // ── Step 1: Compute eave polygon (footprint + overhang) ──
        let eavePolygon: Vec2[]
        if (overhang > 0) {
            eavePolygon = offsetPolygon(footprint, overhang)
            if (eavePolygon.length < 3) eavePolygon = [...footprint]
        } else {
            eavePolygon = [...footprint]
        }

        console.log(`[RoofEngine] Footprint: ${n} verts → eave: ${eavePolygon.length} verts`)
        console.log(`[RoofEngine] Eave polygon:`, eavePolygon.map(p => `(${Math.round(p.x)},${Math.round(p.y)})`).join(' → '))

        // ── Step 2: Compute Straight Skeleton ──
        const skeleton: SkeletonResult = computeStraightSkeleton(eavePolygon)

        console.log(`[RoofEngine] Skeleton: ${skeleton.faces.length} faces, ${skeleton.arcs.length} arcs`)

        if (skeleton.faces.length === 0) {
            console.error('[RoofEngine] Skeleton produced no faces')
            return emptyGeometry()
        }

        // ── Step 3: Create RoofPlanes from skeleton faces ──
        const planes: RoofPlane[] = []

        for (const face of skeleton.faces) {
            const edgeIdx = face.edgeIndex % n
            const directive = edgeDirectives[edgeIdx]
            if (directive?.behavior === 'none') continue

            const p1 = eavePolygon[edgeIdx]
            const p2 = eavePolygon[(edgeIdx + 1) % eavePolygon.length]
            const pitch = directive?.pitch ?? defaultPitch
            const baseline = directive?.baselineHeight ?? plateHeight

            const plane = createRoofPlane(edgeIdx, p1, p2, baseline, pitch)
            plane.trimmedPolygons = [face.polygon]
            planes.push(plane)
        }

        console.log(`[RoofEngine] Created ${planes.length} roof planes`)

        // ── Step 4: Classify and extract edges ──
        const edges: RoofEdge[] = []
        const toleranceSq = isMillimeters ? 2500.0 : 0.0025

        for (const plane of planes) {
            if (!plane.trimmedPolygons) continue

            for (const poly of plane.trimmedPolygons) {
                for (let k = 0; k < poly.length; k++) {
                    const v1 = poly[k]
                    const v2 = poly[(k + 1) % poly.length]

                    // Classify edge
                    const mid = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 }
                    let isEave = false

                    // Check if edge lies on the eave polygon
                    for (let eIdx = 0; eIdx < eavePolygon.length; eIdx++) {
                        const ev1 = eavePolygon[eIdx]
                        const ev2 = eavePolygon[(eIdx + 1) % eavePolygon.length]
                        const edx = ev2.x - ev1.x
                        const edy = ev2.y - ev1.y
                        const eLenSq = edx * edx + edy * edy
                        if (eLenSq < 1e-9) continue

                        const t = ((mid.x - ev1.x) * edx + (mid.y - ev1.y) * edy) / eLenSq
                        if (t >= -0.1 && t <= 1.1) {
                            const projX = ev1.x + t * edx
                            const projY = ev1.y + t * edy
                            const distSq = (projX - mid.x) ** 2 + (projY - mid.y) ** 2
                            if (distSq < toleranceSq) {
                                isEave = true
                                break
                            }
                        }
                    }

                    let type: RoofEdgeType
                    if (isEave) {
                        type = RoofEdgeType.EAVE
                    } else {
                        type = classifyInternalEdge(plane, planes, v1, v2, isMillimeters)
                    }

                    edges.push({
                        start: v1,
                        end: v2,
                        type,
                        planeA: plane.id
                    })
                }
            }

            // Calculate area
            let totalArea = 0
            plane.trimmedPolygons?.forEach(poly => {
                totalArea += PlaneClipper.polygonArea(poly)
            })
            plane.area = totalArea * Math.sqrt(1 + plane.slopeRise * plane.slopeRise)
        }

        // ── Step 5: Slope Arrows ──
        const slopeArrows: { position: Vec2; vector: Vec2; text: string }[] = []

        for (const plane of planes) {
            const polygons = plane.trimmedPolygons
            if (!polygons || polygons.length === 0) continue

            let maxArea = -1
            let bestPoly: Vec2[] | null = null

            for (const poly of polygons) {
                const area = PlaneClipper.polygonArea(poly)
                if (area > maxArea && poly.length >= 3) {
                    maxArea = area
                    bestPoly = poly
                }
            }

            if (bestPoly) {
                let cx = 0, cy = 0
                bestPoly.forEach(p => { cx += p.x; cy += p.y })
                const center = { x: cx / bestPoly.length, y: cy / bestPoly.length }
                const pitchDeg = Math.atan(plane.slopeRise) * (180 / Math.PI)

                slopeArrows.push({
                    position: center,
                    vector: plane.inwardNormal,
                    text: `${pitchDeg.toFixed(1)}°`
                })
            }
        }

        // ── Step 6: Sanity filter ──
        const isValid = (p: Vec2) => isFinite(p.x) && isFinite(p.y) && Math.abs(p.x) < 1000000 && Math.abs(p.y) < 1000000
        const validEdge = (e: { start: Vec2; end: Vec2 }) => isValid(e.start) && isValid(e.end)

        return {
            planes,
            edges: edges.filter(validEdge),
            ridges: edges.filter(e => e.type === RoofEdgeType.RIDGE).filter(validEdge),
            hips: edges.filter(e => e.type === RoofEdgeType.HIP).filter(validEdge),
            valleys: edges.filter(e => e.type === RoofEdgeType.VALLEY).filter(validEdge),
            eaves: edges.filter(e => e.type === RoofEdgeType.EAVE).filter(validEdge),
            slopeArrows,
            footprint  // Outer wall face from polygon union (green line)
        }
    }
}

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

function emptyGeometry(): RoofGeometry {
    return { planes: [], edges: [], ridges: [], hips: [], valleys: [], eaves: [], slopeArrows: [] }
}


/**
 * Classifies an internal (non-eave) edge based on which planes share it.
 */
function classifyInternalEdge(
    currentPlane: RoofPlane,
    allPlanes: RoofPlane[],
    v1: Vec2, v2: Vec2,
    isMillimeters: boolean
): RoofEdgeType {
    const tolerance = isMillimeters ? 50.0 : 0.05
    const mid = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 }

    for (const other of allPlanes) {
        if (other.id === currentPlane.id) continue
        if (!other.trimmedPolygons) continue

        for (const poly of other.trimmedPolygons) {
            for (let k = 0; k < poly.length; k++) {
                const ov1 = poly[k]
                const ov2 = poly[(k + 1) % poly.length]

                const oMid = { x: (ov1.x + ov2.x) / 2, y: (ov1.y + ov2.y) / 2 }
                const dx = mid.x - oMid.x
                const dy = mid.y - oMid.y

                if (dx * dx + dy * dy < tolerance * tolerance) {
                    // Shared edge — classify by normal direction
                    const d = currentPlane.inwardNormal.x * other.inwardNormal.x +
                              currentPlane.inwardNormal.y * other.inwardNormal.y

                    if (d < -0.5) return RoofEdgeType.RIDGE

                    // Hip vs Valley by cross product
                    const cross = currentPlane.inwardNormal.x * other.inwardNormal.y -
                                  currentPlane.inwardNormal.y * other.inwardNormal.x

                    if (cross < 0) return RoofEdgeType.VALLEY
                    return RoofEdgeType.HIP
                }
            }
        }
    }

    return RoofEdgeType.HIP
}

/**
 * Offsets a polygon outward by distance d.
 * Handles both convex and concave (L-shaped, T-shaped) polygons.
 * Uses miter join at all vertices, with spike limiting for very acute angles.
 */
function offsetPolygon(polygon: Vec2[], distance: number): Vec2[] {
    const n = polygon.length
    if (n < 3) return [...polygon]

    // 1. Determine polygon winding via signed area
    let signedArea = 0
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        signedArea += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y
    }
    const windingSign = signedArea > 0 ? 1 : -1

    // 2. Compute outward normals for each edge
    const normals: Vec2[] = []
    for (let i = 0; i < n; i++) {
        const p1 = polygon[i]
        const p2 = polygon[(i + 1) % n]
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len < 1e-9) {
            normals.push({ x: 0, y: 0 })
        } else {
            normals.push({
                x: windingSign * dy / len,
                y: windingSign * -dx / len
            })
        }
    }

    // 3. Compute offset edges
    const offsetEdges: { start: Vec2, end: Vec2 }[] = []
    for (let i = 0; i < n; i++) {
        const p1 = polygon[i]
        const p2 = polygon[(i + 1) % n]
        const nx = normals[i].x
        const ny = normals[i].y
        offsetEdges.push({
            start: { x: p1.x + nx * distance, y: p1.y + ny * distance },
            end: { x: p2.x + nx * distance, y: p2.y + ny * distance }
        })
    }

    // 4. Miter join at every vertex — ALWAYS produces exactly n vertices
    //    (1:1 mapping with input polygon for skeleton edge indexing)
    const result: Vec2[] = []
    for (let i = 0; i < n; i++) {
        const prevIdx = (i - 1 + n) % n
        const prevEdge = offsetEdges[prevIdx]
        const currEdge = offsetEdges[i]

        const ix = lineLineIntersect(
            prevEdge.start, prevEdge.end,
            currEdge.start, currEdge.end
        )

        if (ix) {
            // Spike limiter: if miter is too far, clamp along bisector direction
            const origV = polygon[i]
            const miterDist = Math.sqrt((ix.x - origV.x) ** 2 + (ix.y - origV.y) ** 2)
            const maxMiterDist = Math.abs(distance) * 4

            if (miterDist <= maxMiterDist) {
                result.push(ix)
            } else {
                // Clamp: move along same direction, but limit distance
                const scale = maxMiterDist / miterDist
                result.push({
                    x: origV.x + (ix.x - origV.x) * scale,
                    y: origV.y + (ix.y - origV.y) * scale
                })
            }
        } else {
            // Parallel edges: offset original vertex directly
            const nx = (normals[(i - 1 + n) % n].x + normals[i].x) / 2
            const ny = (normals[(i - 1 + n) % n].y + normals[i].y) / 2
            result.push({
                x: polygon[i].x + nx * distance,
                y: polygon[i].y + ny * distance
            })
        }
    }

    return result
}

/** Line-line intersection (treating segments as infinite lines) */
function lineLineIntersect(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null {
    const d = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x)
    if (Math.abs(d) < 1e-9) return null
    const t = ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / d
    return {
        x: a1.x + t * (a2.x - a1.x),
        y: a1.y + t * (a2.y - a1.y)
    }
}
