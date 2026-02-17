import { Point, Wall, RoofPanel } from '../../../application/types'
import { RoofEngine, EdgeDirective } from '../analytics/RoofEngine'
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

        // ── 4. Incremental union → building outer face ──
        const outerFaces = PolygonProcessor.incrementalUnion(wallRects)

        if (outerFaces.length === 0) {
            console.error('[RoofGenerator] Union produced no polygons')
            return null
        }

        // Pick the largest polygon as the building footprint
        const sortedFaces = outerFaces
            .map(face => ({ face, area: PolygonProcessor.calculateArea(face) }))
            .sort((a, b) => b.area - a.area)

        console.log(`[RoofGenerator] Union result: ${outerFaces.length} polygon(s), largest area: ${sortedFaces[0].area.toFixed(0)}`)

        // ── 5. Detect unit scale ──
        const mainFace = sortedFaces[0].face
        const maxCoord = mainFace.reduce((m, p) => Math.max(m, Math.abs(p.x), Math.abs(p.y)), 0)
        const isMillimeters = maxCoord > 500

        // ── 6. Simplify footprint — remove short edges from union artifacts ──
        // Short edges (< wall thickness) are union artifacts at wall junctions
        // They create extra skeleton faces and messy valleys
        const minEdgeLength = avgThickness * 0.9  // ~200mm for 220mm walls

        // ── 7. Set roof parameters ──
        const plateHeight = isMillimeters ? 2700 : 2.7
        const scaledOverhang = isMillimeters ? globalOverhang : globalOverhang / 1000
        const pitch = panels[0]?.pitchedConfig?.pitch ?? globalPitch

        console.log(`[RoofGenerator] Overhang: ${scaledOverhang}, minEdge: ${minEdgeLength.toFixed(0)}`)

        // ── 8. Generate roof for each disconnected building ──
        const allGeometries: RoofGeometry[] = []
        
        for (let i = 0; i < sortedFaces.length; i++) {
            let footprint = sortedFaces[i].face
            if (footprint.length < 3) continue

            // Simplify: remove short edges that are union artifacts
            footprint = this.simplifyFootprint(footprint, minEdgeLength)
            if (footprint.length < 3) continue

            console.log(`[RoofGenerator] Building ${i + 1}: ${footprint.length} edges after simplification`)

            const directives: EdgeDirective[] = footprint.map(() => ({
                behavior: 'hip' as const,
                pitch,
                baselineHeight: plateHeight
            }))

            const geometry = RoofEngine.generate({
                footprint,
                edgeDirectives: directives,
                defaultPitch: pitch,
                overhang: scaledOverhang
            })

            if (geometry) {
                allGeometries.push(geometry)
            }
        }

        if (allGeometries.length === 0) {
            console.error('[RoofGenerator] No valid roof geometry generated')
            return null
        }

        // ── 9. Merge all geometries ──
        const merged: RoofGeometry = {
            planes: allGeometries.flatMap(g => g.planes),
            edges: allGeometries.flatMap(g => g.edges),
            ridges: allGeometries.flatMap(g => g.ridges),
            hips: allGeometries.flatMap(g => g.hips),
            valleys: allGeometries.flatMap(g => g.valleys),
            eaves: allGeometries.flatMap(g => g.eaves),
            slopeArrows: allGeometries.flatMap(g => g.slopeArrows),
            footprint: allGeometries[0].footprint
        }

        console.log(`[RoofGenerator] Combined: ${merged.planes.length} planes, ${merged.valleys.length} valleys`)
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
