import { Vec2 } from './analytics/types'

export interface Wall {
  id: string
  points: { x: number; y: number }[]
  storyId?: string
  thickness: number
}

interface WallSegment {
  id: string
  start: Vec2
  end: Vec2
  thickness: number
}

interface WallNode {
  position: Vec2
  segments: WallSegment[]
}

/**
 * Extracts building footprint from walls using boundary tracing.
 * Chief Architect approach: trace the outer perimeter of connected walls.
 */
export class WallBoundaryTracer {
  private static readonly SNAP_TOLERANCE = 10.0 // mm tolerance for matching endpoints (increased from 1.0)

  /**
   * Extract building footprint from walls on a specific story.
   * Returns ONE polygon representing the building's outer boundary.
   */
  static extractBuildingFootprint(walls: Wall[], storyId?: string): Vec2[] {
    const boundaries = this.extractAllBoundaries(walls, storyId)
    // Return largest boundary (main building)
    if (boundaries.length === 0) return []
    return boundaries.reduce((largest, current) => 
      current.length > largest.length ? current : largest
    )
  }

  /**
   * Extract ALL disconnected building footprints.
   * Returns array of polygons for each separate building.
   */
  static extractAllBoundaries(walls: Wall[], storyId?: string): Vec2[][] {
    // Filter walls by story
    const validWalls = walls.filter(w => !storyId || w.storyId === storyId)
    if (validWalls.length === 0) return []

    // Convert walls to segments
    const segments = this.wallsToSegments(validWalls)
    if (segments.length === 0) return []

    // Build connectivity graph
    const graph = this.buildWallGraph(segments)

    // Find all disconnected components (separate buildings)
    const boundaries: Vec2[][] = []
    const processedPoints = new Set<string>()

    for (const [pointKey, node] of graph.entries()) {
      if (processedPoints.has(pointKey)) continue

      // Find leftmost point in this component
      const startPoint = this.findLeftmostPointInComponent(graph, node.position, processedPoints)
      if (!startPoint) continue

      // Trace boundary for this component
      const rawBoundary = this.traceBoundaryCCW(graph, startPoint)
      
      // Mark all points in this boundary as processed
      rawBoundary.forEach(pt => processedPoints.add(this.pointKey(pt)))

      // Simplify and add to results
      const boundary = this.simplifyBoundary(rawBoundary)
      if (boundary.length >= 3) {
        boundaries.push(boundary)
      }
    }

    console.log(`[WallBoundaryTracer] Found ${boundaries.length} disconnected building(s)`)
    return boundaries
  }

  /**
   * Find leftmost point in a connected component using BFS
   */
  private static findLeftmostPointInComponent(
    graph: Map<string, WallNode>,
    startPoint: Vec2,
    visited: Set<string>
  ): Vec2 | null {
    const queue = [startPoint]
    const componentPoints: Vec2[] = []
    const localVisited = new Set<string>()

    while (queue.length > 0) {
      const current = queue.shift()!
      const currentKey = this.pointKey(current)
      
      if (localVisited.has(currentKey) || visited.has(currentKey)) continue
      localVisited.add(currentKey)
      
      componentPoints.push(current)

      // Add neighbors
      const node = graph.get(currentKey)
      if (node) {
        for (const segment of node.segments) {
          const neighbor = this.pointsEqual(segment.start, current) ? segment.end : segment.start
          const neighborKey = this.pointKey(neighbor)
          if (!localVisited.has(neighborKey)) {
            queue.push(neighbor)
          }
        }
      }
    }

    // Find leftmost in component
    if (componentPoints.length === 0) return null
    return componentPoints.reduce((leftmost, pt) => 
      pt.x < leftmost.x ? pt : leftmost
    )
  }

  /**
   * Remove collinear vertices from boundary polygon.
   * This eliminates interior wall artifacts that create extra vertices.
   */
  private static simplifyBoundary(boundary: Vec2[]): Vec2[] {
    if (boundary.length < 3) return boundary

    const simplified: Vec2[] = []
    const n = boundary.length

    for (let i = 0; i < n; i++) {
      const prev = boundary[(i - 1 + n) % n]
      const curr = boundary[i]
      const next = boundary[(i + 1) % n]

      // Check if curr is collinear with prev and next
      const dx1 = curr.x - prev.x
      const dy1 = curr.y - prev.y
      const dx2 = next.x - curr.x
      const dy2 = next.y - curr.y

      // Cross product = 0 means collinear
      const cross = dx1 * dy2 - dy1 * dx2

      // Keep vertex if NOT collinear (with small tolerance)
      if (Math.abs(cross) > 1.0) {
        simplified.push(curr)
      }
    }

    console.log(`[WallBoundaryTracer] Simplified boundary: ${boundary.length} → ${simplified.length} vertices`)
    return simplified.length >= 3 ? simplified : boundary
  }

