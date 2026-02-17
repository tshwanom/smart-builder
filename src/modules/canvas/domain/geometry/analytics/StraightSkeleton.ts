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

// ═══════════════════════════════════════════════════
// SSNode
//
// CRITICAL DESIGN: bisectors are NEVER computed from node.point positions.
// Instead each node stores leftEdgeId and rightEdgeId — the indices of the
// two original polygon edges whose angle bisector this node sits on.
// The bisector velocity is recomputed from those original edge directions
// using bisectorFromEdges(). This guarantees locked 45° angles always.
//
// Propagation rules (never lose the angle):
//   EDGE COLLAPSE (V, V_next → newNode):
//     newNode.leftEdgeId  = V.leftEdgeId
//     newNode.rightEdgeId = V_next.rightEdgeId
//
//   SPLIT (reflex V hits edge opp→oppNext → nodeA, nodeB):
//     nodeA.leftEdgeId  = V.leftEdgeId       nodeA.rightEdgeId = opp.rightEdgeId
//     nodeB.leftEdgeId  = opp.leftEdgeId     nodeB.rightEdgeId = V.rightEdgeId
// ═══════════════════════════════════════════════════
class SSNode {
  id: number
  point: Vec2

  prev!: SSNode
  next!: SSNode

  bisector: Vec2 | null = null

  // ── LOCKED EDGE TRACKING ─────────────────────────
  leftEdgeId: number   // original edge index incoming to this vertex
  rightEdgeId: number  // original edge index outgoing from this vertex
  // ─────────────────────────────────────────────────

  isActive: boolean = true
  EdgeEvent: SkeletonEvent | null = null
  SplitEvent: SkeletonEvent | null = null
  creationTime: number = 0

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
  if (n < 3) return { faces: [], arcs: [] }

  const nodes: SSNode[] = []

  if (signedArea(polygon) < 0) polygon.reverse()

