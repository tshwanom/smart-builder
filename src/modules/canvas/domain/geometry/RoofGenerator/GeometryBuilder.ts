import { Point, Wall, RoofPanel } from '../../../application/types'
import { RoofEngine, EdgeDirective, offsetPolygon } from '../analytics/RoofEngine'
import { RoofGeometry } from '../analytics/types'
import { PolygonProcessor } from '../PolygonProcessor'

/**
 * Bridge between Application Layer and Analytical Geometry Layer.
 * 
 * Architecture:
 * 1. Each wall → physical rectangle (centerline ± thickness/2, extended at ends)
 * 2. Incremental polygon union → exact outer face of building
 * 3. Simplify polygon → remove short edges from union artifacts
 * 4. This IS the footprint (green line) — sits on wall exterior, every corner
 * 5. RoofEngine offsets by overhang for eave polygon, computes skeleton
 */
export class RoofGenerator {

    static generateFromRoofPanels(
        panels: RoofPanel[],
        rooms: { id: string, polygon: Point[], hasRoof?: boolean, walls?: string[] }[], 
        walls: Wall[],
        globalPitch: number,
        globalOverhang: number
    ): RoofGeometry | null {
        console.log('[RoofGenerator] Wall Rectangle Union — Outer Face Footprint')
        
        const storyId = walls.length > 0 ? walls[0].storyId : undefined

        // ── 1. Filter walls by story and room hasRoof ──
        const storyWalls = walls.filter(w => !storyId || w.storyId === storyId)

        const roofedWallIds = new Set<string>()
        const excludedWallIds = new Set<string>()
        for (const room of rooms) {
            if (!room.walls) continue
            if (room.hasRoof === false) {
                for (const id of room.walls) excludedWallIds.add(id)
            } else {
                for (const id of room.walls) roofedWallIds.add(id)
            }
        }

        const filteredWalls = storyWalls.filter(w => {
            if (roofedWallIds.has(w.id)) return true
            if (excludedWallIds.has(w.id)) return false
            return true
        })

        console.log(`[RoofGenerator] Walls: ${storyWalls.length} story → ${filteredWalls.length} after hasRoof filter`)

        if (filteredWalls.length < 2) {
            console.error('[RoofGenerator] Not enough walls')
            return null
        }

        // ── 2. Calculate average wall thickness ──
        const avgThickness = filteredWalls.reduce((sum, w) => sum + w.thickness, 0) / filteredWalls.length

        // ── 3. Convert each wall to its physical rectangle ──
        const wallRects: Point[][] = []
        for (const wall of filteredWalls) {
            const rect = this.wallToRect(wall)
            if (rect.length >= 3) wallRects.push(rect)
        }

        console.log(`[RoofGenerator] ${wallRects.length} wall rectangles`)

        if (wallRects.length === 0) {
            console.error('[RoofGenerator] No valid wall rectangles')
            return null
        }

        // ── NEW STRATEGY: Union of Floors ──
        // 1. Collect all room floors.
        // 2. Union them to remove internal walls and get the "Net Floor Area".
        // 3. Offset by wall thickness to get "Gross Building Footprint".
        // 4. Generate roof on that.
        
        const roomPolys: Point[][] = []
        let effectivePitch = panels[0]?.pitchedConfig?.pitch ?? 30 // Default fallback

        for (const room of rooms) {
             if (room.hasRoof === false) continue
             if (!room.polygon || room.polygon.length < 3) continue
             
             // Capture pitch from first room that has it (or last? usually consistent)
             const r = room as any
             if (r.roofPitch) effectivePitch = r.roofPitch
             
             roomPolys.push(room.polygon)
        }

        if (roomPolys.length === 0) {
            console.error('[RoofGenerator] No room polygons found')
            // Fallback to wall union if strictly needed, or just return null
             if (filteredWalls.length > 0) {
                 // Fallback logic ...
             } else {
                 return null
             }
        }

        // Union Floors
        const floorFaces = PolygonProcessor.incrementalUnion(roomPolys)
        
        if (floorFaces.length === 0) {
             // Fallback to walls?
             console.log('[RoofGenerator] Floor union failed, trying walls...')
        }
        
        const combinedPlanes: any[] = []
        const combinedEdges: any[] = []
        const combinedValleys: any[] = []
        const combinedRidges: any[] = []
        const combinedHips: any[] = []
        const combinedEaves: any[] = []
        const combinedArrows: any[] = []
        let globalFootprint: Point[] = []
        
        // Process each disconnected floor island
        for (let i = 0; i < floorFaces.length; i++) {
            const floorPoly = floorFaces[i]
            
            // Offset: Floor -> Outer Wall
            const offsetDist = avgThickness
            const footprint = offsetPolygon(floorPoly, offsetDist)
            
            if (footprint.length < 3) continue

            // Add to global footprint visual
            if (globalFootprint.length === 0 || PolygonProcessor.calculateArea(footprint) > PolygonProcessor.calculateArea(globalFootprint)) {
                globalFootprint = footprint
            }

             // Detect scale
            const maxC = footprint.reduce((m, p) => Math.max(m, Math.abs(p.x), Math.abs(p.y)), 0)
            const isMm = maxC > 500
            
            const plateHeight = isMm ? 2700 : 2.7
            const scaledOverhang = isMm ? globalOverhang : globalOverhang / 1000
            
            const directives: EdgeDirective[] = footprint.map(() => ({
                behavior: 'hip',
                pitch: effectivePitch,
                baselineHeight: plateHeight
            }))

            const geometry = RoofEngine.generate({
                footprint: footprint,
                edgeDirectives: directives,
                defaultPitch: effectivePitch,
                overhang: scaledOverhang
            })
            
             if (geometry) {
                // Ensure IDs are unique
                const suffix = `-island-${i}`
                
                geometry.planes.forEach(p => {
                    p.id += suffix
                    combinedPlanes.push(p)
                })
                geometry.edges.forEach(e => combinedEdges.push(e))
                geometry.ridges.forEach(e => combinedRidges.push(e))
                geometry.hips.forEach(e => combinedHips.push(e))
                geometry.valleys.forEach(e => combinedValleys.push(e))
                geometry.eaves.forEach(e => combinedEaves.push(e))
                geometry.slopeArrows.forEach(e => combinedArrows.push(e))
            }
        }
        
        // (Legacy single-room fallback removed)
        
        // 2. Fallback: If no rooms processed, try global union of walls
        if (floorFaces.length === 0 && wallRects.length > 0) {
             console.log('[RoofGenerator] No rooms found, falling back to global wall union')
             const outerFaces = PolygonProcessor.incrementalUnion(wallRects)
             if (outerFaces.length > 0) {
                 const sorted = outerFaces
                    .map(face => ({ face, area: PolygonProcessor.calculateArea(face) }))
                    .sort((a, b) => b.area - a.area)
                 
                 // Note: Union result is ALREADY outer face.
                 // We must NOT offset it again by wall thickness.
                 // We can either offset by 0 or fix the helper.
                 // Let's manually call Generate here to be safe and clean.
                 
                 const footprint = sorted[0].face
                 // Simplify
                 const simpleFootprint = this.simplifyFootprint(footprint, avgThickness * 0.9)
                 
                 const maxC = simpleFootprint.reduce((m, p) => Math.max(m, Math.abs(p.x), Math.abs(p.y)), 0)
                 const isMm = maxC > 500
                 const plateHeight = isMm ? 2700 : 2.7
                 const scaledOverhang = isMm ? globalOverhang : globalOverhang / 1000
                 const pitch = panels[0]?.pitchedConfig?.pitch ?? globalPitch

                 const directives: EdgeDirective[] = simpleFootprint.map(() => ({
                    behavior: 'hip',
                    pitch: pitch,
                    baselineHeight: plateHeight
                }))

                const geometry = RoofEngine.generate({
                    footprint: simpleFootprint,
                    edgeDirectives: directives,
                    defaultPitch: pitch,
                    overhang: scaledOverhang
                })
                
                if (geometry) {
                    geometry.planes.forEach(p => combinedPlanes.push(p))
                    geometry.edges.forEach(e => combinedEdges.push(e))
                    geometry.ridges.forEach(e => combinedRidges.push(e))
                    geometry.hips.forEach(e => combinedHips.push(e))
                    geometry.valleys.forEach(e => combinedValleys.push(e))
                    geometry.eaves.forEach(e => combinedEaves.push(e))
                    geometry.slopeArrows.forEach(e => combinedArrows.push(e))
                }
             }
        }

        // ── 9. Merge all geometries ──
        const merged: RoofGeometry = {
            planes: combinedPlanes,
            edges: combinedEdges,
            ridges: combinedRidges,
            hips: combinedHips,
            valleys: combinedValleys,
            eaves: combinedEaves,
            slopeArrows: combinedArrows,
            footprint: globalFootprint
        }

        console.log(`[RoofGenerator] Combined: ${merged.planes.length} planes`)
        return merged
    }
    
