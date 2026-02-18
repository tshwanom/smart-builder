import { ProjectGeometry, WallSegment, RoofPlane3D, Point3D } from '../../../../../domain/types'
import { computeStraightSkeleton, SkeletonResult } from '../analytics/StraightSkeleton'
import { Vec2 } from '../analytics/types'

// Helper to convert Point3D to Vec2
function toVec2(p: Point3D): Vec2 {
    return { x: p.x, y: p.y }
}

// Helper to convert Vec2 to Point3D (z=0 initially, will need elevation)
function toPoint3D(v: Vec2, z: number = 0): Point3D {
    return { x: v.x, y: v.y, z }
}

// Enhanced to return the walls corresponding to the loop edges
function findOuterLoop(walls: WallSegment[]): { loop: Vec2[], orderedWalls: WallSegment[] } {
    if (walls.length < 3) return { loop: [], orderedWalls: [] }

    // 1. Build adjacency graph (point -> wall IDs)
    const key = (x: number, y: number) => `${x.toFixed(3)},${y.toFixed(3)}`
    
    const adj = new Map<string, WallSegment[]>()
    
    walls.forEach(w => {
        const kStart = key(w.start.x, w.start.y)
        if (!adj.has(kStart)) adj.set(kStart, [])
        adj.get(kStart)!.push(w)
    })

    const visited = new Set<string>()
    const loop: Point3D[] = []
    const orderedWalls: WallSegment[] = []
    
    // Find a starting wall (e.g., top-left most, or just the first one)
    let currentWall = walls[0]
    let currentPoint = currentWall.start
    
    // Walk
    let safe = 0
    while (safe++ < 1000) {
        loop.push(currentPoint)
        visited.add(currentWall.id)
        orderedWalls.push(currentWall)
        
        const nextPoint = currentWall.end
        const kNext = key(nextPoint.x, nextPoint.y)
        
        // Find next wall starting at nextPoint
        const candidates = adj.get(kNext)
        if (!candidates) break // Dead end
        
        // Filter out current wall
        const nextWall = candidates.find(w => w.id !== currentWall.id)
        
        if (!nextWall) {
             // Check if we closed the loop to the start
             if (key(nextPoint.x, nextPoint.y) === key(loop[0].x, loop[0].y)) {
                // Loop closed!
                break
             }
             break // Dead end
        }
        
        if (visited.has(nextWall.id)) {
             // Loop closed (potentially)
             break
        }
        
        currentWall = nextWall
        currentPoint = nextPoint
    }
    
    return { 
        loop: loop.map(toVec2),
        orderedWalls
    }
}

export function generateRoofs(project: ProjectGeometry): RoofPlane3D[] {
    const { loop, orderedWalls } = findOuterLoop(project.walls)
    
    if (loop.length < 3) {
        console.warn("No closed loop found for roof generation")
        return []
    }

    // Run Straight Skeleton
    const skeleton: SkeletonResult = computeStraightSkeleton(loop)
    
    // Convert faces to RoofPlane3D
    return skeleton.faces.map((face, index) => {
        // Find corresponding wall for this face edge
        // The skeleton alg usually maintains edge index order.
        const sourceWall = orderedWalls[index % orderedWalls.length]
        
        const structure = sourceWall?.roofStructure
        const pitch = sourceWall?.roofPitch || 26 // Default 26 deg

        return {
            id: `roof-${index}`,
            vertices: face.polygon.map(v => toPoint3D(v, 3)), // Dummy Z=3 for now
            pitch: pitch,
            structure: structure // Attach structure!
        }
    })
}
