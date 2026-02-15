import { Point, Wall, RoofPanel } from '../../../application/types'
import { RoofGeometry, RoofEngine, RoofInput, EdgeDirective } from '../analytics/RoofEngine'
import { RoofPlane, Vec2 } from '../analytics/types'
import { PolygonProcessor } from '../PolygonProcessor'
import { RoofCSG } from '../RoofCSG'

/**
 * Bridge between Application Layer (Walls/Points) and Analytical Geometry Layer.
 * Renamed to RoofGenerator to match previous interface used by RoofRenderer.
 */
export class RoofGenerator {

    /**
     * Entry point for Multi-Room Roof Generation from Panels.
     * This iterates panels (rooms) and generates geometry for each.
     */
    static generateFromRoofPanels(
        panels: RoofPanel[],
        rooms: { id: string, polygon: Point[] }[], // We need rooms to get polygons if panel doesn't have it explicitly
        walls: Wall[],
        globalPitch: number,
        globalOverhang: number,
        arrowOffset: number = 0.8
    ): RoofGeometry | null {
        console.log('[RoofGenerator] ANALYTICAL ENGINE ACTIVATED - generateFromRoofPanels')
        
        // 1. Resolve and Clean Polygons first
        const resolvedPanels = panels.map(panel => {
            let polygon: Point[] = panel.footprint || []
            
            // If virtual/room-based:
            if ((!polygon || polygon.length < 3) && panel.roomId) {
                const room = rooms.find(r => r.id === panel.roomId)
                if (room) polygon = room.polygon
            }
            
            if (!polygon || polygon.length < 3) return null

            // Clean polygon to ensure consistent geometry
            const cleaned = PolygonProcessor.cleanPolygon(polygon.map(p => ({x: p.x, y: p.y})))
            if (cleaned.length < 3) return null

            return {
                panel,
                polygon: cleaned
            }
        }).filter(item => item !== null) as { panel: RoofPanel, polygon: Point[] }[]

        const geometries: RoofGeometry[] = []
        const allPolys = resolvedPanels.map(p => p.polygon)

        // 2. Generate Geometry with Shared Edge Detection
        for(let i = 0; i < resolvedPanels.length; i++) {
            const current = resolvedPanels[i]
            const { panel, polygon } = current

            // Calculate Shared Edges detailed info
            const sharedInfo = this.calculateSharedEdgeInfo(polygon, allPolys)

            // Determine Config
            const pitch = panel.pitchedConfig?.pitch ?? globalPitch
            const overhang = globalOverhang

            // Generate
            const geom = this.generateSingleRoof(polygon, walls, pitch, overhang, sharedInfo)
            
            if (geom) {
                geometries.push(geom)
            }
        }
        
        // 4. Union Geometries (CSG)
        if (geometries.length > 0) {
            const combined = RoofCSG.union(geometries)
            console.log(`[RoofGenerator] Generated ${geometries.length} roots -> Union resulted in ${combined.planes.length} planes`)
            return combined
        }

        return null
    }

    /**
     * Single Roof Generation Wrapper
     */
    static generateSingleRoof(
        polygon: Point[],
        walls: Wall[],
        pitch: number,
        overhang: number,
        sharedInfo: { isShared: boolean, isSubordinate: boolean, dominantSpan?: number }[] = []
    ): RoofGeometry | null {
        // Prepare analytical input
        const maxCoord = polygon.reduce((max, p) => Math.max(max, Math.abs(p.x), Math.abs(p.y)), 0)
        const isMillimeters = maxCoord > 500
        
        // Default half-thickness
        // Offset to Outer Face:
        const wallOffset = isMillimeters ? -110 : -0.11
        
        // Expand to Outer Face
        // We assume input 'polygon' is already cleaned.
        let polyPoints = polygon.map(p => ({ x: p.x, y: p.y }))
        polyPoints = PolygonProcessor.offsetPolygon(polyPoints, wallOffset)
        
        const poly = polyPoints
        
        const scaledOverhang = isMillimeters ? overhang : overhang / 1000
        const plateHeight = isMillimeters ? 2700 : 2.7
        
        console.log(`[RoofGenerator] Unit Scale: ${isMillimeters ? 'MM' : 'M'}, OuterFaceOffset: ${wallOffset}, Overhang: ${scaledOverhang}`)

        // 3. Directives
        // Calculate our own span for extension limit
        const currentSpan = this.calculateMinDimension(poly)

        const directives: EdgeDirective[] = poly.map((_, i) => {
            const info = sharedInfo[i] || { isShared: false, isSubordinate: false }
            const isGable = info.isShared // We treat shared as Gable for extension
            
            // If Gable (Extension) and we are subordinate, calculate extension
            let extLen = undefined
            if (isGable && info.dominantSpan) {
                // Extend to where we hit the dominant roof's slope.
                // Geometrically, for equal pitch, this is half our own span.
                // We add a buffer to ensure we penetrate, but clamp to dominantSpan/2 + buffer to avoid overshooting.
                
                const penetrationDepth = (currentSpan / 2) + scaledOverhang + (isMillimeters ? 200 : 0.2)
                const maxDepth = (info.dominantSpan / 2) + scaledOverhang + (isMillimeters ? 200 : 0.2)
                
                extLen = Math.min(penetrationDepth, maxDepth)
            }

            return {
                behavior: isGable ? 'gable' : 'hip',
                pitch: pitch,
                baselineHeight: plateHeight,
                extensionLength: extLen
            }
        })

        // 3. Call Engine
        return RoofEngine.generate({
            footprint: poly,
            edgeDirectives: directives,
            defaultPitch: pitch,
            overhang: scaledOverhang
        })
    }