  for (let i = 0; i < n; i++) {
    // leftEdgeId = incoming edge = (i-1+n)%n, rightEdgeId = outgoing edge = i
    const node = new SSNode(polygon[i], i, (i - 1 + n) % n, i)
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
  const activeNodes = [...nodes]

  // Compute all bisectors from locked edge directions
  activeNodes.forEach(node => {
    node.bisector = bisectorFromEdges(node.leftEdgeId, node.rightEdgeId, polygon)
    console.log(`INIT Node ${node.id}: Pt(${node.point.x.toFixed(2)},${node.point.y.toFixed(2)}) edges(${node.leftEdgeId},${node.rightEdgeId}) B(${node.bisector.x.toFixed(3)},${node.bisector.y.toFixed(3)})`)
  })

  activeNodes.forEach(node => computeNodeEvents(node, nodes, eventQueue, polygon, 0))

  let loopSafe = 0
  const loopLimit = n * 20
  let currentTime = 0

  while (eventQueue.length > 0 && loopSafe++ < loopLimit) {
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
    console.log(`POP ${evt.type} T=${evt.time.toFixed(6)}`)

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
        const current = v.EdgeEvent
        if (!current || current.type !== 'EDGE' || Math.abs(current.time - evt.time) > 1e-6) continue
      }

      outputArcs.push({ start: v.point,    end: evt.point, leftFace: v.leftEdgeId,  rightFace: v.rightEdgeId })
      outputArcs.push({ start: next.point, end: evt.point, leftFace: next.leftEdgeId, rightFace: next.rightEdgeId })

      const prevNode     = v.prev
      const nextNextNode = next.next

      if (prevNode === nextNextNode) {
        outputArcs.push({ start: prevNode.point, end: evt.point, leftFace: prevNode.leftEdgeId, rightFace: prevNode.rightEdgeId })
        v.isActive = false; next.isActive = false; prevNode.isActive = false
        continue
      }

      v.isActive = false; next.isActive = false

      // EDGE COLLAPSE: new node inherits leftEdgeId from V, rightEdgeId from V_next
      const newNode = new SSNode(evt.point, next.id, v.leftEdgeId, next.rightEdgeId, evt.time)
      newNode.bisector = bisectorFromEdges(newNode.leftEdgeId, newNode.rightEdgeId, polygon)

      newNode.prev = prevNode;     prevNode.next     = newNode
      newNode.next = nextNextNode; nextNextNode.prev = newNode

      computeNodeEvents(prevNode,     nodes, eventQueue, polygon, evt.time)
      computeNodeEvents(newNode,      nodes, eventQueue, polygon, evt.time)
      computeNodeEvents(nextNextNode, nodes, eventQueue, polygon, evt.time)

      checkAndCollapseDegenerate(newNode, outputArcs)

    } else if (evt.type === 'SPLIT') {
      const v   = evt.v!
      const opp = evt.oppositeEdge!

      if (!v.isActive) continue

      if (opp && !opp.isActive) {
        if (v.SplitEvent === evt) v.SplitEvent = null
        computeNodeEvents(v, nodes, eventQueue, polygon, evt.time)
        continue
      }

      if (v.SplitEvent !== evt) {
        const current = v.SplitEvent
        if (!current || current.type !== 'SPLIT' || Math.abs(current.time - evt.time) > 1e-6) continue
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
        // SPLIT nodeA: left=V.leftEdgeId, right=opp.rightEdgeId
        nodeA = new SSNode(pt, opp.id, v.leftEdgeId, opp.rightEdgeId, evt.time)
        nodeA.bisector = bisectorFromEdges(nodeA.leftEdgeId, nodeA.rightEdgeId, polygon)

        const vPrev = v.prev
        vPrev.next = nodeA;   nodeA.prev  = vPrev
        nodeA.next = oppNext; oppNext.prev = nodeA

        computeNodeEvents(vPrev,   nodes, eventQueue, polygon, evt.time)
        computeNodeEvents(nodeA,   nodes, eventQueue, polygon, evt.time)
        computeNodeEvents(oppNext, nodes, eventQueue, polygon, evt.time)
      } else {
        const vPrev = v.prev
        vPrev.next = oppNext; oppNext.prev = vPrev
        computeNodeEvents(vPrev,   nodes, eventQueue, polygon, evt.time)
        computeNodeEvents(oppNext, nodes, eventQueue, polygon, evt.time)
      }

      let nodeB: SSNode | null = null
      if (distStart > zeroTol) {
        // SPLIT nodeB: left=opp.leftEdgeId, right=V.rightEdgeId
        nodeB = new SSNode(pt, v.id, opp.leftEdgeId, v.rightEdgeId, evt.time)
        nodeB.bisector = bisectorFromEdges(nodeB.leftEdgeId, nodeB.rightEdgeId, polygon)

        const vNext = v.next
        opp.next  = nodeB; nodeB.prev = opp
        nodeB.next = vNext; vNext.prev = nodeB

        computeNodeEvents(opp,   nodes, eventQueue, polygon, evt.time)
        computeNodeEvents(nodeB, nodes, eventQueue, polygon, evt.time)
        computeNodeEvents(vNext, nodes, eventQueue, polygon, evt.time)
      } else {
        nodeB = new SSNode(pt, v.id, opp.leftEdgeId, v.rightEdgeId, evt.time)
        nodeB.bisector = bisectorFromEdges(nodeB.leftEdgeId, nodeB.rightEdgeId, polygon)

        const oppPrev = opp.prev
        const vNext   = v.next
        oppPrev.next = nodeB; nodeB.prev = oppPrev
        nodeB.next   = vNext; vNext.prev = nodeB
        opp.isActive = false

        computeNodeEvents(oppPrev, nodes, eventQueue, polygon, evt.time)
        computeNodeEvents(nodeB,   nodes, eventQueue, polygon, evt.time)
        computeNodeEvents(vNext,   nodes, eventQueue, polygon, evt.time)
      }

      if (nodeA && nodeA.isActive) checkAndCollapseDegenerate(nodeA, outputArcs)
      if (nodeB && nodeB.isActive) checkAndCollapseDegenerate(nodeB, outputArcs)
    }
  }

  const faces: SkeletonFace[] = []
  for (let i = 0; i < n; i++) {
    const edgeArcs = outputArcs.filter(a => a.leftFace === i || a.rightFace === i)
    if (edgeArcs.length === 0) continue
    const loop = buildFacePolygon(i, polygon[i], polygon[(i + 1) % n], edgeArcs)
    faces.push({ edgeIndex: i, polygon: loop })
  }

  return { faces, arcs: outputArcs }
}

