import { RoofGeometry, RoofEdge, RoofEdgeType, RoofPlane, Vec2 } from './analytics/types'
import { PlaneClipper } from './analytics/PlaneClipper'
import { PolygonProcessor } from './PolygonProcessor'
import { Point } from '../../../application/types'

/**
 * CSG (Constructive Solid Geometry) for Roofs.
 * 
 * Implements "Union" by trimming planes against each other.
 * We want the outer surface of the combined volumes.
 * Logic: A plane P is visible if P is ABOVE the other roof surface.
 */
export class RoofCSG {

    /**
     * Unions multiple roof geometries into one.
     * Keeps the HIGHEST surface at any point.
     */
    static union(geometries: RoofGeometry[]): RoofGeometry {
        if (geometries.length === 0) return { ridges: [], hips: [], valleys: [], eaves: [], slopeArrows: [], planes: [], edges: [] }
        if (geometries.length === 1) return geometries[0]

        // 1. Flatten all planes but keep track of source geometry
        const planes: (RoofPlane & { roofId: number })[] = []
        geometries.forEach((g, idx) => {
            if (g.planes) planes.push(...g.planes.map(p => ({
                ...p, 
                trimmedPolygon: p.trimmedPolygon ? [...p.trimmedPolygon] : [],
                roofId: idx
            })))
        })
        
        if (planes.length === 0) return geometries[0]

        // 2. Perform Plane-Level CSG (Clipping)
        // For each Plane P, we want to keep the parts where P is ABOVE all other roofs.
        // P > RoofB  <=>  P > min(Q_in_B)  <=>  OR_k (P > Q_k)
        
        const finalPlanes: RoofPlane[] = []
        
        for (let i = 0; i < planes.length; i++) {
            const P = planes[i]
            let visiblePoly = [P.trimmedPolygon!] // Start with full polygon (as array of paths)
            
            // Check against every OTHER roof (group of planes)
            for (let rIdx = 0; rIdx < geometries.length; rIdx++) {
                if (rIdx === P.roofId) continue // Don't clip against self-roof (already done by RoofEngine)

                const otherPlanes = planes.filter(p => p.roofId === rIdx)
                if (otherPlanes.length === 0) continue
                
                // We need to calculate Union( P clipped to P > Q ) for all Q in otherPlanes
                const allowedFragments: Vec2[][] = []
                
                // Optimization: Check if P overlaps the Other Roof's footprint at all
                let overlapsAny = false
                for(const Q of otherPlanes) {
                    if (polyOverlap(P.trimmedPolygon, Q.trimmedPolygon)) {
                        overlapsAny = true; break
                    }
                }
                // If NO overlap with any plane of R, then R is "far away".
                // In that case, P > R is trivially true (because R planes dip to -infinity outside).
                if (!overlapsAny) continue 

                
                let coveredByAnyClipper = false

                for (const Q of otherPlanes) {
                    // Clip P by condition: P > Q
                    // Equation: zP - zQ = Ax + By + C
                    // We want Ax + By + C >= 0
                    // PlaneClipper clips to <= 0. So use -A, -B, -C.
                    
                    const dotP = P.baselineRef.x * P.inwardNormal.x + P.baselineRef.y * P.inwardNormal.y
                    const dotQ = Q.baselineRef.x * Q.inwardNormal.x + Q.baselineRef.y * Q.inwardNormal.y
                    
                    const A = P.slopeRise * P.inwardNormal.x - Q.slopeRise * Q.inwardNormal.x
                    const B = P.slopeRise * P.inwardNormal.y - Q.slopeRise * Q.inwardNormal.y
                    const C = (P.baselineHeight - Q.baselineHeight) - (P.slopeRise * dotP) + (Q.slopeRise * dotQ)
                    
                    // Handle coplanar/parallel
                    if (Math.abs(A) < 1e-4 && Math.abs(B) < 1e-4) {
                        if (C >= -0.01) { // 10mm tolerance
                             // P >= Q always (or close).
                             // If nearly identical (C ~ 0), break usage symmetry to avoid Z-fighting.
                             if (Math.abs(C) < 0.01 && P.id > Q.id) {
                                 // We discard P if P > Q in ID.
                                 // So only one of the pair survives.
                             } else {
                                 allowedFragments.push(...visiblePoly)
                                 coveredByAnyClipper = true
                             }
                        }
                        continue
                    }
                    
                    // Clip current Visible Part against this halfspace
                    // We want Union of (VisiblePoly AND HalfSpace(P>Q))
                    // Clip P's base polygon
                    const fragments = P.trimmedPolygon ? PlaneClipper.clipPolygon(P.trimmedPolygon, -A, -B, -C) : []
                    // Only keep non-degenerate fragments
                    if (fragments.length > 2) {
                        allowedFragments.push(fragments)
                        coveredByAnyClipper = true
                    }
                }
                
                // If we found NO planes Q where P > Q, then P is completely inside R.
                if (!coveredByAnyClipper) {
                     visiblePoly = [] // P is hidden
                     break 
                }
                
                // visiblePoly = Intersection( visiblePoly, Union(allowedFragments) )
                
                // Convert to simple points for PolygonProcessor
                // VisiblePoly is Vec2[][], convert to Point[][]
                const polySubject = visiblePoly.map(p => p.map(pt => ({x:pt.x, y:pt.y}))) as Point[][]
                const allowedPoints = allowedFragments.map(p => p.map(pt => ({x:pt.x, y:pt.y}))) as Point[][]
                
                // Union of all allowed fragments
                const polyClip = PolygonProcessor.union(allowedPoints)
                
                 if (polyClip.length === 0) {
                    visiblePoly = []
                    break
                }
                
                const intersected = PolygonProcessor.intersection(polySubject, polyClip)
                visiblePoly = intersected.map(poly => poly.map(pt => ({x:pt.x, y:pt.y})))
                
                if (visiblePoly.length === 0) break
            }
            
            // Add resulting polygons as new planes
            if (visiblePoly.length > 0) {
                visiblePoly.forEach((polyPoints, idx) => {
                     // Check min area
                     if (Math.abs(PolygonProcessor.calculateSignedArea(polyPoints)) < 0.01) return

                     const newPlane = { ...P, id: `${P.id}_split_${idx}`, trimmedPolygon: polyPoints }
                     finalPlanes.push(newPlane)
                })
            }
        }
        
