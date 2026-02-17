import { Vec2 } from './types'

// ═══════════════════════════════════════════════════
// Types & Interfaces
// ═══════════════════════════════════════════════════

export interface SkeletonFace {
  edgeIndex: number
  polygon: Vec2[]
}

export interface SkeletonArc {
  start: Vec2
  end: Vec2
  leftFace: number
  rightFace: number
}

export interface SkeletonResult {
  faces: SkeletonFace[]
  arcs: SkeletonArc[]
}

// Doubly linked list node for the active polygon
class SSNode {
  id: number // Corresponds to the original edge index starting at this vertex
  point: Vec2
  
  // Linked list pointers
  prev!: SSNode 
  next!: SSNode

  // Geometry cache
  bisector: Vec2 | null = null 
  
  // State
  isActive: boolean = true

  // Event tracking
  EdgeEvent: SkeletonEvent | null = null
  SplitEvent: SkeletonEvent | null = null
  
  creationTime: number = 0

  constructor(point: Vec2, id: number, time: number = 0) {
    this.point = point
    this.id = id
    this.creationTime = time
  }
}

type EventType = 'EDGE' | 'SPLIT'

interface SkeletonEvent {
  type: EventType
  time: number
  point: Vec2
  v?: SSNode 
  oppositeEdge?: SSNode 
}

// ═══════════════════════════════════════════════════
// Core Algorithm
// ═══════════════════════════════════════════════════