// ═══════════════════════════════════════════════════
// bisectorFromEdges — THE LOCK
//
// Computes the bisector velocity from the TWO ORIGINAL POLYGON EDGE DIRECTIONS.
// This is called once at node creation and never again from positions.
// Since polygon[] never changes, bisectors are permanently correct.
//
// Solves: n_left · B = 1,  n_right · B = 1
// where n_left  = inward normal of polygon edge [leftEdgeId]
//       n_right = inward normal of polygon edge [rightEdgeId]
// ═══════════════════════════════════════════════════
function bisectorFromEdges(leftEdgeId: number, rightEdgeId: number, polygon: Vec2[]): Vec2 {
  const n = polygon.length

  // Incoming edge direction (leftEdgeId → leftEdgeId+1)
  const inDir = normalize(subtract(
    polygon[(leftEdgeId + 1) % n],
    polygon[leftEdgeId]
  ))
  // Outgoing edge direction (rightEdgeId → rightEdgeId+1)
  const outDir = normalize(subtract(
    polygon[(rightEdgeId + 1) % n],
    polygon[rightEdgeId]
  ))

  // Inward normals (CCW polygon: rotate 90° CCW)
  const n1 = { x: -inDir.y,  y: inDir.x  }
  const n2 = { x: -outDir.y, y: outDir.x }

  const det = n1.x * n2.y - n1.y * n2.x

  let bx: number, by: number

  if (Math.abs(det) < 1e-6) {
    const d = dot(inDir, outDir)
    if (d < -0.9999) {
      bx = -inDir.x; by = -inDir.y   // anti-parallel needle
    } else {
      bx = n1.x; by = n1.y           // parallel/straight-through
    }
  } else {
    bx = (n2.y - n1.y) / det
    by = (n1.x - n2.x) / det
  }

  return { x: bx, y: by }
}