    /**
     * Legacy Single Room Entry Point
     */
    static generateRoofForSingleRoom(
        room: { polygon: Point[], walls: string[], roofPitch?: number },
        _allWalls: Wall[],
        globalPitch: number,
        globalOverhang: number
    ): RoofGeometry | null {
         let poly = room.polygon.map(p => ({ x: p.x, y: p.y }))
         poly = PolygonProcessor.cleanPolygon(poly)
         const pitch = room.roofPitch ?? globalPitch
         
         return this.generateSingleRoof(poly, _allWalls, pitch, globalOverhang)
    }

    // --- Shared Edge Detection Helpers ---

    static calculateSharedEdgeInfo(currentPoly: Point[], allPolys: Point[][]): { isShared: boolean, isSubordinate: boolean, dominantSpan?: number }[] {
        const info = new Array(currentPoly.length).fill(null).map(() => ({ isShared: false, isSubordinate: false, dominantSpan: undefined }))
        const n = currentPoly.length

        // Pre-calculate spans (min dimension) for dominance check
        const currentSpan = this.calculateMinDimension(currentPoly)
        const allSpans = allPolys.map(p => this.calculateMinDimension(p))

        for (let i = 0; i < n; i++) {
            const p1 = currentPoly[i]
            const p2 = currentPoly[(i + 1) % n]

            // Check against all other polygons
            for (let k = 0; k < allPolys.length; k++) {
                const otherPoly = allPolys[k]
                if (otherPoly === currentPoly) continue // Skip self
                
                const otherSpan = allSpans[k]
                
                // Dominance Check:
                // Only mark as "Shared" (Gable/Extension) if WE are smaller or equal.
                // If we are larger, we treat it as HIP to keep our volume.
                const isSubordinate = currentSpan <= otherSpan + 0.1 // minimal leniency

                if (isSubordinate) { // Optimization: only check overlap if we COULD be subordinate
                     const m = otherPoly.length
                     for (let j = 0; j < m; j++) {
                         const q1 = otherPoly[j]
                         const q2 = otherPoly[(j + 1) % m]
 
                         if (this.areSegmentsOverlapping(p1, p2, q1, q2)) {
                             // Update info
                             info[i].isShared = true
                             info[i].isSubordinate = true
                             info[i].dominantSpan = otherSpan
                             break // Found a shared edge for this segment
                         }
                     }
                }
                if (info[i].isShared) break // Found a shared edge
            }
        }
        return info
    }

    /**
     * Calculates the "Span" (Minimum Dimension) of a polygon bounding box.
     * Roughly correlates to Ridge Height for same pitch.
     */
    static calculateMinDimension(poly: Point[]): number {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        poly.forEach(p => {
            minX = Math.min(minX, p.x)
            maxX = Math.max(maxX, p.x)
            minY = Math.min(minY, p.y)
            maxY = Math.max(maxY, p.y)
        })
        return Math.min(maxX - minX, maxY - minY)
    }

    static areSegmentsOverlapping(p1: Point, p2: Point, q1: Point, q2: Point, tolerance = 0.05): boolean {
        // 1. Check if parallel (cross product small)
        const dx1 = p2.x - p1.x
        const dy1 = p2.y - p1.y
        const dx2 = q2.x - q1.x
        const dy2 = q2.y - q1.y
        
        const cross = dx1 * dy2 - dy1 * dx2
        const mag1 = Math.abs(dx1)+Math.abs(dy1)
        const mag2 = Math.abs(dx2)+Math.abs(dy2)
        
        if (Math.abs(cross) > 1e-3 * mag1 * mag2) return false // Not parallel

        // 2. Check distance between lines
        // Dist from p1 to Line(q1,q2)
        if (PolygonProcessor.distancePointToSegment(p1, q1, q2) > tolerance && 
            PolygonProcessor.distancePointToSegment(p2, q1, q2) > tolerance) {
             // Also check reverse if segments are short/offset
             if (PolygonProcessor.distancePointToSegment(q1, p1, p2) > tolerance) return false
        }

        // 3. Check 1D overlap via projection
        // Project onto X axis (or Y if vertical)
        let t_p1, t_p2, t_q1, t_q2
        
        if (Math.abs(dx1) > Math.abs(dy1)) {
            t_p1 = p1.x; t_p2 = p2.x
            t_q1 = q1.x; t_q2 = q2.x
        } else {
            t_p1 = p1.y; t_p2 = p2.y
            t_q1 = q1.y; t_q2 = q2.y
        }
        
        const minP = Math.min(t_p1, t_p2); const maxP = Math.max(t_p1, t_p2)
        const minQ = Math.min(t_q1, t_q2); const maxQ = Math.max(t_q1, t_q2)
        
        // Overlap intersection
        const overlapStart = Math.max(minP, minQ)
        const overlapEnd = Math.min(maxP, maxQ)
        
        return (overlapEnd - overlapStart) > tolerance
    }
}
