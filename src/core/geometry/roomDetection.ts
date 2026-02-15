import { Point } from '../../modules/canvas/application/types'

export interface Room {
  id: string
  walls: string[] // Wall IDs that form this room
  polygon: Point[] // Ordered points
  area: number // Square meters
  perimeter: number // Meters
}

// Graph Types
interface Node {
  id: string
  point: Point
  edges: string[] // Wall IDs connected to this node
}

interface Edge {
  id: string // Wall ID
  startNode: string
  endNode: string
  wall: { id: string, points: Point[] }
}

/**
 * Detects rooms using graph cycle detection with intersection handling
 */
export function detectRooms(walls: Array<{ id: string; points: Point[] }>): Room[] {
  if (walls.length < 3) return []

  // 1. Fragment walls at intersections to handle T-junctions
  const fragments = fragmentWalls(walls)

  // 2. Build Graph from fragments
  const { nodes, edges } = buildGraph(fragments)

  // 3. Find Cycles
  const cycles = findMinimalCycles(nodes, edges)

  // 4. Convert to rooms
  // 4. Convert to rooms
  const candidates = cycles.map(cycle => {
    const poly = cycle.map(nodeId => nodes[nodeId].point)
    const signedArea = calculatePolygonArea(poly)
    const perimeter = calculatePerimeter(poly)
    
    // Convert fragment edges back to original wall IDs
    const wallIds = findWallIdsInCycle(cycle, edges)

    return {
      id: `room-${cycle.sort().join('-')}`, // Deterministic ID
      walls: wallIds,
      polygon: poly,
      area: signedArea,
      perimeter
    }
  })

  // Deduplicate by ID and Filter Positive Area
  const uniqueRooms = new Map<string, Room>()
  
  candidates.forEach(r => {
      // Filter: Area must be NEGATIVE (Inner Room, CCW) AND magnitude > 0.1
      if (r.area < -0.1) {
          if (!uniqueRooms.has(r.id)) {
              // Store with Math.abs area for final output
              uniqueRooms.set(r.id, { ...r, area: Math.abs(r.area) })
          }
      }
  })
  
  return Array.from(uniqueRooms.values()).filter(r => r.area < 10000)
}
function fragmentWalls(walls: Array<{ id: string; points: Point[] }>) {
  const EPSILON = 0.001
  const SNAP_DIST = 0.2 // 200mm snap tolerance
  
  // ---------------------------------------------------------
  // PHASE 1: Topology Clustering (Union-Find)
  // ---------------------------------------------------------
  
  // 1. Flatten all endpoints into a list of "sites"
  //    site: { p: Point, segIdx: number, isStart: boolean }
  interface Site { x: number, y: number, segIdx: number, isStart: boolean }
  const sites: Site[] = []
  
  walls.forEach((w, i) => {
      const start = w.points[0]
      const end = w.points[w.points.length - 1]
      sites.push({ x: start.x, y: start.y, segIdx: i, isStart: true })
      sites.push({ x: end.x, y: end.y, segIdx: i, isStart: false })
  })

  // 2. Union-Find to group close sites
  const parent = new Array(sites.length).fill(0).map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const union = (i: number, j: number) => {
      const rootI = find(i)
      const rootJ = find(j)
      if (rootI !== rootJ) parent[rootI] = rootJ
  }

  // N^2 Clustering (Simple enough for < 1000 walls)
  for (let i = 0; i < sites.length; i++) {
      for (let j = i + 1; j < sites.length; j++) {
          const dx = sites[i].x - sites[j].x
          const dy = sites[i].y - sites[j].y
          if (dx * dx + dy * dy < SNAP_DIST * SNAP_DIST) {
              union(i, j)
          }
      }
  }

  // 3. Compute Centroids for each Group
  const groups = new Map<number, { x: number, y: number, count: number }>()
  for (let i = 0; i < sites.length; i++) {
      const root = find(i)
      if (!groups.has(root)) groups.set(root, { x: 0, y: 0, count: 0 })
      const g = groups.get(root)!
      g.x += sites[i].x
      g.y += sites[i].y
      g.count++
  }

  const centroids = new Map<number, Point>()
  groups.forEach((g, root) => {
      centroids.set(root, { x: g.x / g.count, y: g.y / g.count })
  })

  // 4. Update Segments to use Centroids (Vertex Snap Done)
  //    We construct a temporary "Graph" where segments link two GroupRoots
  //    Segments: { u: rootIdx, v: rootIdx, originalId }
  let graphSegments = walls.map((w, i) => {
      const startSiteIdx = i * 2
      const endSiteIdx = i * 2 + 1
      return {
          originalId: w.id,
          u: find(startSiteIdx),
          v: find(endSiteIdx),
          // We keep mutable points for the next T-snap phase
          p1: { ...centroids.get(find(startSiteIdx))! },
          p2: { ...centroids.get(find(endSiteIdx))! }
      }
  })

  // ---------------------------------------------------------
  // PHASE 2: T-Junction Snapping (Node -> Edge)
  // ---------------------------------------------------------
  // Now we check if any "Node" (Vertex Group) is close to any "Edge" (Graph Segment)
  // If so, we move the Node to project onto the Edge.
  
  // Note: If we move a Node, all connected segments update automatically because they reference the Node (Group).
  // But here we working with graphSegments with p1/p2.
  // Ideally we update the `centroids` map, then re-sync.
  
  let changed = true
  let iterations = 0
  while (changed && iterations < 3) {
      changed = false
      iterations++
      
      // We iterate Graph Nodes (Groups)
      for (const [root, pt] of centroids) {
          // Check this node against all segments
          for (const seg of graphSegments) {
              // Skip if node IS one of the segment's endpoints
              if (seg.u === root || seg.v === root) continue
              
              const s1 = seg.p1 // Current Position of Seg Start
              const s2 = seg.p2 // Current Position of Seg End
              
              // Project pt onto segment s1-s2
              const proj = projectPointToSegment(pt, s1, s2)
              
              if (proj.d < SNAP_DIST && proj.d > EPSILON) {
                  // Check t to avoid snapping to endpoints (though clustering should have caught that)
                  if (proj.t > 0.05 && proj.t < 0.95) {
                      // SNAP!
                      // Update the Centroid
                      pt.x = proj.point.x
                      pt.y = proj.point.y
                      
                      // Also update the p1/p2 refs in graphSegments that use this root
                      graphSegments.forEach(s => {
                          if (s.u === root) { s.p1.x = pt.x; s.p1.y = pt.y; }
                          if (s.v === root) { s.p2.x = pt.x; s.p2.y = pt.y; }
                      })
                      
                      changed = true
                      break // Moved this node, restart or continue?
                  }
              }
          }
      }
  }

  // ---------------------------------------------------------
  // PHASE 3: Split Calculation
  // ---------------------------------------------------------
  // Now geometry is stable.
  
  const finalSegments = graphSegments.map(g => ({
      id: g.originalId,
      start: g.p1,
      end: g.p2,
      originalId: g.originalId
  }))
  
  const splitPoints: Map<number, number[]> = new Map()
  const addSplit = (idx: number, t: number) => {
      if (t <= EPSILON || t >= 1 - EPSILON) return
      if (!splitPoints.has(idx)) splitPoints.set(idx, [])
      splitPoints.get(idx)?.push(t)
  }

  for (let i = 0; i < finalSegments.length; i++) {
      const s1 = finalSegments[i]
      
      // A. Intersections
      for (let j = i + 1; j < finalSegments.length; j++) {
          const s2 = finalSegments[j]
          const intersection = getLineIntersection(s1.start, s1.end, s2.start, s2.end)
          if (intersection) {
              addSplit(i, intersection.t1)
              addSplit(j, intersection.t2)
          }
      }
      
      // B. Point-on-Segment (The T-Snaps we just made force this)
      // Check if any endpoint lies on s1
      // Optimization: We could have tracked this in Phase 2, but re-checking is safer
      for (let j = 0; j < finalSegments.length; j++) {
          if (i === j) continue
          const s2 = finalSegments[j]
          
          const projStart = projectPointToSegment(s2.start, s1.start, s1.end)
          if (projStart.d < EPSILON) addSplit(i, projStart.t)
          
          const projEnd = projectPointToSegment(s2.end, s1.start, s1.end)
          if (projEnd.d < EPSILON) addSplit(i, projEnd.t)
      }
  }

  // ---------------------------------------------------------
  // PHASE 4: Generate Fragments
  // ---------------------------------------------------------
  const result: Array<{ id: string; points: Point[]; originalId: string }> = []
  
  finalSegments.forEach((seg, idx) => {
    // Get unique sorted t's
    const ts = Array.from(new Set(splitPoints.get(idx) || [])).sort((a,b) => a-b)
    
    let currentPt = seg.start
    
    const filteredTs = ts.filter((t, index) => {
        if (index === 0) return true
        return t - ts[index-1] > EPSILON
    })

    filteredTs.forEach(t => {
      const nextPt = {
        x: seg.start.x + (seg.end.x - seg.start.x) * t,
        y: seg.start.y + (seg.end.y - seg.start.y) * t
      }
      
      const dist = Math.hypot(nextPt.x - currentPt.x, nextPt.y - currentPt.y)
      if (dist > EPSILON) {
          result.push({
            id: `${seg.originalId}_sub_${t}`,
            points: [currentPt, nextPt],
            originalId: seg.originalId
          })
          currentPt = nextPt
      }
    })

    const dist = Math.hypot(seg.end.x - currentPt.x, seg.end.y - currentPt.y)
    if (dist > EPSILON) {
        result.push({
            id: `${seg.originalId}_sub_end`,
            points: [currentPt, seg.end],
            originalId: seg.originalId
        })
    }
  })

  return result
}