// ═══════════════════════════════════════════════════
// computeNodeEvents
// ═══════════════════════════════════════════════════
function computeNodeEvents(
  node: SSNode,
  allNodes: SSNode[],
  queue: SkeletonEvent[],
  polygon: Vec2[],
  currentTime: number
) {
  const b1 = node.bisector
  const b2 = node.next.bisector

  // ── Edge Event ──────────────────────────────────
  if (b1 && b2) {
    const tc  = node.creationTime
    const tcn = node.next.creationTime

    const v1 = { x: node.point.x - tc * b1.x,           y: node.point.y - tc * b1.y }
    const v2 = { x: node.next.point.x - tcn * b2.x,     y: node.next.point.y - tcn * b2.y }

    const iRes = rayRayIntersectTime(v1, b1, v2, b2)
    if (iRes && iRes.t > currentTime + 1e-5) {
      const evt: SkeletonEvent = { type: 'EDGE', time: iRes.t, point: iRes.point, v: node }
      console.log(`  EDGE: ${node.id}-${node.next.id} T=${iRes.t.toFixed(5)}`)
      node.EdgeEvent = evt
      queue.push(evt)
    }
  }

  // ── Split Event ──────────────────────────────────
  // Reflex check: use original edge directions (not node positions)
  const inDir  = normalize(subtract(polygon[(node.leftEdgeId + 1)  % polygon.length], polygon[node.leftEdgeId]))
  const outDir = normalize(subtract(polygon[(node.rightEdgeId + 1) % polygon.length], polygon[node.rightEdgeId]))
  const isReflex = cross(inDir, outDir) < -1e-5

  if (isReflex && node.bisector) {
    if (node.SplitEvent) { node.SplitEvent.time = -1; node.SplitEvent = null }

    let bestT = Infinity, bestPt: Vec2 | null = null, bestEdgeNode: SSNode | null = null

    let curr = node.next.next
    let safe = 0
    while (curr !== node.prev && safe++ < 200) {
      if (curr === node) break
      if (!curr.isActive || !curr.next.isActive) { curr = curr.next; continue }

      // Use original edge direction for edgeNormal
      const edgeId = curr.rightEdgeId
      const origEdgeDir = normalize(subtract(
        polygon[(edgeId + 1) % polygon.length],
        polygon[edgeId]
      ))
      const edgeNormal = { x: -origEdgeDir.y, y: origEdgeDir.x }

      const originalStart = polygon[edgeId]
      const C_0  = dot(edgeNormal, originalStart)
      const tc   = node.creationTime
      const virtStart = {
        x: node.point.x - tc * node.bisector!.x,
        y: node.point.y - tc * node.bisector!.y
      }

      const NB    = dot(edgeNormal, node.bisector!)
      const numer = C_0 - dot(edgeNormal, virtStart)
      const denom = NB - 1

      if (Math.abs(denom) > 1e-6) {
        const absTime = numer / denom
        if (absTime > currentTime + 1e-5 && absTime < bestT) {
          const dt = absTime - currentTime
          const intersectPt: Vec2 = {
            x: node.point.x + dt * node.bisector!.x,
            y: node.point.y + dt * node.bisector!.y
          }
          if (curr.bisector && curr.next.bisector) {
            const sT = { x: curr.point.x + dt * curr.bisector.x,           y: curr.point.y + dt * curr.bisector.y }
            const eT = { x: curr.next.point.x + dt * curr.next.bisector.x, y: curr.next.point.y + dt * curr.next.bisector.y }
            if (isBetween(intersectPt, sT, eT)) {
              bestT = absTime; bestPt = intersectPt; bestEdgeNode = curr
            }
          }
        }
      }
      curr = curr.next
    }

    if (bestEdgeNode && bestPt) {
      console.log(`  SPLIT: Node ${node.id} on Edge ${bestEdgeNode.id} T=${bestT.toFixed(5)}`)
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

  const ptKey = (p: Vec2) => `${p.x.toFixed(5)},${p.y.toFixed(5)}`
  const dirAdj = new Map<string, Vec2[]>()
  const addDirected = (from: Vec2, to: Vec2) => {
    const k = ptKey(from)
    if (!dirAdj.has(k)) dirAdj.set(k, [])
    const list = dirAdj.get(k)!
    if (!list.some(v => distSq(v, to) < 1e-8)) list.push(to)
  }

  for (const arc of faceArcs) {
    if (arc.leftFace === edgeIdx)  addDirected(arc.start, arc.end)
    else                           addDirected(arc.end,   arc.start)
  }

  const path: Vec2[] = [originalEnd]
  const visited = new Set<string>()
  visited.add(ptKey(originalEnd))
  const targetKey = ptKey(originalStart)
  let curr = originalEnd

  for (let safe = 0; safe < 1000; safe++) {
    const key = ptKey(curr)
    if (key === targetKey) break
    const neighbors = dirAdj.get(key)
    if (!neighbors || neighbors.length === 0) break
    const next = neighbors.find(nb => !visited.has(ptKey(nb))) ?? neighbors[0]
    const nKey = ptKey(next)
    if (visited.has(nKey) && nKey !== targetKey) break
    visited.add(nKey); path.push(next); curr = next
    if (nKey === targetKey) break
  }

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