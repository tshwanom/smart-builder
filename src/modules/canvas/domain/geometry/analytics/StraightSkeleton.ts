import { Vec2 } from './types'

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
  // FIX 6: expose the CCW-normalised polygon so callers can map edgeIndex
  // back to the correct vertices (the skeleton may have reversed the input)
  polygon: Vec2[]
}

// ═══════════════════════════════════════════════════
// SSNode
// ═══════════════════════════════════════════════════
class SSNode {
  id: number
  point: Vec2
  prev!: SSNode
  next!: SSNode
  bisector: Vec2 | null = null
  leftEdgeId: number
  rightEdgeId: number
  isActive: boolean = true
  EdgeEvent: SkeletonEvent | null = null
  SplitEvent: SkeletonEvent | null = null
  creationTime: number = 0
  // FIX 4: only original polygon vertices can be reflex —
  // post-collapse/split nodes have non-adjacent edge IDs so their
  // cross product is meaningless and produces false-positive reflexes
  isOriginal: boolean = false

  constructor(point: Vec2, id: number, leftEdgeId: number, rightEdgeId: number, time: number = 0) {
    this.point = point
    this.id = id
    this.leftEdgeId  = leftEdgeId
    this.rightEdgeId = rightEdgeId
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
  if (n < 3) return { faces: [], arcs: [], polygon: [...polygon] }

  // FIX 6: work on a local copy so we never mutate the caller's array.
  // We also RETURN the normalised polygon so callers (RoofEngine) can use it
  // for edge-index → vertex lookups, ensuring they stay in sync with the face
  // indices the skeleton produces.
  let poly = [...polygon]
  if (signedArea(poly) < 0) poly = poly.slice().reverse()

  const nodes: SSNode[] = []

  for (let i = 0; i < n; i++) {
    const node = new SSNode(poly[i], i, (i - 1 + n) % n, i)
    node.isOriginal = true
    nodes.push(node)
    if (i > 0) {
      nodes[i - 1].next = node
      node.prev = nodes[i - 1]
    }
  }
  nodes[n - 1].next = nodes[0]
  nodes[0].prev = nodes[n - 1]

  const outputArcs: SkeletonArc[] = []
  const eventQueue: SkeletonEvent[] = []

  nodes.forEach(node => {
    node.bisector = bisectorFromEdges(node.leftEdgeId, node.rightEdgeId, poly)
  })

  nodes.forEach(node => computeNodeEvents(node, eventQueue, poly, 0))

  let loopSafe = 0
  const loopLimit = Math.max(n * 300, 5000)
  let currentTime = 0
  const startTime = Date.now()

  while (eventQueue.length > 0 && loopSafe++ < loopLimit) {
    if (Date.now() - startTime > 500) {
      console.warn('[StraightSkeleton] Timeout - aborting to prevent hang')
      break
    }
    eventQueue.sort((a, b) => {
      const diff = b.time - a.time
      if (Math.abs(diff) < 1e-6) {
        if (a.type === 'EDGE' && b.type === 'SPLIT') return -1
        if (a.type === 'SPLIT' && b.type === 'EDGE') return 1
        return 0
      }
      return diff
    })
    const evt = eventQueue.pop()!

    if (evt.time < 0) continue  // explicitly invalidated

    if (evt.time < currentTime) {
      if (evt.time < currentTime - 1e-3) continue
      evt.time = currentTime
    }
    if (evt.time > currentTime) currentTime = evt.time

    if (evt.type === 'EDGE') {
      const v    = evt.v!
      const next = v.next

      if (!v.isActive || !next.isActive) continue

      if (v.EdgeEvent !== evt) {
        const cur = v.EdgeEvent
        if (!cur || cur.type !== 'EDGE' || Math.abs(cur.time - evt.time) > 1e-6) continue
      }

      outputArcs.push({ start: v.point,    end: evt.point, leftFace: v.leftEdgeId,    rightFace: v.rightEdgeId    })
      outputArcs.push({ start: next.point, end: evt.point, leftFace: next.leftEdgeId, rightFace: next.rightEdgeId })

      const prevNode     = v.prev
      const nextNextNode = next.next

      if (prevNode === nextNextNode) {
        outputArcs.push({ start: prevNode.point, end: evt.point, leftFace: prevNode.leftEdgeId, rightFace: prevNode.rightEdgeId })
        v.isActive = false; next.isActive = false; prevNode.isActive = false
        continue
      }

      v.isActive = false; next.isActive = false

      const newNode = new SSNode(evt.point, next.id, v.leftEdgeId, next.rightEdgeId, evt.time)
      newNode.bisector = bisectorFromEdges(newNode.leftEdgeId, newNode.rightEdgeId, poly)

      newNode.prev = prevNode;     prevNode.next     = newNode
      newNode.next = nextNextNode; nextNextNode.prev = newNode

      computeNodeEvents(prevNode,     eventQueue, poly, evt.time)
      computeNodeEvents(newNode,      eventQueue, poly, evt.time)
      computeNodeEvents(nextNextNode, eventQueue, poly, evt.time)

      checkAndCollapseDegenerate(newNode, outputArcs)

    } else if (evt.type === 'SPLIT') {
      const v   = evt.v!
      const opp = evt.oppositeEdge!

      if (!v.isActive) continue

      if (opp && !opp.isActive) {
        if (v.SplitEvent === evt) v.SplitEvent = null
        computeNodeEvents(v, eventQueue, poly, evt.time)
        continue
      }

      if (v.SplitEvent !== evt) {
        const cur = v.SplitEvent
        if (!cur || cur.type !== 'SPLIT' || Math.abs(cur.time - evt.time) > 1e-6) continue
      }

      outputArcs.push({ start: v.point, end: evt.point, leftFace: v.leftEdgeId, rightFace: v.rightEdgeId })
      v.isActive = false

      const pt        = evt.point
      const oppNext   = opp.next
      const distStart = Math.sqrt(distSq(pt, opp.point))
      const distEnd   = Math.sqrt(distSq(pt, oppNext.point))
      const zeroTol   = 1e-3

      let nodeA: SSNode | null = null
      if (distEnd > zeroTol) {
        nodeA = new SSNode(pt, opp.id, v.leftEdgeId, opp.rightEdgeId, evt.time)
        nodeA.bisector = bisectorFromEdges(nodeA.leftEdgeId, nodeA.rightEdgeId, poly)
        const vPrev = v.prev
        vPrev.next = nodeA;   nodeA.prev  = vPrev
        nodeA.next = oppNext; oppNext.prev = nodeA
        computeNodeEvents(vPrev,   eventQueue, poly, evt.time)
        computeNodeEvents(nodeA,   eventQueue, poly, evt.time)
        computeNodeEvents(oppNext, eventQueue, poly, evt.time)
      } else {
        const vPrev = v.prev
        vPrev.next = oppNext; oppNext.prev = vPrev
        computeNodeEvents(vPrev,   eventQueue, poly, evt.time)
        computeNodeEvents(oppNext, eventQueue, poly, evt.time)
      }

      let nodeB: SSNode | null = null
      if (distStart > zeroTol) {
        nodeB = new SSNode(pt, v.id, opp.leftEdgeId, v.rightEdgeId, evt.time)
        nodeB.bisector = bisectorFromEdges(nodeB.leftEdgeId, nodeB.rightEdgeId, poly)
        const vNext = v.next
        opp.next  = nodeB; nodeB.prev = opp
        nodeB.next = vNext; vNext.prev = nodeB
        computeNodeEvents(opp,   eventQueue, poly, evt.time)
        computeNodeEvents(nodeB, eventQueue, poly, evt.time)
        computeNodeEvents(vNext, eventQueue, poly, evt.time)
      } else {
        nodeB = new SSNode(pt, v.id, opp.leftEdgeId, v.rightEdgeId, evt.time)
        nodeB.bisector = bisectorFromEdges(nodeB.leftEdgeId, nodeB.rightEdgeId, poly)
        const oppPrev = opp.prev
        const vNext   = v.next
        oppPrev.next = nodeB; nodeB.prev = oppPrev
        nodeB.next   = vNext; vNext.prev = nodeB
        opp.isActive = false
        computeNodeEvents(oppPrev, eventQueue, poly, evt.time)
        computeNodeEvents(nodeB,   eventQueue, poly, evt.time)
        computeNodeEvents(vNext,   eventQueue, poly, evt.time)
      }

      if (nodeA && nodeA.isActive) checkAndCollapseDegenerate(nodeA, outputArcs)
      if (nodeB && nodeB.isActive) checkAndCollapseDegenerate(nodeB, outputArcs)
    }
  }

  const faces: SkeletonFace[] = []
  for (let i = 0; i < n; i++) {
    const edgeArcs = outputArcs.filter(a => a.leftFace === i || a.rightFace === i)
    if (edgeArcs.length === 0) continue
    const loop = buildFacePolygon(i, poly[i], poly[(i + 1) % n], edgeArcs)
    if (loop.length >= 3) faces.push({ edgeIndex: i, polygon: loop })
  }

  // Return the normalised poly so callers can map edgeIndex → correct vertices
  return { faces, arcs: outputArcs, polygon: poly }
}

// ═══════════════════════════════════════════════════
// computeNodeEvents
// ═══════════════════════════════════════════════════
function computeNodeEvents(
  node: SSNode,
  queue: SkeletonEvent[],
  polygon: Vec2[],
  currentTime: number
) {
  // ── Edge Event ──────────────────────────────────
  //
  // FIX 5 — CRITICAL: always kill + clear the old EdgeEvent before recomputing.
  //
  // If no new valid edge event is found after a topology change, node.EdgeEvent
  // would retain the OLD stale event.  When that stale event later pops from the
  // queue, v.EdgeEvent === evt is TRUE (same object reference), so it passes
  // validation and fires with wrong evt.point / wrong v.next.  Arcs then get
  // wrong endpoints and wrong face IDs → entire wings disappear.
  //
  // Setting time = -1 kills the old event in the queue (main loop skips time < 0).
  if (node.EdgeEvent) {
    node.EdgeEvent.time = -1
    node.EdgeEvent = null
  }

  const b1 = node.bisector
  const b2 = node.next.bisector

  if (b1 && b2) {
    const tc  = node.creationTime
    const tcn = node.next.creationTime
    const v1 = { x: node.point.x - tc * b1.x,       y: node.point.y - tc * b1.y }
    const v2 = { x: node.next.point.x - tcn * b2.x, y: node.next.point.y - tcn * b2.y }

    const iRes = rayRayIntersectTime(v1, b1, v2, b2)
    if (iRes && iRes.t > currentTime + 1e-5) {
      const evt: SkeletonEvent = { type: 'EDGE', time: iRes.t, point: iRes.point, v: node }
      node.EdgeEvent = evt
      queue.push(evt)
    }
  }

  // ── Split Event ──────────────────────────────────
  // FIX 4: only original polygon vertices can be reflex
  if (!node.isOriginal || !node.bisector) return

  const inDir  = normalize(subtract(polygon[(node.leftEdgeId  + 1) % polygon.length], polygon[node.leftEdgeId]))
  const outDir = normalize(subtract(polygon[(node.rightEdgeId + 1) % polygon.length], polygon[node.rightEdgeId]))
  const isReflex = cross(inDir, outDir) < -1e-5

  if (isReflex) {
    if (node.SplitEvent) { node.SplitEvent.time = -1; node.SplitEvent = null }

    let bestT = Infinity, bestPt: Vec2 | null = null, bestEdgeNode: SSNode | null = null

    // Start at node.next.next — skip the two wavefront-adjacent edges
    // (node.prev→node and node→node.next) which are handled by edge events.
    // Starting at node.next would include the edge node.next→node.next.next
    // which IS adjacent in the current wavefront, causing invalid split events
    // that fire outside the polygon.
    let curr = node.next.next
    let safe = 0
    while (curr !== node.prev && safe++ < 2000) {
      if (curr === node) break
      if (!curr.isActive || !curr.next.isActive) { curr = curr.next; continue }

      const edgeId = curr.rightEdgeId
      const origEdgeDir = normalize(subtract(
        polygon[(edgeId + 1) % polygon.length],
        polygon[edgeId]
      ))
      const edgeNormal  = { x: -origEdgeDir.y, y: origEdgeDir.x }
      const C_0         = dot(edgeNormal, polygon[edgeId])
      const tc          = node.creationTime
      const virtStart   = {
        x: node.point.x - tc * node.bisector!.x,
        y: node.point.y - tc * node.bisector!.y
      }
      const NB    = dot(edgeNormal, node.bisector!)
      const numer = C_0 - dot(edgeNormal, virtStart)
      const denom = NB - 1

      if (Math.abs(denom) > 1e-6) {
        const absTime = numer / denom
        if (absTime > currentTime + 1e-5 && absTime < bestT) {
          // FIX 2: delta from node.creationTime not currentTime
          const intersectPt: Vec2 = {
            x: node.point.x + (absTime - node.creationTime) * node.bisector!.x,
            y: node.point.y + (absTime - node.creationTime) * node.bisector!.y
          }
          if (curr.bisector && curr.next.bisector) {
            // FIX 3: each endpoint uses its OWN creationTime
            const sT = {
              x: curr.point.x      + (absTime - curr.creationTime)      * curr.bisector.x,
              y: curr.point.y      + (absTime - curr.creationTime)      * curr.bisector.y
            }
            const eT = {
              x: curr.next.point.x + (absTime - curr.next.creationTime) * curr.next.bisector.x,
              y: curr.next.point.y + (absTime - curr.next.creationTime) * curr.next.bisector.y
            }
            if (isBetween(intersectPt, sT, eT)) {
              bestT = absTime; bestPt = intersectPt; bestEdgeNode = curr
            }
          }
        }
      }
      curr = curr.next
    }

    if (bestEdgeNode && bestPt) {
      const evt: SkeletonEvent = { type: 'SPLIT', time: bestT, point: bestPt, v: node, oppositeEdge: bestEdgeNode }
      node.SplitEvent = evt
      queue.push(evt)
    }
  }
}

// ═══════════════════════════════════════════════════
// Degenerate loop collapse
// ═══════════════════════════════════════════════════
function checkAndCollapseDegenerate(node: SSNode, outputArcs: SkeletonArc[]) {
  if (!node.isActive) return
  const loop: SSNode[] = []
  let curr = node
  let safe = 0
  do { loop.push(curr); curr = curr.next; safe++ } while (curr !== node && safe < 1000)
  if (safe >= 1000) return

  let changed = false
  do {
    changed = false
    if (loop.length < 3) break
    for (let i = 0; i < loop.length; i++) {
      const u = loop[(i - 1 + loop.length) % loop.length]
      const v = loop[i]
      const w = loop[(i + 1) % loop.length]
      if (!v.isActive) continue
      const d1 = normalize(subtract(v.point, u.point))
      const d2 = normalize(subtract(w.point, v.point))
      if (dot(d1, d2) < -0.9) {
        if (distSq(u.point, v.point) > 1e-6)
          outputArcs.push({ start: u.point, end: v.point, leftFace: u.leftEdgeId, rightFace: u.rightEdgeId })
        v.isActive = false; u.next = w; w.prev = u
        loop.splice(i, 1); changed = true; i--
      }
    }
  } while (changed && loop.length >= 3)

  let area = 0
  for (let i = 0; i < loop.length; i++) {
    if (!loop[i].isActive) continue
    const p1 = loop[i].point, p2 = loop[i].next.point
    area += p1.x * p2.y - p1.y * p2.x
  }
  if (Math.abs(area) * 0.5 < 1e-3) {
    for (let i = 0; i < loop.length; i++) {
      const u = loop[i], v = loop[(i + 1) % loop.length]
      if (distSq(u.point, v.point) > 1e-6)
        outputArcs.push({ start: u.point, end: v.point, leftFace: u.leftEdgeId, rightFace: u.rightEdgeId })
      u.isActive = false
    }
  }
}

// ═══════════════════════════════════════════════════
// bisectorFromEdges
// ═══════════════════════════════════════════════════
function bisectorFromEdges(leftEdgeId: number, rightEdgeId: number, polygon: Vec2[]): Vec2 {
  const n = polygon.length
  const inDir  = normalize(subtract(polygon[(leftEdgeId  + 1) % n], polygon[leftEdgeId]))
  const outDir = normalize(subtract(polygon[(rightEdgeId + 1) % n], polygon[rightEdgeId]))
  const n1 = { x: -inDir.y,  y: inDir.x  }
  const n2 = { x: -outDir.y, y: outDir.x }
  const det = n1.x * n2.y - n1.y * n2.x
  let bx: number, by: number
  if (Math.abs(det) < 1e-6) {
    const d = dot(inDir, outDir)
    if (d < -0.9999) { bx = -inDir.x; by = -inDir.y }
    else             { bx = n1.x;     by = n1.y     }
  } else {
    bx = (n2.y - n1.y) / det
    by = (n1.x - n2.x) / det
  }
  return { x: bx, y: by }
}

// ═══════════════════════════════════════════════════
// buildFacePolygon — directed arc traversal
// ═══════════════════════════════════════════════════
function buildFacePolygon(
  edgeIdx: number,
  originalStart: Vec2,
  originalEnd: Vec2,
  arcs: SkeletonArc[]
): Vec2[] {
  const faceArcs = arcs.filter(a => a.leftFace === edgeIdx || a.rightFace === edgeIdx)
  if (faceArcs.length === 0) return [originalStart, originalEnd]

  const ptKey  = (p: Vec2) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`

  // Build DIRECTED adjacency respecting face winding:
  //   leftFace === edgeIdx  → arc goes start→end around this face
  //   rightFace === edgeIdx → arc goes end→start around this face
  const dirAdj = new Map<string, Vec2[]>()
  const addDir = (from: Vec2, to: Vec2) => {
    const k = ptKey(from)
    if (!dirAdj.has(k)) dirAdj.set(k, [])
    const list = dirAdj.get(k)!
    if (!list.some(v => distSq(v, to) < 1e-8)) list.push(to)
  }
  for (const arc of faceArcs) {
    if (arc.leftFace  === edgeIdx) addDir(arc.start, arc.end)
    else                           addDir(arc.end,   arc.start)
  }

  // Walk from originalEnd → ... → originalStart
  const path: Vec2[]    = [originalEnd]
  const visited         = new Set<string>()
  visited.add(ptKey(originalEnd))
  const targetKey = ptKey(originalStart)
  let curr        = originalEnd

  for (let safe = 0; safe < 1000; safe++) {
    const key = ptKey(curr)
    if (key === targetKey) break
    const neighbors = dirAdj.get(key)
    if (!neighbors || neighbors.length === 0) break

    // Prefer unvisited; if all visited pick the one closest to target
    const unvisited = neighbors.filter(nb => !visited.has(ptKey(nb)))
    const chosen    = unvisited.length > 0
      ? unvisited[0]
      : neighbors.reduce((best, nb) =>
          distSq(nb, originalStart) < distSq(best, originalStart) ? nb : best
        , neighbors[0])

    const nKey = ptKey(chosen)
    if (visited.has(nKey) && nKey !== targetKey) break
    visited.add(nKey)
    path.push(chosen)
    curr = chosen
    if (nKey === targetKey) break
  }

  // path: [originalEnd, ..., originalStart]  remove duplicate originalStart tail
  if (path.length >= 2 && distSq(path[path.length - 1], originalStart) < 1e-6) path.pop()
  if (path.length < 1) return [originalStart, originalEnd]
  return [originalStart, ...path]
}

// ═══════════════════════════════════════════════════
// Math Utilities
// ═══════════════════════════════════════════════════
function subtract(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y } }
function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y)
  return len > 1e-10 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 }
}
function cross(a: Vec2, b: Vec2): number  { return a.x * b.y - a.y * b.x }
function dot(a: Vec2, b: Vec2): number    { return a.x * b.x + a.y * b.y }
function distSq(a: Vec2, b: Vec2): number { return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }

function signedArea(pts: Vec2[]): number {
  let area = 0
  for (let i = 0; i < pts.length; i++) area += cross(pts[i], pts[(i + 1) % pts.length])
  return area / 2
}

function isBetween(p: Vec2, a: Vec2, b: Vec2): boolean {
  const ab = subtract(b, a), ap = subtract(p, a)
  const dotVal = dot(ap, ab), abLenSq = dot(ab, ab)
  return dotVal >= -1e-4 && dotVal <= abLenSq + 1e-4
}

function rayRayIntersectTime(
  o1: Vec2, d1: Vec2,
  o2: Vec2, d2: Vec2
): { t: number; point: Vec2 } | null {
  const det = d1.x * d2.y - d1.y * d2.x
  if (Math.abs(det) < 1e-8) return null
  const dx = o2.x - o1.x, dy = o2.y - o1.y
  const t  = (dx * d2.y - dy * d2.x) / det
  return { t, point: { x: o1.x + t * d1.x, y: o1.y + t * d1.y } }
}
