import { RoofPlane, RoofGeometry, Vec2, RoofEdge, RoofEdgeType } from './types'
import { PlaneClipper } from './PlaneClipper'
import { createRoofPlane } from './RoofPlane'

export interface EdgeDirective {
  behavior: 'hip' | 'gable' | 'none'
  pitch?: number           // per-wall pitch override (degrees)
  baselineHeight?: number  // for split-level roofs
  extensionLength?: number // For Gables: how far to extend into the roof (dynamic per edge)
}

export interface RoofInput {
  footprint: Vec2[]           // ordered CCW polygon vertices
  edgeDirectives: EdgeDirective[]  // one per footprint edge
  defaultPitch: number        // degrees
  overhang: number            // distance (same units as footprint coords)
}

export class RoofEngine {
    
    /**
     * Generates analytical roof geometry from a footprint polygon.
     */
    static generate(input: RoofInput): RoofGeometry {
        const { footprint, edgeDirectives, defaultPitch, overhang } = input
        const planes: RoofPlane[] = []
        const n = footprint.length
     
        // Ensure Winding? We assume CCW for Inward Normals to be Left.
        
        // Simple Centroid for normal check
        const cx = footprint.reduce((s, p) => s + p.x, 0) / n
        const cy = footprint.reduce((s, p) => s + p.y, 0) / n
        const center = { x: cx, y: cy }

        // Compute Bounding Polygon (Eave + Gable Extensions)
        // We offset each edge according to its directive (Overhang vs Extension)
        // and intersect them to form the new polygon.
        
        const offsetLines: {start: Vec2, end: Vec2}[] = []
        for (let i = 0; i < n; i++) {
            const p1 = footprint[i]
            const p2 = footprint[(i + 1) % n]
            
            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const len = Math.sqrt(dx*dx + dy*dy)
            const nx = dy / len
            const ny = -dx / len
            
            const directive = edgeDirectives[i]
            
            // Allow directive to override extension length (default to 5000 if not set)
            // But we should try to be smarter.
            const extensionDist = (directive.extensionLength !== undefined) 
                ? directive.extensionLength 
                : ((overhang > 10) ? 5000 : 5.0)
            
            const offsetDist = (directive.behavior === 'gable') ? extensionDist : overhang

            offsetLines.push({
                start: { x: p1.x + nx * offsetDist, y: p1.y + ny * offsetDist },
                end: { x: p2.x + nx * offsetDist, y: p2.y + ny * offsetDist }
            })
        }
        
        // Reconstruct vertices by intersection
        const boundingPoly: Vec2[] = []
        for (let i = 0; i < n; i++) {
            const l1 = offsetLines[i]
            const l2 = offsetLines[(i + 1) % n]
            
            const pt = computeIntersectionInfinite(l1.start, l1.end, l2.start, l2.end)
            if (pt) boundingPoly.push(pt)
            else boundingPoly.push(l2.start) // Parallel fallback
        }
        
        const eavePolygon = boundingPoly

        for (let i = 0; i < n; i++) {
            const directive = edgeDirectives[i]
            if (directive.behavior === 'gable' || directive.behavior === 'none') continue

            const p1 = footprint[i]
            const p2 = footprint[(i + 1) % n]
            
            const pitch = directive.pitch !== undefined ? directive.pitch : defaultPitch
            
            // Generate Plane
            const plane = createRoofPlane(
                i,
                p1, p2,
                2700, // Fixed plate height or from directive
                pitch
            )
            
            // Check direction to center (Inward Normal Check)
            const midX = (p1.x + p2.x) / 2
            const midY = (p1.y + p2.y) / 2
            const toCenterX = center.x - midX
            const toCenterY = center.y - midY
            
            if (plane.inwardNormal.x * toCenterX + plane.inwardNormal.y * toCenterY < 0) {
                // If normal points away, flip it
                plane.inwardNormal.x *= -1
                plane.inwardNormal.y *= -1
            }

            // Initial polygon is the EAVE polygon (including Overhang + Extensions)
            plane.trimmedPolygon = eavePolygon.map(p => ({...p})) 
            
            planes.push(plane)
        }
        
        // 2. Trim Planes against each other
        // For every pair (A, B), clip A by B (keep part where A is lower).
        for (let i = 0; i < planes.length; i++) {
            for (let j = 0; j < planes.length; j++) {
                if (i === j) continue
                
                const P = planes[i]
                const Q = planes[j]
                
                const dotP = P.baselineRef.x * P.inwardNormal.x + P.baselineRef.y * P.inwardNormal.y
                const dotQ = Q.baselineRef.x * Q.inwardNormal.x + Q.baselineRef.y * Q.inwardNormal.y
                
                const A = P.slopeRise * P.inwardNormal.x - Q.slopeRise * Q.inwardNormal.x
                const B = P.slopeRise * P.inwardNormal.y - Q.slopeRise * Q.inwardNormal.y
                const C = (P.baselineHeight - Q.baselineHeight) 
                          - (P.slopeRise * dotP) 
                          + (Q.slopeRise * dotQ)
                          
                // If A and B are ~0, planes are parallel.
                if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) {
                    // If C > 0, then zP > zQ always (P is above Q).
                    // So P should be completely removed.
                    if (C > 1e-4) {
                        P.trimmedPolygon = []
                    }
                    // Else P is below Q, keeping it.
                    continue
                }
                
                // Clip P's polygon against line Ax + By + C <= 0
                if (P.trimmedPolygon && P.trimmedPolygon.length > 0) {
                     P.trimmedPolygon = PlaneClipper.clipPolygon(P.trimmedPolygon, A, B, C)
                }
            }
        }
        