export function computeStraightSkeleton(polygon: Vec2[]): SkeletonResult {
  const n = polygon.length
  if (n < 3) return { faces: [], arcs: [] }

  // 1. Initialize Active Polygon (Doubly Linked List)
  const nodes: SSNode[] = []

  // Ensure CCW winding
  if (signedArea(polygon) < 0) {
    polygon.reverse()
  }

  for (let i = 0; i < n; i++) {
    const node = new SSNode(polygon[i], i)
    nodes.push(node)
    if (i > 0) {
      nodes[i - 1].next = node
      node.prev = nodes[i - 1]
    }
  }
  // Close loop
  nodes[n - 1].next = nodes[0]
  nodes[0].prev = nodes[n - 1]

  // Output collectors
  const outputArcs: SkeletonArc[] = []
  
  // 2. Priority Queue for Events
  const eventQueue: SkeletonEvent[] = []

  // 3. Initial computation
  const activeNodes = [...nodes]
  
  // Pass 1: Compute all bisectors
  activeNodes.forEach(node => {
    computeNodeBisector(node)
  })
  
  // Pass 2: Compute all events (Time = 0)
  activeNodes.forEach(node => computeNodeEvents(node, nodes, eventQueue, 0))

  // 4. Process Events
  let loopSafe = 0
  const loopLimit = n * 20 // Safety break

  while (eventQueue.length > 0 && loopSafe++ < loopLimit) {
    // Sort desc by time so we can pop the smallest
    eventQueue.sort((a, b) => {
      const diff = b.time - a.time
      if (Math.abs(diff) < 1e-6) {
        // Equal time: Prioritize SPLIT over EDGE
        // We found EDGE-first caused dropped events.
        // So we want SPLIT to be popped FIRST.
        // Put SPLIT at END of array.
        // So [EDGE, SPLIT].
        // So EDGE < SPLIT.
        // If a=EDGE, b=SPLIT. a before b. return -1.
        
        if (a.type === 'EDGE' && b.type === 'SPLIT') return -1
        if (a.type === 'SPLIT' && b.type === 'EDGE') return 1
        return 0
      }
      return diff
    }) 
    const evt = eventQueue.pop()!

    if (!evt || evt.time < -1e-5) continue 

    if (evt.type === 'EDGE') {
      const v = evt.v!
      const next = v.next
      
      // Validity check: are these nodes still active?
      if (!v.isActive || !next.isActive) continue
      
      // Strict check: if (v.EdgeEvent !== evt) continue
      // But if SPLIT refreshed the event with identical time, we should still process it.
      if (v.EdgeEvent !== evt) {
         const current = v.EdgeEvent
         if (!current || current.type !== 'EDGE' || Math.abs(current.time - evt.time) > 1e-6) {
            continue
         }
      } 

      // APPLY EDGE COLLAPSE
      outputArcs.push({
        start: v.point,
        end: evt.point,
        leftFace: v.prev.id,
        rightFace: v.id
      })
      outputArcs.push({
        start: next.point,
        end: evt.point,
        leftFace: v.id,
        rightFace: next.id
      })

      // Update Topology
      const prevNode = v.prev
      const nextNextNode = next.next

      // Special Case: Triangle collapse (3 nodes left in this loop)
      if (prevNode === nextNextNode) {
        // The last 3 nodes collapse to a single point (peak)
        outputArcs.push({
          start: prevNode.point,
          end: evt.point,
          leftFace: next.id,
          rightFace: prevNode.id
        })
        
        // Deactivate all
        v.isActive = false
        next.isActive = false
        prevNode.isActive = false
        continue // Loop closed
      }

      // Mark collapsed nodes as inactive
      v.isActive = false
      next.isActive = false

      const newNode = new SSNode(evt.point, next.id, evt.time) 
      newNode.id = next.id 

      newNode.prev = prevNode
      newNode.next = nextNextNode
      prevNode.next = newNode
      nextNextNode.prev = newNode
      
      // Recompute for involved nodes
      computeNodeBisector(prevNode)
      computeNodeBisector(newNode)
      computeNodeBisector(nextNextNode)
      
      computeNodeEvents(prevNode, nodes, eventQueue, evt.time)
      computeNodeEvents(newNode, nodes, eventQueue, evt.time)
      computeNodeEvents(nextNextNode, nodes, eventQueue, evt.time)

    } else if (evt.type === 'SPLIT') {
      const v = evt.v!
      const opp = evt.oppositeEdge! 
      
      if (!v.isActive) continue
      
      // If target edge is gone, recompute!
      if (opp && !opp.isActive) {
         if (v.SplitEvent === evt) {
            v.SplitEvent = null
         }
         computeNodeEvents(v, nodes, eventQueue, evt.time)
         continue
      }

      // Relaxed check for SPLIT as well
      if (v.SplitEvent !== evt) {
         const current = v.SplitEvent
         if (!current || current.type !== 'SPLIT' || Math.abs(current.time - evt.time) > 1e-6) {
            continue
         }
      }

      outputArcs.push({
        start: v.point,
        end: evt.point,
        leftFace: v.prev.id,
        rightFace: v.id
      })

      // Deactivate v
      v.isActive = false

      const pt = evt.point
      const oppNext = opp.next
      
      const distStart = Math.sqrt(distSq(pt, opp.point))
      const distEnd = Math.sqrt(distSq(pt, oppNext.point))
      const zeroTol = 1e-3

      // Node A (links vPrev -> A -> oppNext)
      // If pt is at End of Edge (oppNext), A->oppNext is 0 length. Skip A.
      let nodeA: SSNode | null = null
      if (distEnd > zeroTol) {
         nodeA = new SSNode(pt, opp.id, evt.time)
         
         const vPrev = v.prev
         vPrev.next = nodeA
         nodeA.prev = vPrev
         nodeA.next = oppNext
         oppNext.prev = nodeA
         
         computeNodeBisector(vPrev)
         computeNodeBisector(nodeA)
         computeNodeBisector(oppNext)
         
         computeNodeEvents(vPrev, nodes, eventQueue, evt.time)
         computeNodeEvents(nodeA, nodes, eventQueue, evt.time)
         // oppNext events handled below? No, need to handle here if A exists
      } else {
         // Skip A. vPrev -> oppNext
         const vPrev = v.prev
         vPrev.next = oppNext
         oppNext.prev = vPrev
         
         computeNodeBisector(vPrev)
         computeNodeBisector(oppNext)
         
         computeNodeEvents(vPrev, nodes, eventQueue, evt.time)
      }
      
      // Node B (links opp -> B -> vNext)
      // If pt is at Start of Edge (opp), opp->B is 0 length. Link opp.prev -> B. Deactivate opp.
      let nodeB: SSNode | null = null
      if (distStart > zeroTol) {
         nodeB = new SSNode(pt, v.id, evt.time)
         
         const vNext = v.next
         opp.next = nodeB
         nodeB.prev = opp
         nodeB.next = vNext
         vNext.prev = nodeB
         
         computeNodeBisector(opp)
         computeNodeBisector(nodeB)
         computeNodeBisector(vNext)
         
         computeNodeEvents(opp, nodes, eventQueue, evt.time)
         computeNodeEvents(nodeB, nodes, eventQueue, evt.time)
         computeNodeEvents(vNext, nodes, eventQueue, evt.time)
      } else {
         // Skip partial edge opp. Link opp.prev -> B.
         // Effectively B replaces opp.
         nodeB = new SSNode(pt, v.id, evt.time)
         
         const oppPrev = opp.prev
         const vNext = v.next
         
         oppPrev.next = nodeB
         nodeB.prev = oppPrev
         nodeB.next = vNext
         vNext.prev = nodeB
         
         opp.isActive = false // Deactivate opp!
         
         computeNodeBisector(oppPrev)
         computeNodeBisector(nodeB)
         computeNodeBisector(vNext)
         
         computeNodeEvents(oppPrev, nodes, eventQueue, evt.time)
         computeNodeEvents(nodeB, nodes, eventQueue, evt.time)
         computeNodeEvents(vNext, nodes, eventQueue, evt.time)
      }
      
      // Recompute oppNext for Loop A if needed
      if (distEnd > zeroTol) {
         computeNodeEvents(oppNext, nodes, eventQueue, evt.time)
      } else {
         computeNodeEvents(oppNext, nodes, eventQueue, evt.time)
      }
    }
  }

  // 5. Reconstruct Faces from Arcs
  const faces: SkeletonFace[] = []
  
  for (let i = 0; i < n; i++) {
    const edgeArcs = outputArcs.filter(a => a.leftFace === i || a.rightFace === i)
    if (edgeArcs.length === 0) continue 

    const loop = buildFacePolygon(i, polygon[i], polygon[(i+1)%n], edgeArcs)
    faces.push({ edgeIndex: i, polygon: loop })
  }

  return { faces, arcs: outputArcs }
}

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