        // 3. Collect Output
        const result: RoofGeometry = {
            ridges: [], hips: [], valleys: [], eaves: [],
            slopeArrows: [], planes: finalPlanes, edges: []
        }
        
        // Collect edges from final planes and classify
        const originalEdges: RoofEdge[] = []
        geometries.forEach(g => {
            if (g.eaves) originalEdges.push(...g.eaves.map(e => ({...e, type: RoofEdgeType.EAVE, planeA: '', planeB: ''})))
            if (g.ridges) originalEdges.push(...g.ridges.map(e => ({...e, type: RoofEdgeType.RIDGE, planeA: '', planeB: ''})))
            if (g.hips) originalEdges.push(...g.hips.map(e => ({...e, type: RoofEdgeType.HIP, planeA: '', planeB: ''})))
            if (g.valleys) originalEdges.push(...g.valleys.map(e => ({...e, type: RoofEdgeType.VALLEY, planeA: '', planeB: ''})))
        })
        
        finalPlanes.forEach(p => {
             const poly = p.trimmedPolygon!
             for(let k=0; k<poly.length; k++) {
                 const v1 = poly[k]
                 const v2 = poly[(k+1)%poly.length]
                 
                 // Default to VALLEY (since new cuts are valleys)
                 let type = RoofEdgeType.VALLEY 
                 
                 // Try to match original
                 for (const old of originalEdges) {
                      // Relaxed check: 10cm tolerance?
                      if (isSubSegment({start: v1, end: v2}, old, 0.1)) {
                          type = old.type
                          break
                      }
                 }
                 
                 const edge = { start: v1, end: v2 }
                 if (type === RoofEdgeType.EAVE) result.eaves.push(edge)
                 else if (type === RoofEdgeType.RIDGE) result.ridges.push(edge)
                 else if (type === RoofEdgeType.HIP) result.hips.push(edge)
                 else result.valleys.push(edge)
             }
             
             // Slope arrows
             const cx = poly.reduce((s, pt) => s + pt.x, 0) / poly.length
             const cy = poly.reduce((s, pt) => s + pt.y, 0) / poly.length
             const pitchDeg = Math.atan(p.slopeRise) * (180 / Math.PI)
             result.slopeArrows.push({ position: {x:cx,y:cy}, vector: p.inwardNormal, text: `${pitchDeg.toFixed(1)}°`})
        })

        return result
    }
}

// -- Helpers --

function polyOverlap(p1?: Vec2[], p2?: Vec2[]) {
    if (!p1 || !p2 || p1.length<3 || p2.length<3) return false
    // bounding box check
    let minX1=Infinity, maxX1=-Infinity, minY1=Infinity, maxY1=-Infinity
    p1.forEach(p => { minX1=Math.min(minX1,p.x); maxX1=Math.max(maxX1,p.x); minY1=Math.min(minY1,p.y); maxY1=Math.max(maxY1,p.y) })
    
    let minX2=Infinity, maxX2=-Infinity, minY2=Infinity, maxY2=-Infinity
    p2.forEach(p => { minX2=Math.min(minX2,p.x); maxX2=Math.max(maxX2,p.x); minY2=Math.min(minY2,p.y); maxY2=Math.max(maxY2,p.y) })
    
    return !(maxX1 < minX2 || minX1 > maxX2 || maxY1 < minY2 || minY1 > maxY2)
}

function isSubSegment(segA: {start: Vec2, end: Vec2}, segB: {start: Vec2, end: Vec2}, tolerance = 0.05): boolean {
    const dist1 = pointToLineDist(segA.start, segB.start, segB.end)
    const dist2 = pointToLineDist(segA.end, segB.start, segB.end)
    
    if (dist1 > tolerance || dist2 > tolerance) return false 
    
    const bVec = {x: segB.end.x - segB.start.x, y: segB.end.y - segB.start.y}
    const bLenSq = bVec.x*bVec.x + bVec.y*bVec.y
    if (bLenSq < 1e-6) return false
    
    const t1 = ((segA.start.x - segB.start.x) * bVec.x + (segA.start.y - segB.start.y) * bVec.y) / bLenSq
    const t2 = ((segA.end.x - segB.start.x) * bVec.x + (segA.end.y - segB.start.y) * bVec.y) / bLenSq
    
    const minT = Math.min(t1, t2)
    const maxT = Math.max(t1, t2)
    
    // Strict overlap: Does [minT, maxT] overlap [0, 1]?
    // And length > 0
    return maxT > -0.01 && minT < 1.01
}

function pointToLineDist(p: Vec2, a: Vec2, b: Vec2): number {
    const ab = {x: b.x - a.x, y: b.y - a.y}
    const ap = {x: p.x - a.x, y: p.y - a.y}
    const lenSq = ab.x*ab.x + ab.y*ab.y
    if (lenSq < 1e-9) return Math.sqrt(ap.x*ap.x + ap.y*ap.y)
    
    const crossVal = ab.x * ap.y - ab.y * ap.x
    return Math.abs(crossVal) / Math.sqrt(lenSq)
}