// Projection Helper
function projectPointToSegment(p: Point, s1: Point, s2: Point) {
    const l2 = (s2.x - s1.x) ** 2 + (s2.y - s1.y) ** 2
    if (l2 === 0) return { t: 0, d: Math.hypot(p.x - s1.x, p.y - s1.y), point: s1 }
    
    let t = ((p.x - s1.x) * (s2.x - s1.x) + (p.y - s1.y) * (s2.y - s1.y)) / l2
    t = Math.max(0, Math.min(1, t))
    
    const proj = {
        x: s1.x + t * (s2.x - s1.x),
        y: s1.y + t * (s2.y - s1.y)
    }
    
    return { t, d: Math.hypot(p.x - proj.x, p.y - proj.y), point: proj }
}



function getLineIntersection(p1: Point, p2: Point, p3: Point, p4: Point) {
  const x1 = p1.x, y1 = p1.y
  const x2 = p2.x, y2 = p2.y
  const x3 = p3.x, y3 = p3.y
  const x4 = p4.x, y4 = p4.y

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (denom === 0) return null // Parallel

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom

  // Tolerance
  const EPS = 0.001
  if (ua >= -EPS && ua <= 1 + EPS && ub >= -EPS && ub <= 1 + EPS) {
     return { t1: Math.max(0, Math.min(1, ua)), t2: Math.max(0, Math.min(1, ub)) }
  }
  return null
}