function computeNodeBisector(node: SSNode) {
  const prevPt = node.prev.point
  const currPt = node.point
  const nextPt = node.next.point
  
  const u = normalize(subtract(currPt, prevPt))
  const v = normalize(subtract(nextPt, currPt))
  const n1 = { x: -u.y, y: u.x } 
  const n2 = { x: -v.y, y: v.x }
  
  const det = n1.x * n2.y - n1.y * n2.x
  let bx = 0, by = 0

  if (Math.abs(det) < 1e-3) {
    // Check for varying edge directions (Needle vs Collinear)
    const d = u.x * v.x + u.y * v.y
    if (d < -0.9) {
      // Needle (Antiparallel). Retreat along axis.
      bx = -u.x
      by = -u.y
    } else {
      bx = n1.x
      by = n1.y
    }
  } else {
    bx = (1 * n2.y - 1 * n1.y) / det
    by = (n1.x * 1 - n2.x * 1) / det
    
    // Snap to 45 degrees if close
    const absX = Math.abs(bx)
    const absY = Math.abs(by)
    if (absX > 1e-5 && absY > 1e-5) {
      const ratio = absX / absY
      if (Math.abs(ratio - 1) < 0.01) { // 1% tolerance
        // Force abs(x) == abs(y)
        // We preserve signs.
        // We need to satisfy n1.x*bx + n1.y*by = 1 (approx)
        // Let's pick direction d = (sign(bx), sign(by))
        // And find k such that n1.(k*d) = 1
        const signX = bx > 0 ? 1 : -1
        const signY = by > 0 ? 1 : -1
        const dx = signX
        const dy = signY
        
        // Solve k * (n1.x*dx + n1.y*dy) = 1
        const dotProd = n1.x * dx + n1.y * dy
        if (Math.abs(dotProd) > 1e-5) {
          const k = 1 / dotProd
          bx = k * dx
          by = k * dy
        }
      }
    }

    node.bisector = { x: bx, y: by }
  }
}