        // 3. Remove Empty Planes
        const activePlanes = planes.filter(p => p.trimmedPolygon && p.trimmedPolygon.length > 2)
        
        // 4. Extract Edges
        const edges: RoofEdge[] = []
        
        activePlanes.forEach(p => {
             const poly = p.trimmedPolygon!
             for(let k=0; k<poly.length; k++) {
                 const v1 = poly[k]
                 const v2 = poly[(k+1)%poly.length]
                 
                 // Classify Edge
                 // Check if Midpoint lies on Eave Polygon (Original Footprint + Overhang)
                 const mid = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 }
                 let isEave = false
                 
                 for (let eIdx = 0; eIdx < eavePolygon.length; eIdx++) {
                     const ep1 = eavePolygon[eIdx]
                     const ep2 = eavePolygon[(eIdx+1)%eavePolygon.length]
                     
                     const dx = ep2.x - ep1.x
                     const dy = ep2.y - ep1.y
                     const lenSq = dx*dx + dy*dy
                     if (lenSq < 1e-9) continue
                     
                     // Projection t
                     const t = ((mid.x - ep1.x) * dx + (mid.y - ep1.y) * dy) / lenSq
                     if (t >= -0.01 && t <= 1.01) { // Extend slightly for endpoints
                         // Perpendicular distance
                         const distSq = Math.pow((ep1.x + t*dx) - mid.x, 2) + Math.pow((ep1.y + t*dy) - mid.y, 2)
                         if (distSq < 1e-4) { // 1e-4 tolerance
                              isEave = true
                              break
                         }
                     }
                 }

                 edges.push({
                     start: v1,
                     end: v2,
                     type: isEave ? RoofEdgeType.EAVE : RoofEdgeType.HIP,
                     planeA: p.id
                 })
             }
             
             // Calculate Area
             p.area = PlaneClipper.polygonArea(poly) * Math.sqrt(1 + p.slopeRise * p.slopeRise)
        })

        const isValid = (p: Vec2) => isFinite(p.x) && isFinite(p.y) && Math.abs(p.x) < 1000000 && Math.abs(p.y) < 1000000
        const validEdge = (e: { start: Vec2; end: Vec2 }) => isValid(e.start) && isValid(e.end)

        // 5. GENERATE SLOPE ARROWS
        const slopeArrows: { position: Vec2; vector: Vec2; text: string }[] = []
        
        for(const plane of activePlanes) {
            if (!plane.trimmedPolygon || plane.trimmedPolygon.length < 3) continue
            
            // Calculate Centroid
            let cx = 0, cy = 0
            plane.trimmedPolygon.forEach(p => { cx += p.x; cy += p.y })
            const center = { x: cx / plane.trimmedPolygon.length, y: cy / plane.trimmedPolygon.length }
            
            const pitchDeg = Math.atan(plane.slopeRise) * (180 / Math.PI)
            
            slopeArrows.push({
                position: center,
                vector: plane.inwardNormal, // Pointing UP the roof
                text: `${pitchDeg.toFixed(1)}°`
            })
        }

        return {
            planes: activePlanes,
            edges: edges.filter(validEdge),
            ridges: edges.filter(e => e.type === RoofEdgeType.RIDGE).filter(validEdge),
            hips: edges.filter(e => e.type === RoofEdgeType.HIP).filter(validEdge),
            valleys: edges.filter(e => e.type === RoofEdgeType.VALLEY).filter(validEdge),
            eaves: edges.filter(e => e.type === RoofEdgeType.EAVE).filter(validEdge),
            slopeArrows
        }
    }
}

// Helper for infinite line intersection
function computeIntersectionInfinite(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): Vec2 | null {
    const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x)
    if (Math.abs(d) < 1e-9) return null // Parallel

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d
    
    return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
    }
}
