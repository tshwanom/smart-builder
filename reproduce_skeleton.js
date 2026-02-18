
// Mock standard Vec2 operations to avoid dependency
function subtract(a, b) { return { x: a.x - b.x, y: a.y - b.y } }
function normalize(v) {
  const len = Math.hypot(v.x, v.y)
  return len > 1e-10 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 }
}
function cross(a, b) { return a.x * b.y - a.y * b.x }
function dot(a, b) { return a.x * b.x + a.y * b.y }
function distSq(a, b) { return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }
function isBetween(p, a, b) {
  const ab = subtract(b, a), ap = subtract(p, a)
  const dotVal = dot(ap, ab), abLenSq = dot(ab, ab)
  return dotVal >= -1e-4 && dotVal <= abLenSq + 1e-4
}
function signedArea(pts) {
  let area = 0
  for (let i = 0; i < pts.length; i++) area += cross(pts[i], pts[(i + 1) % pts.length])
  return area / 2
}
function rayRayIntersectTime(o1, d1, o2, d2) {
  const det = d1.x * d2.y - d1.y * d2.x
  if (Math.abs(det) < 1e-8) return null
  const dx = o2.x - o1.x, dy = o2.y - o1.y
  const t  = (dx * d2.y - dy * d2.x) / det
  return { t, point: { x: o1.x + t * d1.x, y: o1.y + t * d1.y } }
}

// SSNode Class
class SSNode {
  constructor(point, id, leftEdgeId, rightEdgeId, time = 0) {
    this.point = point
    this.id = id
    this.leftEdgeId = leftEdgeId
    this.rightEdgeId = rightEdgeId
    this.creationTime = time
    this.isActive = true
    this.EdgeEvent = null
    this.SplitEvent = null
    this.isOriginal = false
    this.bisector = null
    this.prev = null
    this.next = null
  }
}

function bisectorFromEdges(leftEdgeId, rightEdgeId, polygon) {
  const n = polygon.length
  const inDir  = normalize(subtract(polygon[(leftEdgeId  + 1) % n], polygon[leftEdgeId]))
  const outDir = normalize(subtract(polygon[(rightEdgeId + 1) % n], polygon[rightEdgeId]))
  const n1 = { x: -inDir.y,  y: inDir.x  }
  const n2 = { x: -outDir.y, y: outDir.x }
  const det = n1.x * n2.y - n1.y * n2.x
  let bx, by
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

function checkAndCollapseDegenerate(node, outputArcs) {
  if (!node.isActive) return
  const loop = []
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
      if (dot(d1, d2) < -0.99) {
        if (distSq(u.point, v.point) > 1e-6) {
             fs.appendFileSync('debug.log', `ARC DEGENERATE: Node ${u.id} (${u.point.x.toFixed(2)},${u.point.y.toFixed(2)}) -> Node ${v.id} (${v.point.x.toFixed(2)},${v.point.y.toFixed(2)})\n`);
             outputArcs.push({ start: u.point, end: v.point, leftFace: u.leftEdgeId, rightFace: u.rightEdgeId })
        }
        v.isActive = false; u.next = w; w.prev = u
        loop.splice(i, 1); changed = true; i--
      }
    }
  } while (changed && loop.length >= 3)
}