function computeNodeEvents(node: SSNode, allNodes: SSNode[], queue: SkeletonEvent[], currentTime: number) {
  // Edge Event
  const b1 = node.bisector
  const b2 = node.next.bisector 
  
  if (b1 && b2) {
    // EDGE COLLAPSE
    // Use Virtual Points at T=0 to solve for Absolute Time directly
    // P_virt = P_current - t_create * V_bisector
    // If node.creationTime is undefined (old code), default 0.
    const tc = node.creationTime || 0
    const tcn = node.next.creationTime || 0
    
    // Virtual Start at T=0
    const v1 = {
      x: node.point.x - tc * node.bisector!.x,
      y: node.point.y - tc * node.bisector!.y
    }
    const v2 = {
      x: node.next.point.x - tcn * node.next.bisector!.x,
      y: node.next.point.y - tcn * node.next.bisector!.y
    }
    
    // intersect T is absolute time
    const iRes = rayRayIntersectTime(v1, node.bisector!, v2, node.next.bisector!)

    if (iRes && iRes.t > currentTime + 1e-5) {
      const absTime = iRes.t
      
      // Physics Check for Edge Event (using Distance from Creation)
      // Node moved from Creation to Event.
      // Dist = absTime - creationTime.
      const dist = Math.sqrt(distSq(node.point, iRes.point))
      const timeDelta = absTime - tc
      
      if (dist < timeDelta - 1e-3) {
         // Invalid Slow Event
      } else {
        const evt: SkeletonEvent = {
          type: 'EDGE',
          time: absTime,
          point: iRes.point,
          v: node
        }
        node.EdgeEvent = evt
        queue.push(evt)
      }
    }
  }

  // Split Event
  const prevPt = node.prev.point
  const currPt = node.point
  const nextPt = node.next.point
  const u = normalize(subtract(currPt, prevPt))
  const v = normalize(subtract(nextPt, currPt))
  
  const crossP = cross(u, v)
  const isReflex = crossP < -1e-5 
  
  if (isReflex && node.bisector) {
    let bestT = Infinity
    let bestPt: Vec2 | null = null
    let bestEdgeNode: SSNode | null = null

    if (node.SplitEvent) {
      node.SplitEvent.time = -1
      node.SplitEvent = null
    }

    let curr = node.next.next 
    let safe = 0
    // Traverse the linked list
    while (curr !== node.prev && safe++ < 200) { 
      if (curr === node) break 
      
      const edgeStart = curr.point
      const edgeEnd = curr.next.point 
      
      const edgeVec = normalize(subtract(edgeEnd, edgeStart))
      const edgeNormal = { x: -edgeVec.y, y: edgeVec.x } 
      
      // Calculate Absolute Time using Virtual Point C_virt (at t=0)
      // Edge Line: N . X = C_0 + t
      // Ray: X = P_virt + t * B
      
      // Recover C_0 from original node (since Edge moves from T=0)
      const originalStart = allNodes[curr.id].point
      const C_0 = dot(edgeNormal, originalStart)

      // P_virt = P_creation - t_create * B
      const tc = node.creationTime || 0
      const virtStart = {
        x: node.point.x - tc * node.bisector!.x,
        y: node.point.y - tc * node.bisector!.y
      }
      
      const NB = dot(edgeNormal, node.bisector!)
      const numer = C_0 - dot(edgeNormal, virtStart)
      const denom = NB - 1
      
      if (Math.abs(denom) > 1e-4) {
        const absTime = numer / denom
        
        // We need T > currentTime (forward consistency)
        if (absTime > currentTime + 1e-4) {
           if (absTime < bestT) {
              const dt = absTime - currentTime
              const intersectPt: Vec2 = {
                x: node.point.x + dt * node.bisector!.x,
                y: node.point.y + dt * node.bisector!.y
              }
              
              if (curr.bisector && curr.next.bisector) { 
                 const sT = {
                   x: curr.point.x + dt * curr.bisector.x,
                   y: curr.point.y + dt * curr.bisector.y
                 }
                 const eT = {
                   x: curr.next.point.x + dt * curr.next.bisector.x,
                   y: curr.next.point.y + dt * curr.next.bisector.y
                 }
                 
                 if (isBetween(intersectPt, sT, eT)) {
                   bestT = absTime
                   bestPt = intersectPt
                   bestEdgeNode = curr
                 }
              }
           }
        }
      }
      curr = curr.next
    }

    if (bestEdgeNode && bestPt) {
      // Physics Check: Distance must be >= Time Delta (Node speed >= 1)
      const dist = Math.sqrt(distSq(node.point, bestPt))
      const dt = bestT - currentTime
      
      if (dist < dt - 1e-3) {
         // console.log(`Invalid Slow Event: ${dist.toFixed(3)} < ${dt.toFixed(3)}`)
      } else {
        const evt: SkeletonEvent = {
          type: 'SPLIT',
          time: bestT,
          point: bestPt,
          v: node,
          oppositeEdge: bestEdgeNode
        }
        node.SplitEvent = evt
        queue.push(evt)
      }
    }
  }
}

function isBetween(p: Vec2, a: Vec2, b: Vec2): boolean {
  const ab = subtract(b, a)
  const ap = subtract(p, a)
  const dotVal = dot(ap, ab)
  const abLenSq = dot(ab, ab)
  return dotVal >= -1e-4 && dotVal <= abLenSq + 1e-4
}