  /**
   * Convert walls to line segments, then split at T-junctions.
   * T-junction: when a wall endpoint falls ON another wall segment (not at its endpoints).
   * This creates proper connectivity for L/T/U-shaped buildings.
   */
  private static wallsToSegments(walls: Wall[]): WallSegment[] {
    // First pass: collect raw segments
    const rawSegments: WallSegment[] = []

    for (const wall of walls) {
      if (wall.points.length < 2) continue

      for (let i = 0; i < wall.points.length - 1; i++) {
        rawSegments.push({
          id: `${wall.id}_${i}`,
          start: { x: wall.points[i].x, y: wall.points[i].y },
          end: { x: wall.points[i + 1].x, y: wall.points[i + 1].y },
          thickness: wall.thickness
        })
      }
    }

    // Second pass: T-junction splitting
    // For each endpoint, check if it lies ON another segment (not at endpoints)
    const splitPoints = new Map<number, Vec2[]>() // segmentIndex -> split points

    for (const seg of rawSegments) {
      for (let j = 0; j < rawSegments.length; j++) {
        const target = rawSegments[j]
        if (seg.id === target.id) continue

        // Check if seg.start falls on target
        const p1 = this.pointOnSegment(seg.start, target.start, target.end)
        if (p1) {
          if (!splitPoints.has(j)) splitPoints.set(j, [])
          splitPoints.get(j)!.push(p1)
        }

        // Check if seg.end falls on target
        const p2 = this.pointOnSegment(seg.end, target.start, target.end)
        if (p2) {
          if (!splitPoints.has(j)) splitPoints.set(j, [])
          splitPoints.get(j)!.push(p2)
        }
      }
    }

    // Third pass: build final segments (splitting where needed)
    const finalSegments: WallSegment[] = []

    for (let i = 0; i < rawSegments.length; i++) {
      const seg = rawSegments[i]
      const splits = splitPoints.get(i)

      if (!splits || splits.length === 0) {
        finalSegments.push(seg)
        continue
      }

      // Sort split points along segment direction
      const dx = seg.end.x - seg.start.x
      const dy = seg.end.y - seg.start.y
      const sortedSplits = splits
        .filter((sp, idx, arr) => 
          // Deduplicate
          arr.findIndex(p => this.pointsEqual(p, sp)) === idx
        )
        .sort((a, b) => {
          const tA = Math.abs(dx) > Math.abs(dy) 
            ? (a.x - seg.start.x) / dx 
            : (a.y - seg.start.y) / dy
          const tB = Math.abs(dx) > Math.abs(dy) 
            ? (b.x - seg.start.x) / dx 
            : (b.y - seg.start.y) / dy
          return tA - tB
        })

      // Create sub-segments
      let prev = seg.start
      for (const sp of sortedSplits) {
        if (!this.pointsEqual(prev, sp)) {
          finalSegments.push({
            id: `${seg.id}_split`,
            start: { x: prev.x, y: prev.y },
            end: { x: sp.x, y: sp.y },
            thickness: seg.thickness
          })
        }
        prev = sp
      }
      // Last sub-segment
      if (!this.pointsEqual(prev, seg.end)) {
        finalSegments.push({
          id: `${seg.id}_split_end`,
          start: { x: prev.x, y: prev.y },
          end: { x: seg.end.x, y: seg.end.y },
          thickness: seg.thickness
        })
      }
    }

    console.log(`[WallBoundaryTracer] Segments: ${rawSegments.length} raw → ${finalSegments.length} after T-junction splits`)
    return finalSegments
  }

  /**
   * Check if point P lies on segment AB (not at endpoints).
   * Returns the snapped point if it does, null otherwise.
   */
  private static pointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 | null {
    const tol = this.SNAP_TOLERANCE

    // Skip if P is at an endpoint
    if (Math.abs(p.x - a.x) < tol && Math.abs(p.y - a.y) < tol) return null
    if (Math.abs(p.x - b.x) < tol && Math.abs(p.y - b.y) < tol) return null

    // Project P onto line AB
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lenSq = dx * dx + dy * dy
    if (lenSq < 1e-9) return null

    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
    if (t < 0.01 || t > 0.99) return null // Not interior to segment

    // Distance from P to projected point
    const projX = a.x + t * dx
    const projY = a.y + t * dy
    const dist = Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2)

