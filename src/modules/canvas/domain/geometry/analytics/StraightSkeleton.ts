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
  isValley?: boolean
}

export interface SkeletonResult {
  faces: SkeletonFace[]
  arcs: SkeletonArc[]
}

// ─────────────────────────────────────────────────────────
// Internal: a panel is a sub-polygon of the building footprint
// produced by cutting along valley lines.
//
// edgeIds[i] = original polygon edge index for side i→(i+1)%m
//            = -1 for valley sides (shared internal cut, not a wall)
// ─────────────────────────────────────────────────────────
interface Panel {
  vertices: Vec2[]
  edgeIds: number[]
}

// ─────────────────────────────────────────────────────────
// A cut line between two reflex vertices (or reflex→edge point)
// The cut becomes a valley arc in the output.
// ─────────────────────────────────────────────────────────
interface CutLine {
  a: Vec2
  b: Vec2
  leftEdgeId: number   // original edge index left of this cut
  rightEdgeId: number  // original edge index right of this cut
}

// ═══════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════

export function computeStraightSkeleton(polygon: Vec2[]): SkeletonResult {
  if (polygon.length < 3) return { faces: [], arcs: [] }

  let poly = [...polygon]
  if (signedArea(poly) < 0) poly.reverse()

  // ── Step 1: Decompose into panels via reflex-vertex cuts ──────────────────
  const { panels, cuts } = decomposePolygon(poly)

  const outputArcs: SkeletonArc[] = []

  // Valley arcs from cuts
  for (const cut of cuts) {
    outputArcs.push({
      start: cut.a,
      end: cut.b,
      leftFace: cut.leftEdgeId,
      rightFace: cut.rightEdgeId,
      isValley: true
    })
  }

  // ── Step 2: Hip roof skeleton on each panel ───────────────────────────────
  for (const panel of panels) {
    const arcs = panelSkeleton(panel)
    outputArcs.push(...arcs)
  }

  // ── Step 3: Build output ──────────────────────────────────────────────────
  unifyVertices(outputArcs)

  const n = poly.length
  const faces: SkeletonFace[] = []
  for (let i = 0; i < n; i++) {
    const arcs = outputArcs.filter(a => a.leftFace === i || a.rightFace === i)
    if (arcs.length === 0) continue
    const loop = buildFacePolygon(i, poly[i], poly[(i + 1) % n], arcs)
    if (loop.length >= 3) faces.push({ edgeIndex: i, polygon: loop })
  }

  return { faces, arcs: outputArcs }
}

// ═══════════════════════════════════════════════════
// decomposePolygon
//
// Finds all reflex vertices and cuts the polygon along
// visibility-connected reflex-vertex pairs.
//
// CUT SELECTION RULE:
//   A valid cut between two reflex vertices R1 and R2 must be
//   "axis-aligned" relative to the polygon edges — i.e., the
//   direction R1→R2 must be parallel to at least one polygon edge.
//   This prevents diagonal cuts that would create wrong roof shapes.
//
//   For general non-rectilinear buildings, we extend this: the cut must
//   be perpendicular to the inward bisector direction of one of the two
//   reflex vertices. (For 270° corners, bisector = 45° diagonal, so the
//   perpendicular cut = axis-aligned. This generalises correctly.)
//
//   We also allow cuts from a reflex vertex to the nearest point on an
//   opposite edge when no reflex-to-reflex cut is possible.
// ═══════════════════════════════════════════════════

