
// Mock logic in JS
// ---------------------------------------------------------
//  ALGORITHM CORE (Pasted from source Phase 1-4 + Filters)
// ---------------------------------------------------------

function detectRooms(walls) {
  const EPSILON = 0.001
  const SNAP_DIST = 0.2
  
  // PHASE 1: Topology Clustering
  const sites = []
  
  walls.forEach((w, i) => {
      const start = w.points[0]
      const end = w.points[w.points.length - 1]
      sites.push({ x: start.x, y: start.y, segIdx: i, isStart: true })
      sites.push({ x: end.x, y: end.y, segIdx: i, isStart: false })
  })

  const parent = new Array(sites.length).fill(0).map((_, i) => i)
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const union = (i, j) => {
      const rootI = find(i)
      const rootJ = find(j)
      if (rootI !== rootJ) parent[rootI] = rootJ
  }

  for (let i = 0; i < sites.length; i++) {
      for (let j = i + 1; j < sites.length; j++) {
          const dx = sites[i].x - sites[j].x
          const dy = sites[i].y - sites[j].y
          if (dx * dx + dy * dy < SNAP_DIST * SNAP_DIST) {
              union(i, j)
          }
      }
  }

  const groups = new Map()
  for (let i = 0; i < sites.length; i++) {
      const root = find(i)
      if (!groups.has(root)) groups.set(root, { x: 0, y: 0, count: 0 })
      const g = groups.get(root)
      g.x += sites[i].x
      g.y += sites[i].y
      g.count++
  }

  const centroids = new Map()
  groups.forEach((g, root) => {
      centroids.set(root, { x: g.x / g.count, y: g.y / g.count })
  })

  let graphSegments = walls.map((w, i) => {
      const startSiteIdx = i * 2
      const endSiteIdx = i * 2 + 1
      return {
          originalId: w.id,
          u: find(startSiteIdx),
          v: find(endSiteIdx),
          p1: { ...centroids.get(find(startSiteIdx)) },
          p2: { ...centroids.get(find(endSiteIdx)) }
      }
  })

  // PHASE 2: T-Snap
  let changed = true
  let iterations = 0
  while (changed && iterations < 3) {
      changed = false
      iterations++
      for (const [root, pt] of centroids) {
          for (const seg of graphSegments) {
              if (seg.u === root || seg.v === root) continue
              const s1 = seg.p1
              const s2 = seg.p2
              const proj = projectPointToSegment(pt, s1, s2)
              if (proj.d < SNAP_DIST && proj.d > EPSILON) {
                  if (proj.t > 0.05 && proj.t < 0.95) {
                      pt.x = proj.point.x
                      pt.y = proj.point.y
                      graphSegments.forEach(s => {
                          if (s.u === root) { s.p1.x = pt.x; s.p1.y = pt.y; }
                          if (s.v === root) { s.p2.x = pt.x; s.p2.y = pt.y; }
                      })
                      changed = true
                      break 
                  }
              }
          }
      }
  }

  // PHASE 3: Splits
  const finalSegments = graphSegments.map(g => ({
      id: g.originalId,
      start: g.p1,
      end: g.p2,
      originalId: g.originalId
  }))
  
  const splitPoints = new Map()
  const addSplit = (idx, t) => {
      if (t <= EPSILON || t >= 1 - EPSILON) return
      if (!splitPoints.has(idx)) splitPoints.set(idx, [])
      splitPoints.get(idx).push(t)
  }

  for (let i = 0; i < finalSegments.length; i++) {
      const s1 = finalSegments[i]
      for (let j = i + 1; j < finalSegments.length; j++) {
          const s2 = finalSegments[j]
          const intersection = getLineIntersection(s1.start, s1.end, s2.start, s2.end)
          if (intersection) {
              addSplit(i, intersection.t1)
              addSplit(j, intersection.t2)
          }
      }
      for (let j = 0; j < finalSegments.length; j++) {
          if (i === j) continue
          const s2 = finalSegments[j]
          const projStart = projectPointToSegment(s2.start, s1.start, s1.end)
          if (projStart.d < EPSILON) addSplit(i, projStart.t)
          const projEnd = projectPointToSegment(s2.end, s1.start, s1.end)
          if (projEnd.d < EPSILON) addSplit(i, projEnd.t)
      }
  }

  const fragments = []
  finalSegments.forEach((seg, idx) => {
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
          fragments.push({
            id: `${seg.originalId}_sub_${t}`,
            points: [currentPt, nextPt],
            originalId: seg.originalId
          })
          currentPt = nextPt
      }
    })
    const dist = Math.hypot(seg.end.x - currentPt.x, seg.end.y - currentPt.y)
    if (dist > EPSILON) {
        fragments.push({
            id: `${seg.originalId}_sub_end`,
            points: [currentPt, seg.end],
            originalId: seg.originalId
        })
    }
  })

  // BUILD GRAPH
  const { nodes, edges } = buildGraph(fragments)
  
  // FIND CYCLES
  const cycles = findMinimalCycles(nodes, edges)

  const candidates = cycles.map(cycle => {
    const poly = cycle.map(nodeId => nodes[nodeId].point)
    const signedArea = calculatePolygonArea(poly)
    const perimeter = calculatePerimeter(poly)
    return {
      id: `room-${cycle.sort().join('-')}`, 
      walls: [],
      area: signedArea,
      perimeter
    }
  })

  const uniqueRooms = new Map()
  candidates.forEach(r => {
      // THE FILTER: area < -0.1
      if (r.area < -0.1) {
          if (!uniqueRooms.has(r.id)) {
              uniqueRooms.set(r.id, { ...r, area: Math.abs(r.area) })
          }
      }
  })
  
  return Array.from(uniqueRooms.values())
}