    /**
     * Simplifies a polygon by iteratively removing short edges.
     * Short edges are union artifacts at wall junctions that create
     * extra skeleton faces and messy valleys.
     * 
     * When a short edge is removed, its two vertices are merged to
     * the midpoint, preserving the polygon's overall shape.
     */
    private static simplifyFootprint(polygon: Point[], minLength: number): Point[] {
        let pts = [...polygon]
        const minLenSq = minLength * minLength
        let changed = true

        // Iterate until no more short edges remain
        while (changed && pts.length > 3) {
            changed = false
            const next: Point[] = []
            const n = pts.length
            const skip = new Set<number>()

            for (let i = 0; i < n; i++) {
                if (skip.has(i)) continue
                
                const j = (i + 1) % n
                const dx = pts[j].x - pts[i].x
                const dy = pts[j].y - pts[i].y
                
                if (dx * dx + dy * dy < minLenSq && !skip.has(j) && pts.length - skip.size > 3) {
                    // Short edge: merge to midpoint
                    next.push({ x: (pts[i].x + pts[j].x) / 2, y: (pts[i].y + pts[j].y) / 2 })
                    skip.add(j)
                    changed = true
                } else {
                    next.push(pts[i])
                }
            }
            pts = next
        }

        // Remove collinear points (points where the angle is ~180°)
        const cleaned: Point[] = []
        const n = pts.length
        for (let i = 0; i < n; i++) {
            const prev = pts[(i - 1 + n) % n]
            const curr = pts[i]
            const next2 = pts[(i + 1) % n]
            
            // Cross product check for collinearity
            const cross = (curr.x - prev.x) * (next2.y - prev.y) - (curr.y - prev.y) * (next2.x - prev.x)
            if (Math.abs(cross) > 1) {  // 1mm² tolerance for mm coords
                cleaned.push(curr)
            }
        }

        return cleaned.length >= 3 ? cleaned : pts
    }

    /**
     * Converts a wall (centerline + thickness) into its physical rectangle.
     * Extended by thickness/2 at each end so rectangles overlap at junctions,
     * producing clean corners in the union result.
     */
    private static wallToRect(wall: Wall): Point[] {
        if (wall.points.length < 2) return []
        
        const p1 = wall.points[0]
        const p2 = wall.points[wall.points.length - 1]
        
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len < 1e-9) return []

        const halfT = wall.thickness / 2

        // Unit direction along wall
        const ux = dx / len
        const uy = dy / len

        // Extend centerline by halfT at each end → covers junction corner zone
        const ep1 = { x: p1.x - ux * halfT, y: p1.y - uy * halfT }
        const ep2 = { x: p2.x + ux * halfT, y: p2.y + uy * halfT }

        // Perpendicular direction
        const nx = -uy * halfT
        const ny =  ux * halfT

        // 4 corners of extended wall rectangle (CCW winding)
        return [
            { x: ep1.x + nx, y: ep1.y + ny },
            { x: ep2.x + nx, y: ep2.y + ny },
            { x: ep2.x - nx, y: ep2.y - ny },
            { x: ep1.x - nx, y: ep1.y - ny },
        ]
    }
}