function decomposePolygon(poly: Vec2[]): { panels: Panel[]; cuts: CutLine[] } {
  const n = poly.length

  // Find reflex vertices
  interface ReflexVtx {
    idx: number
    pt: Vec2
    bisDir: Vec2
    leftEdgeId: number
    rightEdgeId: number
  }

  const reflexVerts: ReflexVtx[] = []
  for (let i = 0; i < n; i++) {
    const prev = (i - 1 + n) % n
    const inDir  = normalize(sub(poly[i],             poly[prev]))
    const outDir = normalize(sub(poly[(i + 1) % n],   poly[i]))
    if (cross(inDir, outDir) < -1e-5) {
      reflexVerts.push({
        idx: i, pt: poly[i],
        bisDir: bisectorVelocity(inDir, outDir),
        leftEdgeId: prev, rightEdgeId: i
      })
    }
  }

  if (reflexVerts.length === 0) {
    return {
      panels: [{ vertices: poly, edgeIds: poly.map((_, i) => i) }],
      cuts: []
    }
  }

  // ── Find valid cuts between reflex vertex pairs ──────────────────────────
  const cuts: CutLine[] = []
  const usedPairs = new Set<string>()

  // Helper: given cut direction, which edge face is to the left/right?
  // For a horizontal cut: left = the face that owned the edge above, etc.
  // We approximate by looking at the polygon edge closest and parallel.
  function findCutFaces(ra: ReflexVtx, rb: ReflexVtx): { left: number; right: number } {
    // The cut goes from ra to rb.
    // The face to the left of ra's outgoing valley = ra.rightEdgeId
    // The face to the left of rb's outgoing valley = rb.rightEdgeId
    // For horizontal cuts (same y), the edge above has smaller index.
    // Use the reflex vertex bisector sides:
    return { left: ra.leftEdgeId, right: rb.leftEdgeId }
  }

  for (let i = 0; i < reflexVerts.length; i++) {
    for (let j = i + 1; j < reflexVerts.length; j++) {
      const pairKey = `${Math.min(i, j)}-${Math.max(i, j)}`
      if (usedPairs.has(pairKey)) continue

      const ra = reflexVerts[i], rb = reflexVerts[j]
      const cutDir = normalize(sub(rb.pt, ra.pt))

      // ── Axis-alignment check ──────────────────────────────────────────────
      // Valid cuts are parallel to some polygon edge (or perpendicular to
      // the bisector of one of the reflex vertices).
      // For rectilinear buildings: only horizontal (dy≈0) or vertical (dx≈0).
      // For general buildings: also allow cuts along polygon edge directions.
      let isValid = false

      // Check if cut direction is parallel to any polygon edge
      for (let ei = 0; ei < n; ei++) {
        const edgeDir = normalize(sub(poly[(ei + 1) % n], poly[ei]))
        const c = Math.abs(cross(cutDir, edgeDir))
        if (c < 0.01) { isValid = true; break }  // parallel within ~0.6°
      }

      if (!isValid) continue

      // ── Visibility check: no polygon edge blocks the cut ──────────────────
      if (!segmentInsidePolygon(ra.pt, rb.pt, poly)) continue

      usedPairs.add(pairKey)
      const faces = findCutFaces(ra, rb)
      cuts.push({ a: ra.pt, b: rb.pt, leftEdgeId: faces.left, rightEdgeId: faces.right })
    }
  }

  // ── Reflex-to-edge cuts (for isolated reflex vertices) ───────────────────
  // Any reflex vertex not yet connected to another reflex vertex by a cut
  // needs a cut to the nearest opposite polygon edge.
  const connectedReflex = new Set<number>()
  cuts.forEach(c => {
    // find which reflex vertices are endpoints of this cut
    reflexVerts.forEach((r, i) => {
      if (distSq(r.pt, c.a) < 1e-4 || distSq(r.pt, c.b) < 1e-4) connectedReflex.add(i)
    })
  })

  for (let ri = 0; ri < reflexVerts.length; ri++) {
    if (connectedReflex.has(ri)) continue
    const R = reflexVerts[ri]

    // Cast the valley ray from this reflex vertex to the nearest polygon edge
    let bestT = Infinity, bestPt: Vec2 | null = null
    let bestEdgeId = -1

    for (let ei = 0; ei < n; ei++) {
      if (ei === R.leftEdgeId || ei === R.rightEdgeId) continue
      if (ei === (R.leftEdgeId - 1 + n) % n) continue
      if (ei === (R.rightEdgeId + 1) % n) continue
      const t = raySegmentT(R.pt, R.bisDir, poly[ei], poly[(ei + 1) % n])
      if (t !== null && t > 1e-4 && t < bestT) {
        bestT = t
        bestPt = addScaled(R.pt, R.bisDir, t)
        bestEdgeId = ei
      }
    }

    if (bestPt && bestEdgeId >= 0) {
      cuts.push({ a: R.pt, b: bestPt, leftEdgeId: R.leftEdgeId, rightEdgeId: R.rightEdgeId })
    }
  }

  // ── Cut the polygon into panels ───────────────────────────────────────────
  const panels = slicePolygonByCuts(poly, cuts)

  return { panels, cuts }
}