    if (dist < tol) {
      // Snap to the test point (not projection) for consistency
      return { x: p.x, y: p.y }
    }
    return null
  }

  /**
   * Build graph of connected wall endpoints
   */
  private static buildWallGraph(segments: WallSegment[]): Map<string, WallNode> {
    const graph = new Map<string, WallNode>()

    for (const segment of segments) {
      // Add start node
      const startKey = this.pointKey(segment.start)
      if (!graph.has(startKey)) {
        graph.set(startKey, { position: segment.start, segments: [] })
      }
      graph.get(startKey)!.segments.push(segment)

      // Add end node
      const endKey = this.pointKey(segment.end)
      if (!graph.has(endKey)) {
        graph.set(endKey, { position: segment.end, segments: [] })
      }
      graph.get(endKey)!.segments.push(segment)
    }

    return graph
  }

  /**
   * Find leftmost point in graph (guaranteed to be on outer boundary)
   */
  private static findLeftmostPoint(graph: Map<string, WallNode>): Vec2 | null {
    if (graph.size === 0) return null

    let leftmost: Vec2 | null = null
    let minX = Infinity

    for (const node of graph.values()) {
      if (node.position.x < minX) {
        minX = node.position.x
        leftmost = node.position
      }
    }

    return leftmost
  }

  /**
   * Trace boundary counter-clockwise (keeping interior on the right for Y-down)
   */
  private static traceBoundaryCCW(graph: Map<string, WallNode>, startPoint: Vec2): Vec2[] {
    const boundary: Vec2[] = []
    const visited = new Set<string>()

    let currentPoint = startPoint
    let previousAngle: number | null = null

    // Start by going "up" (negative Y in screen coords)
   previousAngle = -Math.PI / 2 

    while (true) {
      boundary.push({ ...currentPoint })
      const currentKey = this.pointKey(currentPoint)
      
      // Find all segments connected to current point
      const node = graph.get(currentKey)
      if (!node) break

      // Find next edge (LEFTMOST turn = maximum angle for CCW traversal)
      // This ensures we stay on OUTER perimeter, not interior walls
      let nextSegment: WallSegment | null = null
      let bestAngle = -Infinity  // Changed: pick MAXIMUM angle (leftmost turn)

      for (const segment of node.segments) {
        const segmentKey = `${this.pointKey(segment.start)}-${this.pointKey(segment.end)}`
        const reverseKey = `${this.pointKey(segment.end)}-${this.pointKey(segment.start)}`
        
        if (visited.has(segmentKey) && visited.has(reverseKey)) continue

        // Determine direction of segment from current point
        const isForward = this.pointsEqual(segment.start, currentPoint)
        const nextPoint = isForward ? segment.end : segment.start
        
        // Calculate angle
        const dx = nextPoint.x - currentPoint.x
        const dy = nextPoint.y - currentPoint.y
        const angle = Math.atan2(dy, dx)

        // Calculate turn angle (pick LEFTMOST turn for outer boundary)
        let turnAngle = angle - (previousAngle ?? 0)
        while (turnAngle <= -Math.PI) turnAngle += 2 * Math.PI
        while (turnAngle > Math.PI) turnAngle -= 2 * Math.PI

        // Pick the LEFTMOST (maximum) turn to stay on outer perimeter
        if (turnAngle > bestAngle) {
          bestAngle = turnAngle
          nextSegment = segment
        }
      }

      if (!nextSegment) break

      // Mark segment as visited
      const segmentKey = `${this.pointKey(nextSegment.start)}-${this.pointKey(nextSegment.end)}`
      const reverseKey = `${this.pointKey(nextSegment.end)}-${this.pointKey(nextSegment.start)}`
      visited.add(segmentKey)
      visited.add(reverseKey)

      // Move to next point
      const isForward = this.pointsEqual(nextSegment.start, currentPoint)
      const nextPoint = isForward ? nextSegment.end : nextSegment.start

      // Update angle for next iteration
      const dx = nextPoint.x - currentPoint.x
      const dy = nextPoint.y - currentPoint.y
      previousAngle = Math.atan2(dy, dx)

      currentPoint = nextPoint

      // Check if we've returned to start
      if (this.pointsEqual(currentPoint, startPoint) && boundary.length > 2) {
        break
      }

      // Safety check: prevent infinite loop
      if (boundary.length > graph.size * 2) {
        console.error('[WallBoundaryTracer] Infinite loop detected')
        break
      }
    }

    return boundary
  }

  /**
   * Generate unique key for a point (with snapping tolerance)
   */
  private static pointKey(p: Vec2): string {
    const x = Math.round(p.x / this.SNAP_TOLERANCE) * this.SNAP_TOLERANCE
    const y = Math.round(p.y / this.SNAP_TOLERANCE) * this.SNAP_TOLERANCE
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }

  /**
   * Check if two points are equal (within tolerance)
   */
  private static pointsEqual(p1: Vec2, p2: Vec2): boolean {
    return this.pointKey(p1) === this.pointKey(p2)
  }
}