function computeNodeEvents(node, queue, polygon, currentTime) {
  // Edge Event
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
      const evt = { type: 'EDGE', time: iRes.t, point: iRes.point, v: node }
      node.EdgeEvent = evt
      queue.push(evt)
    }
  }

  // Split Event
  // FIX 4: "only original polygon vertices can be reflex"
  if (!node.isOriginal || !node.bisector) return

  const inDir  = normalize(subtract(polygon[(node.leftEdgeId  + 1) % polygon.length], polygon[node.leftEdgeId]))
  const outDir = normalize(subtract(polygon[(node.rightEdgeId + 1) % polygon.length], polygon[node.rightEdgeId]))
  const isReflex = cross(inDir, outDir) < -1e-5

  if (isReflex) {
    if (node.SplitEvent) { node.SplitEvent.time = -1; node.SplitEvent = null }
    let bestT = Infinity, bestPt = null, bestEdgeNode = null
    let curr = node.next.next
    let safe = 0
    while (curr !== node.prev && safe++ < 2000) {
      if (curr === node) break
      if (!curr.isActive || !curr.next.isActive) { curr = curr.next; continue }

      const edgeId = curr.rightEdgeId
      const origEdgeDir = normalize(subtract(polygon[(edgeId + 1) % polygon.length], polygon[edgeId]))
      const edgeNormal  = { x: -origEdgeDir.y, y: origEdgeDir.x }
      const C_0         = dot(edgeNormal, polygon[edgeId])
      const tc          = node.creationTime
      const virtStart   = { x: node.point.x - tc * node.bisector.x, y: node.point.y - tc * node.bisector.y }
      const NB    = dot(edgeNormal, node.bisector)
      const numer = C_0 - dot(edgeNormal, virtStart)
      const denom = NB - 1

      if (Math.abs(denom) > 1e-6) {
        const absTime = numer / denom
        if (absTime > currentTime + 1e-5 && absTime < bestT) {
           const intersectPt = {
            x: node.point.x + (absTime - node.creationTime) * node.bisector.x,
            y: node.point.y + (absTime - node.creationTime) * node.bisector.y
          }
           if (curr.bisector && curr.next.bisector) {
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
      const evt = { type: 'SPLIT', time: bestT, point: bestPt, v: node, oppositeEdge: bestEdgeNode }
      node.SplitEvent = evt
      queue.push(evt)
    }
  }
}

function computeStraightSkeleton(polygon) {
  const n = polygon.length
  let poly = [...polygon]
  if (signedArea(poly) < 0) poly = poly.slice().reverse()
  const nodes = []
  for (let i = 0; i < n; i++) {
    const node = new SSNode(poly[i], i, (i - 1 + n) % n, i)
    node.isOriginal = true
    nodes.push(node)
    if (i > 0) { nodes[i - 1].next = node; node.prev = nodes[i - 1] }
  }
  nodes[n - 1].next = nodes[0]; nodes[0].prev = nodes[n - 1]
  const outputArcs = []
  const eventQueue = []
  nodes.forEach(node => { node.bisector = bisectorFromEdges(node.leftEdgeId, node.rightEdgeId, poly) })
  nodes.forEach(node => computeNodeEvents(node, eventQueue, poly, 0))

  let loopSafe = 0
  let currentTime = 0
  while (eventQueue.length > 0 && loopSafe++ < 2000) {
    eventQueue.sort((a, b) => {
      const diff = b.time - a.time
      if (Math.abs(diff) < 1e-6) return (a.type === 'EDGE' && b.type === 'SPLIT') ? -1 : ((a.type === 'SPLIT' && b.type === 'EDGE') ? 1 : 0)
      return diff
    })
    const evt = eventQueue.pop()
    if (evt.time < 0) continue
    if (evt.time < currentTime) { if (evt.time < currentTime - 1e-3) continue; evt.time = currentTime }
    if (evt.time > currentTime) currentTime = evt.time

    //console.log(`Event: ${evt.type} at ${evt.time.toFixed(2)}`)

    if (evt.type === 'EDGE') {
        const v = evt.v
        const next = v.next
        if (!v.isActive || !next.isActive) continue
        
        // Debug Log
        fs.appendFileSync('debug.log', `Processing EDGE: Node ${v.id} -> Node ${next.id} at t=${evt.time.toFixed(2)} pt=${evt.point.x.toFixed(2)},${evt.point.y.toFixed(2)}\n`);

        if (v.EdgeEvent !== evt) {
            const cur = v.EdgeEvent
            if (!cur || cur.type !== 'EDGE' || Math.abs(cur.time - evt.time) > 1e-6) continue
        }
        
        fs.appendFileSync('debug.log', `ARC EDGE: Node ${v.id} (${v.point.x},${v.point.y}) -> (${evt.point.x},${evt.point.y})\n`);
        outputArcs.push({ start: v.point,    end: evt.point, leftFace: v.leftEdgeId,    rightFace: v.rightEdgeId    })
        outputArcs.push({ start: next.point, end: evt.point, leftFace: next.leftEdgeId, rightFace: next.rightEdgeId })
        
        const prevNode = v.prev
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
        const v = evt.v
        const opp = evt.oppositeEdge
        if (!v.isActive) continue
        if (opp && !opp.isActive) {
            if (v.SplitEvent === evt) v.SplitEvent = null
        if (v.SplitEvent === evt) v.SplitEvent = null
            computeNodeEvents(v, eventQueue, poly, evt.time)
            continue
        }
        
        fs.appendFileSync('debug.log', `ARC SPLIT: Node ${v.id} -> (${evt.point.x.toFixed(2)},${evt.point.y.toFixed(2)})\n`);
        outputArcs.push({ start: v.point, end: evt.point, leftFace: v.leftEdgeId, rightFace: v.rightEdgeId })
        v.isActive = false
        
        const pt = evt.point
        const oppNext = opp.next
        const distEnd = Math.sqrt(distSq(pt, oppNext.point))
        
        let nodeA = null
        if (distEnd > 1e-3) {
            nodeA = new SSNode(pt, opp.id, v.leftEdgeId, opp.rightEdgeId, evt.time)
            nodeA.bisector = bisectorFromEdges(nodeA.leftEdgeId, nodeA.rightEdgeId, poly)
            const vPrev = v.prev
            vPrev.next = nodeA; nodeA.prev = vPrev
            nodeA.next = oppNext; oppNext.prev = nodeA
            computeNodeEvents(vPrev, eventQueue, poly, evt.time)
            computeNodeEvents(nodeA, eventQueue, poly, evt.time)
            computeNodeEvents(oppNext, eventQueue, poly, evt.time)
        } else {
             // Collapse near end
             const vPrev = v.prev
             vPrev.next = oppNext; oppNext.prev = vPrev
             computeNodeEvents(vPrev, eventQueue, poly, evt.time)
             computeNodeEvents(oppNext, eventQueue, poly, evt.time)
        }
        
        let nodeB = null
        const distStart = Math.sqrt(distSq(pt, opp.point))
        if (distStart > 1e-3) {
             nodeB = new SSNode(pt, v.id, opp.leftEdgeId, v.rightEdgeId, evt.time)
             nodeB.bisector = bisectorFromEdges(nodeB.leftEdgeId, nodeB.rightEdgeId, poly)
             const vNext = v.next
             opp.next = nodeB; nodeB.prev = opp
             nodeB.next = vNext; vNext.prev = nodeB
             computeNodeEvents(opp, eventQueue, poly, evt.time)
             computeNodeEvents(nodeB, eventQueue, poly, evt.time)
             computeNodeEvents(vNext, eventQueue, poly, evt.time)
        } else {
             nodeB = new SSNode(pt, v.id, opp.leftEdgeId, v.rightEdgeId, evt.time)
             nodeB.bisector = bisectorFromEdges(nodeB.leftEdgeId, nodeB.rightEdgeId, poly)
             const oppPrev = opp.prev
             const vNext = v.next
             oppPrev.next = nodeB; nodeB.prev = oppPrev
             nodeB.next = vNext; vNext.prev = nodeB
             opp.isActive = false
             computeNodeEvents(oppPrev, eventQueue, poly, evt.time)
             computeNodeEvents(nodeB, eventQueue, poly, evt.time)
             computeNodeEvents(vNext, eventQueue, poly, evt.time)
        }
        if (nodeA && nodeA.isActive) checkAndCollapseDegenerate(nodeA, outputArcs)
        if (nodeB && nodeB.isActive) checkAndCollapseDegenerate(nodeB, outputArcs)
    }
  }
  return { arcs: outputArcs, polygon: null } // Simplified return
}

// TEST CASE: L-Shape
const lShape = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 5, y: 10 },
  { x: 5, y: 5 }, // Reflex vertex (index 4)
  { x: 0, y: 5 }
];


const fs = require('fs');

console.log("Running Straight Skeleton on L-Shape...");
const result = computeStraightSkeleton(lShape);
const outputData = {
    arcCount: result.arcs.length,
    arcs: result.arcs.map(a => ({
        start: { x: a.start.x, y: a.start.y },
        end: { x: a.end.x, y: a.end.y },
        leftFace: a.leftFace,
        rightFace: a.rightFace
    }))
};

fs.writeFileSync('results.json', JSON.stringify(outputData, null, 2));
console.log("Written results to results.json");