// ---------------------- Helpers ---------------------------
function projectPointToSegment(p, s1, s2) {
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
function getLineIntersection(p1, p2, p3, p4) {
  const x1 = p1.x, y1 = p1.y
  const x2 = p2.x, y2 = p2.y
  const x3 = p3.x, y3 = p3.y
  const x4 = p4.x, y4 = p4.y
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (denom === 0) return null 
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom
  const EPS = 0.001
  if (ua >= -EPS && ua <= 1 + EPS && ub >= -EPS && ub <= 1 + EPS) {
     return { t1: Math.max(0, Math.min(1, ua)), t2: Math.max(0, Math.min(1, ub)) }
  }
  return null
}
function calculatePolygonArea(points) {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return area / 2
}
function calculatePerimeter(points) { return 0 }

function buildGraph(fragments) {
  const nodes = {}
  const edges = []
  const EPSILON = 0.05
  const getNode = (p) => {
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
    edges.push({ id: f.id, startNode: u, endNode: v })
    nodes[u].edges.push(f.id)
    nodes[v].edges.push(f.id)
  })
  return { nodes, edges }
}

function findMinimalCycles(nodes, edges) {
    const cycles = []
    const adj = {}
    Object.keys(nodes).forEach(k => adj[k] = [])
    edges.forEach(e => {
        if(!adj[e.startNode].includes(e.endNode)) adj[e.startNode].push(e.endNode)
        if(!adj[e.endNode].includes(e.startNode)) adj[e.endNode].push(e.startNode)
    })
    const halfEdges = []
    Object.keys(adj).forEach(u => {
        adj[u].forEach(v => {
            halfEdges.push({ u, v, used: false })
        })
    })

    halfEdges.forEach(he => {
        if (he.used) return
        const path = []
        let curr = he
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
            const neighbors = adj[v]
            if (neighbors.length < 2) { break }
            const vPt = nodes[v].point
            const uPt = nodes[u].point
            const baseAngle = Math.atan2(uPt.y - vPt.y, uPt.x - vPt.x)
            let bestNext = null
            let bestDiff = 4 * Math.PI
            neighbors.forEach(n => {
                if (n === u && neighbors.length > 1) return
                const nPt = nodes[n].point
                const localAngle = Math.atan2(nPt.y - vPt.y, nPt.x - vPt.x)
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
            } else { break }
        }
    })
    return cycles
}

// ---------------------- TEST DATA ---------------------------
const walls = [
    // Room 1 (Top Right) 10x10 square at (10,0)
    { id: 'w1', points: [{x:10,y:0}, {x:20,y:0}] },
    { id: 'w2', points: [{x:20,y:0}, {x:20,y:10}] },
    { id: 'w3', points: [{x:20,y:10}, {x:10,y:10}] },
    { id: 'w4', points: [{x:10,y:10}, {x:10,y:0}] },

    // Room 2 (Mid) 10x10 square adjacent
    // Wall 1: (0,0) to (10,0)
    // Wall 2: (10,0) to (10,10) (Shared) -> duplicated for test
    // Wall 3: (10,10) to (0,10)
    // Wall 4: (0,10) to (0,0)
    
    // Room 2 Walls
    { id: 'r2_t', points: [{x:0,y:0}, {x:10,y:0}] },
    // Shared wall with Room 1, defined again to simulate "shared" user drawing
    { id: 'shared', points: [{x:10,y:0}, {x:10,y:10}] }, 
    { id: 'r2_b', points: [{x:10,y:10}, {x:0,y:10}] },
    { id: 'r2_l', points: [{x:0,y:10}, {x:0,y:0}] }
]

const fs = require('fs');

try {
  let output = '--- Running Detection ---\n';
  const rooms = detectRooms(walls)
  output += `Found ${rooms.length} rooms\n`;
  rooms.forEach((r, i) => {
      output += `Room ${i}: Area=${r.area.toFixed(2)}, ID=${r.id}\n`;
      // Also print points for analysis
      // Need points logic... wait, I don't have points in Room interface in JS mock?
      // But I can get cycle nodes.
      // Actually detectRooms returns rooms with area only in my mock?
      // Let's check detectRooms return
  })
  
  fs.writeFileSync('debug_output_utf8.txt', output, 'utf8');
  console.log('Written to debug_output_utf8.txt');

} catch (e) {
  console.log('ERROR_OCCURRED')
  console.log(e.message)
  console.log(e.stack)
}