// ═══════════════════════════════════════════════════
// slicePolygonByCuts
//
// Given a polygon and a set of interior cut segments,
// iteratively cut the polygon into sub-polygons.
// Each cut produces two sub-polygons; we recurse on each.
// Returns all leaf sub-polygons as Panels.
// ═══════════════════════════════════════════════════

function slicePolygonByCuts(poly: Vec2[], cuts: CutLine[]): Panel[] {
  if (cuts.length === 0) {
    return [{ vertices: poly, edgeIds: poly.map((_, i) => i) }]
  }

  // Build the planar graph and extract faces
  // This is simpler than recursive slicing for arbitrary cut configurations

  // ── All vertices: polygon + cut endpoints ────────────────────────────────
  const verts: Vec2[] = [...poly]
  const vKey = (p: Vec2) => `${Math.round(p.x * 1e5)},${Math.round(p.y * 1e5)}`
  const vIdx = new Map<string, number>()
  poly.forEach((v, i) => vIdx.set(vKey(v), i))

  function getIdx(p: Vec2): number {
    const k = vKey(p)
    if (vIdx.has(k)) return vIdx.get(k)!
    const i = verts.length; verts.push(p); vIdx.set(k, i); return i
  }

  // ── Build adjacency list (directed, sorted by angle) ─────────────────────
  // adj[from] = [{ to, faceId }]
  interface AdjEntry { to: number; faceId: number }
  const adj: AdjEntry[][] = Array.from({ length: poly.length }, () => [])

  function ensureAdj(i: number) { while (adj.length <= i) adj.push([]) }

  function addHalfEdge(from: number, to: number, faceId: number) {
    ensureAdj(from); ensureAdj(to)
    if (!adj[from].some(e => e.to === to)) adj[from].push({ to, faceId })
    if (!adj[to].some(e => e.to === from)) adj[to].push({ to: from, faceId })
  }

  // Insert polygon edges (handling cut endpoints that land on edges)
  const n = poly.length
  for (let ei = 0; ei < n; ei++) {
    const a = ei, b = (ei + 1) % n

    // Find any cut endpoints on this edge
    const mids: { t: number; vi: number }[] = []
    for (const cut of cuts) {
      for (const pt of [cut.a, cut.b]) {
        const ptIdx = getIdx(pt)
        if (ptIdx < poly.length) continue  // skip polygon vertices (already endpoints)
        if (isBetweenStrict(pt, poly[a], poly[b])) {
          const t = dot(sub(pt, poly[a]), sub(poly[b], poly[a])) / distSq(poly[a], poly[b])
          mids.push({ t, vi: ptIdx })
        }
      }
    }
    mids.sort((x, y) => x.t - y.t)

    const chain = [a, ...mids.map(m => m.vi), b]
    for (let k = 0; k < chain.length - 1; k++) {
      addHalfEdge(chain[k], chain[k + 1], ei)
    }
  }

  // Insert cut edges
  for (const cut of cuts) {
    const ai = getIdx(cut.a), bi = getIdx(cut.b)
    addHalfEdge(ai, bi, -1)
  }

  // Sort adjacency lists by angle at each vertex
  for (let vi = 0; vi < verts.length; vi++) {
    if (!adj[vi]) continue
    adj[vi].sort((a, b) => {
      const angleA = Math.atan2(verts[a.to].y - verts[vi].y, verts[a.to].x - verts[vi].x)
      const angleB = Math.atan2(verts[b.to].y - verts[vi].y, verts[b.to].x - verts[vi].x)
      return angleA - angleB
    })
  }

  // ── Extract faces by "next CCW half-edge" traversal ───────────────────────
  // Given directed half-edge from→to, the next half-edge in the same face is
  // found by: at vertex `to`, find the twin (to→from), then take the PREV
  // outgoing edge (one step clockwise = counter-clockwise in the face).

  const visitedHE = new Set<string>()
  const heKey = (f: number, t: number) => `${f}→${t}`
  const panels: Panel[] = []

  for (let startV = 0; startV < verts.length; startV++) {
    if (!adj[startV]) continue
    for (const startE of adj[startV]) {
      const hk = heKey(startV, startE.to)
      if (visitedHE.has(hk)) continue

      const faceVerts: number[] = []
      const faceEdgeIds: number[] = []

      let curFrom = startV, curTo = startE.to
      let safe = 0

      while (safe++ < 200) {
        const k = heKey(curFrom, curTo)
        if (visitedHE.has(k)) break
        visitedHE.add(k)

        faceVerts.push(curFrom)

        // Find outgoing edge from curTo (the one AFTER the twin curTo→curFrom in CCW order)
        const atVert = curTo
        const outEdges = adj[atVert] ?? []
        // Find index of the edge going back to curFrom
        const backIdx = outEdges.findIndex(e => e.to === curFrom)
        if (backIdx === -1) break

        // Get faceId of current half-edge: from outEdges[backIdx]? No — 
        // the faceId of curFrom→curTo is in adj[curFrom]'s entry for curTo
        const curEntry = (adj[curFrom] ?? []).find(e => e.to === curTo)
        faceEdgeIds.push(curEntry?.faceId ?? -1)

        // Next CCW outgoing from atVert = one before backIdx (wrapping)
        const nextIdx = (backIdx - 1 + outEdges.length) % outEdges.length
        const nextEdge = outEdges[nextIdx]

        const nextFrom = atVert, nextTo = nextEdge.to
        if (nextFrom === startV && nextTo === startE.to && faceVerts.length >= 2) {
          // Completed the face
          break
        }
        curFrom = nextFrom; curTo = nextTo
      }

      if (faceVerts.length < 3) continue
      const pts = faceVerts.map(i => verts[i])
      const area = signedArea(pts)
      if (area < 1e-2) continue  // skip degenerate or exterior (CW) faces

      panels.push({ vertices: pts, edgeIds: faceEdgeIds })
    }
  }

  if (panels.length === 0) {
    return [{ vertices: poly, edgeIds: poly.map((_, i) => i) }]
  }

  return panels
}