function buildFacePolygon(
  edgeIdx: number, 
  originalStart: Vec2, 
  originalEnd: Vec2, 
  arcs: SkeletonArc[]
): Vec2[] {
  // Graph Traversal Approach
  // We want to form a closed loop.
  // We know the base of the face is the original edge: originalStart -> originalEnd.
  // We need to find the path from originalEnd back to originalStart through the skeleton arcs.
  
  // 1. Filter relevant arcs
  const faceArcs = arcs.filter(a => a.leftFace === edgeIdx || a.rightFace === edgeIdx)
  
  if (faceArcs.length === 0) {
    return [originalStart, originalEnd]
  }

  // 2. Build Adjacency Graph for these arcs
  // Map<PointKey, Point[]>
  const adj = new Map<string, Vec2[]>()
  const ptKey = (p: Vec2) => `${p.x.toFixed(5)},${p.y.toFixed(5)}`
  
  const addEdge = (p1: Vec2, p2: Vec2) => {
    const k1 = ptKey(p1)
    const k2 = ptKey(p2)
    if (!adj.has(k1)) adj.set(k1, [])
    if (!adj.has(k2)) adj.set(k2, [])
    
    // Check duplicates
    if (!adj.get(k1)!.some(v => distSq(v, p2) < 1e-8)) adj.get(k1)!.push(p2)
    if (!adj.get(k2)!.some(v => distSq(v, p1) < 1e-8)) adj.get(k2)!.push(p1)
  }

  faceArcs.forEach(a => addEdge(a.start, a.end))

  // 3. Find path from originalEnd to originalStart
  const startKey = ptKey(originalEnd)
  const targetKey = ptKey(originalStart)
  
  if (!adj.has(startKey)) {
    return [originalStart, originalEnd]
  }

  // BFS
  const queue: { curr: Vec2, path: Vec2[] }[] = [{ curr: originalEnd, path: [originalEnd] }]
  const visited = new Set<string>(); visited.add(startKey)
  
  let bestPath: Vec2[] | null = null

  while (queue.length > 0) {
    const { curr, path } = queue.shift()!
    const key = ptKey(curr)
    
    if (key === targetKey) {
      bestPath = path
      break
    }
    
    const neighbors = adj.get(key) || []
    for (const next of neighbors) {
      const nKey = ptKey(next)
      if (!visited.has(nKey)) {
        visited.add(nKey)
        queue.push({ curr: next, path: [...path, next] })
      }
    }
  }

  if (bestPath) {
    const loop = [originalStart, ...bestPath.slice(0, bestPath.length - 1)]
    return loop
  } else {
    return simpleAngularSort(originalStart, originalEnd, arcs)
  }
}

function simpleAngularSort(p1: Vec2, p2: Vec2, arcs: SkeletonArc[]): Vec2[] {
  const rawPts: Vec2[] = [p1, p2]
  arcs.forEach(a => { rawPts.push(a.start); rawPts.push(a.end) })
  
  const uniquePts: Vec2[] = []
  rawPts.forEach(p => {
    if (!uniquePts.some(u => distSq(u, p) < 1e-6)) uniquePts.push(p)
  })
  
  let cx = 0, cy = 0
  uniquePts.forEach(p => { cx += p.x; cy += p.y })
  cx /= uniquePts.length; cy /= uniquePts.length
  
  return uniquePts.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
}

function subtract(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y } }
function add(a: Vec2, b: Vec2): Vec2 { return { x: a.x + b.x, y: a.y + b.y } }
function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y)
  return len > 1e-10 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 }
}
function cross(a: Vec2, b: Vec2): number { return a.x * b.y - a.y * b.x }
function dot(a: Vec2, b: Vec2): number { return a.x * b.x + a.y * b.y }
function distSq(a: Vec2, b: Vec2): number { return (a.x-b.x)**2 + (a.y-b.y)**2 }

function signedArea(pts: Vec2[]): number {
  let area = 0
  for(let i=0; i<pts.length; i++) area += cross(pts[i], pts[(i+1)%pts.length])
  return area / 2
}

function rayRayIntersectTime(
  o1: Vec2, d1: Vec2,
  o2: Vec2, d2: Vec2
): { t: number, point: Vec2 } | null {
  const det = d1.x * d2.y - d1.y * d2.x
  if (Math.abs(det) < 1e-8) return null
  const dx = o2.x - o1.x
  const dy = o2.y - o1.y
  const t = (dx * d2.y - dy * d2.x) / det
  
  return { t, point: { x: o1.x + t * d1.x, y: o1.y + t * d1.y } }
}