function buildGraph(fragments: Array<{ id: string; points: Point[]; originalId: string }>) {
  const nodes: Record<string, Node> = {}
  const edges: Edge[] = []
  const EPSILON = 0.05 // 5cm snap for nodes

  const getNode = (p: Point): string => {
    for (const id in nodes) {
      const n = nodes[id]
      const dist = Math.sqrt(Math.pow(p.x - n.point.x, 2) + Math.pow(p.y - n.point.y, 2))
      if (dist < EPSILON) return id
    }
    const id = `node-${Object.keys(nodes).length}`
    nodes[id] = { id, point: p, edges: [] }
    return id
  }

  fragments.forEach(f => {
    const u = getNode(f.points[0])
    const v = getNode(f.points[1])
    if (u === v) return 
    
    // Edge references original ID via fragment
    edges.push({ id: f.id, startNode: u, endNode: v, wall: { id: f.originalId, points: f.points } })
    nodes[u].edges.push(f.id)
    nodes[v].edges.push(f.id)
  })

  return { nodes, edges }
}

// Re-paste findMinimalCycles since I am replacing the whole file block or need to ensure context
function findMinimalCycles(nodes: Record<string, Node>, edges: Edge[]): string[][] {
    // Simplified:
    const cycles: string[][] = []
    const adj: Record<string, string[]> = {}
    Object.keys(nodes).forEach(k => adj[k] = [])
    
    // Ensure bi-directional adjacency
    edges.forEach(e => {
        if(!adj[e.startNode].includes(e.endNode)) adj[e.startNode].push(e.endNode)
        if(!adj[e.endNode].includes(e.startNode)) adj[e.endNode].push(e.startNode)
    })

    const halfEdges: { u: string, v: string, used: boolean }[] = []
    Object.keys(adj).forEach(u => {
        adj[u].forEach(v => {
            halfEdges.push({ u, v, used: false })
        })
    })

    halfEdges.forEach(he => {
        if (he.used) return
        
        const path: string[] = []
        let curr = he
        
        // Safety Break
        let iterations = 0
        const startU = he.u
        
        while (!curr.used && iterations < 100) {
            curr.used = true
            path.push(curr.u)
            iterations++
            
            const u = curr.u
            const v = curr.v
            
            if (v === startU && path.length > 2) {
                cycles.push(path)
                return
            }
            
            // Find next edge "left" of u->v
            // We are at v, arrived from u.
            // Vector u->v.
            // We want outgoing edge v->w that is smallest angle CCW from v->u (backwards)
            
            const neighbors = adj[v]
            if (neighbors.length < 2) { break }
            
            const vPt = nodes[v].point
            const uPt = nodes[u].point
            const baseAngle = Math.atan2(uPt.y - vPt.y, uPt.x - vPt.x) // Angle pointing back to U
            
            // Sort neighbors by angle relative to baseAngle
            let bestNext: string | null = null
            let bestDiff = 4 * Math.PI // Max
            
            neighbors.forEach(n => {
                if (n === u && neighbors.length > 1) return // Don't go back unless dead end
                
                const nPt = nodes[n].point
                const localAngle = Math.atan2(nPt.y - vPt.y, nPt.x - vPt.x)
                
                // Calculate CCW difference
                // We want smallest diff > 0
                // diff = local - base
                let diff = localAngle - baseAngle
                if (diff <= 0.0001) diff += 2 * Math.PI
                
                if (diff < bestDiff) {
                    bestDiff = diff
                    bestNext = n
                }
            })
            
            if (bestNext) {
                const nextHE = halfEdges.find(h => h.u === v && h.v === bestNext)
                if (nextHE) curr = nextHE
                else { break }
            } else {
                break
            }
        }
    })
    
    return cycles
}

function findWallIdsInCycle(cycleNodes: string[], edges: Edge[]): string[] {
    const ids: string[] = []
    for (let i = 0; i < cycleNodes.length; i++) {
        const u = cycleNodes[i]
        const v = cycleNodes[(i + 1) % cycleNodes.length]
        
        // Find edge connecting u-v
        const edge = edges.find(e => 
            (e.startNode === u && e.endNode === v) || 
            (e.startNode === v && e.endNode === u)
        )
        
        if (edge && edge.wall && edge.wall.id) ids.push(edge.wall.id)
    }
    return [...new Set(ids)]
}

// ... (Area and Perimeter helpers remain same)
function calculatePolygonArea(points: Point[]): number {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return area / 2 // Returns SIGNED area
}

function calculatePerimeter(points: Point[]): number {
  let perimeter = 0
  for (let i = 0; i < points.length; i++) {
     const j = (i + 1) % points.length
     perimeter += Math.hypot(points[j].x - points[i].x, points[j].y - points[i].y)
  }
  return perimeter
}