// ═══════════════════════════════════════════════════
// panelSkeleton
//
// Computes the straight skeleton (hip roof lines) of a single
// convex or simply-connected panel. Only edge events — no splits.
//
// For valley sides (edgeIds[i] === -1), these are treated as
// "open" boundaries. The bisector at valley-junction vertices
// is computed as if the valley edge is TRANSPARENT — the vertex
// moves along the bisector of only the real wall edges.
// ═══════════════════════════════════════════════════

function panelSkeleton(panel: Panel): SkeletonArc[] {
  const pts = [...panel.vertices]
  const eIds = [...panel.edgeIds]
  const m = pts.length
  if (m < 3) return []

  if (signedArea(pts) < 0) { pts.reverse(); eIds.reverse() }

  interface PNode {
    id: number
    pt: Vec2
    bis: Vec2
    leftFace: number   // edge to the left (incoming edge)
    rightFace: number  // edge to the right (outgoing edge)
    prev: number
    next: number
    active: boolean
    time: number
  }

  const nodes: PNode[] = []

  for (let i = 0; i < m; i++) {
    const prevI = (i - 1 + m) % m
    const nextI = (i + 1) % m

    // ── Bisector computation with valley-edge transparency ────────────────
    // For a vertex where the incoming side is a valley (faceId=-1),
    // we look further back along the chain to find the real incoming direction.
    // Similarly for outgoing valley sides.

    const inDir  = normalize(sub(pts[i],     pts[prevI]))
    const outDir = normalize(sub(pts[nextI], pts[i]))

    // Check if incoming or outgoing sides are valley edges
    const incomingIsValley  = eIds[prevI] < 0
    const outgoingIsValley  = eIds[i]     < 0

    let bis: Vec2
    if (!incomingIsValley && !outgoingIsValley) {
      // Normal vertex — standard bisector
      bis = bisectorVelocity(inDir, outDir)
    } else if (incomingIsValley && !outgoingIsValley) {
      // Valley incoming: treat as if the wall extends straight inward
      // → use outgoing direction as both → bisector = left normal of outgoing
      const n2 = { x: -outDir.y, y: outDir.x }
      bis = n2
    } else if (!incomingIsValley && outgoingIsValley) {
      // Valley outgoing: treat as if wall extends straight from incoming
      // → bisector = left normal of incoming
      const n1 = { x: -inDir.y, y: inDir.x }
      bis = n1
    } else {
      // Both are valley edges — interior valley-valley vertex
      // Use symmetric bisector: average of the two normals
      const n1 = { x: -inDir.y, y: inDir.x }
      const n2 = { x: -outDir.y, y: outDir.x }
      bis = normalize({ x: n1.x + n2.x, y: n1.y + n2.y })
      // This vertex is deep interior — scale to unit inward speed
      const len = Math.hypot(bis.x, bis.y)
      if (len > 1e-10) { bis = { x: bis.x / len, y: bis.y / len } }
    }

    nodes.push({
      id: i, pt: pts[i], bis,
      leftFace:  eIds[prevI],
      rightFace: eIds[i],
      prev: prevI, next: nextI,
      active: true, time: 0
    })
  }

  const outputArcs: SkeletonArc[] = []

  // Edge event scheduling
  interface EEvt { t: number; pt: Vec2; ni: number }
  const queue: EEvt[] = []

  function scheduleEdge(ni: number) {
    const A = nodes[ni]; if (!A.active) return
    const B = nodes[A.next]; if (!B.active) return

    const o1 = { x: A.pt.x - A.time * A.bis.x, y: A.pt.y - A.time * A.bis.y }
    const o2 = { x: B.pt.x - B.time * B.bis.x, y: B.pt.y - B.time * B.bis.y }

    const res = rayRayIntersectTime(o1, A.bis, o2, B.bis)
    if (res && res.t > Math.max(A.time, B.time) + 1e-6) {
      queue.push({ t: res.t, pt: res.point, ni })
    }
  }

  for (let i = 0; i < m; i++) scheduleEdge(i)

  let loopSafe = 0, currentT = 0

  while (queue.length > 0 && loopSafe++ < m * 20) {
    queue.sort((a, b) => b.t - a.t)
    const evt = queue.pop()!

    if (evt.t < currentT - 1e-6) continue
    currentT = evt.t

    const A = nodes[evt.ni]; if (!A.active) continue
    const B = nodes[A.next]; if (!B.active) continue

    // Validate event is still current
    const o1 = { x: A.pt.x - A.time * A.bis.x, y: A.pt.y - A.time * A.bis.y }
    const o2 = { x: B.pt.x - B.time * B.bis.x, y: B.pt.y - B.time * B.bis.y }
    const check = rayRayIntersectTime(o1, A.bis, o2, B.bis)
    if (!check || Math.abs(check.t - evt.t) > 1e-3) continue

    // Emit arcs for real-wall sides only
    if (A.leftFace >= 0)  outputArcs.push({ start: A.pt, end: evt.pt, leftFace: A.leftFace,  rightFace: A.rightFace })
    if (B.leftFace >= 0)  outputArcs.push({ start: B.pt, end: evt.pt, leftFace: B.leftFace,  rightFace: B.rightFace })

    const prevI = A.prev, nextI = B.next

    if (prevI === nextI) {
      // Triangle collapse
      const C = nodes[prevI]
      if (C.leftFace >= 0) outputArcs.push({ start: C.pt, end: evt.pt, leftFace: C.leftFace, rightFace: C.rightFace })
      A.active = false; B.active = false; C.active = false
      continue
    }

    A.active = false; B.active = false

    // Merged node
    const prevNode = nodes[prevI], nextNode = nodes[nextI]

    // Recompute direction from prev→merge and merge→next at current positions
    const dtP = evt.t - prevNode.time
    const dtN = evt.t - nextNode.time
    const prevPos = { x: prevNode.pt.x + dtP * prevNode.bis.x, y: prevNode.pt.y + dtP * prevNode.bis.y }
    const nextPos = { x: nextNode.pt.x + dtN * nextNode.bis.x, y: nextNode.pt.y + dtN * nextNode.bis.y }
    const inDir2  = normalize(sub(evt.pt, prevPos))
    const outDir2 = normalize(sub(nextPos, evt.pt))

    const newLeftFace  = A.leftFace
    const newRightFace = B.rightFace
    const incomingV    = newLeftFace  < 0
    const outgoingV    = newRightFace < 0

    let newBis: Vec2
    if (!incomingV && !outgoingV) {
      newBis = bisectorVelocity(inDir2, outDir2)
    } else if (incomingV && !outgoingV) {
      newBis = { x: -outDir2.y, y: outDir2.x }
    } else if (!incomingV && outgoingV) {
      newBis = { x: -inDir2.y, y: inDir2.x }
    } else {
      newBis = normalize({ x: -inDir2.y + -outDir2.y, y: inDir2.x + outDir2.x })
    }

    const newId = nodes.length
    nodes.push({
      id: newId, pt: evt.pt, bis: newBis,
      leftFace: newLeftFace, rightFace: newRightFace,
      prev: prevI, next: nextI,
      active: true, time: evt.t
    })
    prevNode.next = newId
    nextNode.prev = newId

    scheduleEdge(prevI)
    scheduleEdge(newId)
  }

  return outputArcs
}

// ═══════════════════════════════════════════════════
// bisectorVelocity
// Given unit incoming and outgoing edge directions for a CCW polygon,
// computes velocity B where n_in · B = 1 and n_out · B = 1.
// ═══════════════════════════════════════════════════
function bisectorVelocity(inDir: Vec2, outDir: Vec2): Vec2 {
  const n1 = { x: -inDir.y,  y: inDir.x  }
  const n2 = { x: -outDir.y, y: outDir.x }
  const det = n1.x * n2.y - n1.y * n2.x

  let bx: number, by: number
  if (Math.abs(det) < 1e-7) {
    if (dot(inDir, outDir) < -0.9999) { bx = -inDir.x; by = -inDir.y }
    else { bx = n1.x; by = n1.y }
  } else {
    bx = (n2.y - n1.y) / det
    by = (n1.x - n2.x) / det
    if (Math.abs(Math.abs(bx) - 1.0) < 5e-3) bx = Math.sign(bx)
    if (Math.abs(Math.abs(by) - 1.0) < 5e-3) by = Math.sign(by)
  }
  return { x: bx, y: by }
}

// ═══════════════════════════════════════════════════
// buildFacePolygon
// ═══════════════════════════════════════════════════
function buildFacePolygon(
  edgeIdx: number,
  originalStart: Vec2,
  originalEnd: Vec2,
  arcs: SkeletonArc[]
): Vec2[] {
  const faceArcs = arcs.filter(a => a.leftFace === edgeIdx || a.rightFace === edgeIdx)
  if (faceArcs.length === 0) return [originalStart, originalEnd]

  const ptKey = (p: Vec2) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`
  const dirAdj = new Map<string, Vec2[]>()
  const add = (f: Vec2, t: Vec2) => {
    const k = ptKey(f)
    if (!dirAdj.has(k)) dirAdj.set(k, [])
    const l = dirAdj.get(k)!
    if (!l.some(v => distSq(v, t) < 1e-8)) l.push(t)
  }

  for (const arc of faceArcs) {
    if (arc.leftFace === edgeIdx) add(arc.start, arc.end)
    else                          add(arc.end, arc.start)
  }

  let curr = originalEnd
  if (!dirAdj.has(ptKey(curr))) {
    let minD = 1e-2
    for (const arc of faceArcs) {
      const c = arc.leftFace === edgeIdx ? arc.start : arc.end
      const d = distSq(c, curr)
      if (d < minD) { minD = d; curr = c }
    }
  }

  const path: Vec2[] = [curr]
  const vis = new Set<string>([ptKey(curr)])

  for (let s = 0; s < 1000; s++) {
    if (distSq(curr, originalStart) < 1e-4) break
    const nbrs = dirAdj.get(ptKey(curr))
    if (!nbrs?.length) break
    const next = nbrs.find(nb => !vis.has(ptKey(nb))) ?? nbrs[0]
    if (vis.has(ptKey(next))) { if (distSq(next, originalStart) < 1e-4) path.push(next); break }
    vis.add(ptKey(next)); path.push(next); curr = next
  }

  if (path.length && distSq(path[path.length - 1], originalStart) < 1e-3) {
    path[path.length - 1] = originalStart
  } else {
    path.push(originalStart)
  }

  const result: Vec2[] = [originalStart]
  path.forEach(p => { if (distSq(p, result[result.length - 1]) > 1e-8) result.push(p) })
  if (result.length > 1 && distSq(result[0], result[result.length - 1]) < 1e-8) result.pop()
  return result
}

// ═══════════════════════════════════════════════════
// Vertex Unification
// ═══════════════════════════════════════════════════
function unifyVertices(arcs: SkeletonArc[]) {
  const TOL_SQ = 1e-4
  const k = (v: Vec2) => `${v.x.toFixed(5)},${v.y.toFixed(5)}`
  const umap = new Map<string, Vec2>()
  const ref = (v: Vec2) => { const key = k(v); if (!umap.has(key)) umap.set(key, v); return umap.get(key)! }

  arcs.forEach(a => { a.start = ref(a.start); a.end = ref(a.end) })

  const list  = [...umap.values()].sort((a, b) => (a.x - b.x) || (a.y - b.y))
  const reps  = new Map<Vec2, Vec2>()
  const leaders: Vec2[] = []
  for (const v of list) {
    if (reps.has(v)) continue
    const l = leaders.find(l => distSq(l, v) < TOL_SQ)
    if (l) reps.set(v, l)
    else { leaders.push(v); reps.set(v, v) }
  }
  arcs.forEach(a => { a.start = reps.get(a.start) ?? a.start; a.end = reps.get(a.end) ?? a.end })
}

// ═══════════════════════════════════════════════════
// Geometry helpers
// ═══════════════════════════════════════════════════
function sub(a: Vec2, b: Vec2): Vec2          { return { x: a.x - b.x, y: a.y - b.y } }
function addScaled(o: Vec2, d: Vec2, t: number): Vec2 { return { x: o.x + t * d.x, y: o.y + t * d.y } }
function normalize(v: Vec2): Vec2 {
  const l = Math.hypot(v.x, v.y)
  return l > 1e-10 ? { x: v.x / l, y: v.y / l } : { x: 0, y: 0 }
}
function cross(a: Vec2, b: Vec2): number       { return a.x * b.y - a.y * b.x }
function dot(a: Vec2, b: Vec2): number         { return a.x * b.x + a.y * b.y }
function distSq(a: Vec2, b: Vec2): number      { return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }

function signedArea(pts: Vec2[]): number {
  let a = 0
  for (let i = 0; i < pts.length; i++) a += cross(pts[i], pts[(i + 1) % pts.length])
  return a / 2
}

function isBetweenStrict(p: Vec2, a: Vec2, b: Vec2): boolean {
  const ab = sub(b, a), ap = sub(p, a)
  const lenSq = dot(ab, ab)
  if (lenSq < 1e-10) return false
  const t = dot(ap, ab) / lenSq
  if (t < -1e-4 || t > 1 + 1e-4) return false
  const perpSq = cross(ap, ab) ** 2 / lenSq
  return perpSq < 4.0
}

/** Ray vs segment: returns t ≥ 0 or null */
function raySegmentT(o: Vec2, d: Vec2, a: Vec2, b: Vec2): number | null {
  const ab = sub(b, a)
  const det = d.x * ab.y - d.y * ab.x
  if (Math.abs(det) < 1e-8) return null
  const ao = sub(o, a)
  const t  =  (ao.x * ab.y - ao.y * ab.x) / det
  const u  = -(ao.x * d.y  - ao.y * d.x)  / det
  if (t < -1e-6 || u < -1e-6 || u > 1 + 1e-6) return null
  return t
}

function rayRayIntersectTime(o1: Vec2, d1: Vec2, o2: Vec2, d2: Vec2): { t: number; point: Vec2 } | null {
  const det = d1.x * d2.y - d1.y * d2.x
  if (Math.abs(det) < 1e-8) return null
  const dx = o2.x - o1.x, dy = o2.y - o1.y
  const t = (dx * d2.y - dy * d2.x) / det
  return { t, point: { x: o1.x + t * d1.x, y: o1.y + t * d1.y } }
}

/**
 * Returns true if the segment [a,b] lies entirely inside the polygon
 * (no polygon edge properly crosses [a,b], and midpoint is inside).
 */
function segmentInsidePolygon(a: Vec2, b: Vec2, poly: Vec2[]): boolean {
  const n = poly.length
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }

  for (let i = 0; i < n; i++) {
    const c = poly[i], d = poly[(i + 1) % n]
    // Check if polygon edge [c,d] properly crosses [a,b]
    const d1 = cross(sub(b, a), sub(c, a))
    const d2 = cross(sub(b, a), sub(d, a))
    const d3 = cross(sub(d, c), sub(a, c))
    const d4 = cross(sub(d, c), sub(b, c))
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return false  // polygon edge crosses the cut
    }
  }

  // Check midpoint is inside polygon
  let inside = false
  for (let i = 0; i < n; i++) {
    const c = poly[i], d = poly[(i + 1) % n]
    if (((c.y > mid.y) !== (d.y > mid.y)) &&
        (mid.x < (d.x - c.x) * (mid.y - c.y) / (d.y - c.y) + c.x)) {
      inside = !inside
    }
  }
  return inside
}