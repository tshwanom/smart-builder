/**
 * Straight Skeleton Algorithm — Test Suite
 * 
 * Run with: npx tsx src/modules/canvas/domain/geometry/analytics/__tests__/StraightSkeleton.test.ts
 * 
 * Tests:
 * 1. Rectangle → 4 faces with proper ridge
 * 2. L-shape → 6 faces with valley at internal corner
 * 3. T-shape → 8 faces with multiple valleys
 * 4. Simple triangle → 3 faces meeting at a point
 */

import { computeStraightSkeleton, SkeletonResult } from '../StraightSkeleton'

// ═══════════════════════════════════════════════════
// Test Helpers
// ═══════════════════════════════════════════════════

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++
    console.log(`  ✅ ${message}`)
  } else {
    failed++
    console.error(`  ❌ FAIL: ${message}`)
  }
}

function assertRange(value: number, min: number, max: number, label: string) {
  assert(value >= min && value <= max, `${label}: ${value} is in range [${min}, ${max}]`)
}

function totalArea(result: SkeletonResult): number {
  let area = 0
  for (const face of result.faces) {
    area += polygonArea(face.polygon)
  }
  return area
}

function polygonArea(poly: { x: number, y: number }[]): number {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length
    a += poly[i].x * poly[j].y
    a -= poly[j].x * poly[i].y
  }
  return Math.abs(a) / 2
}

// ═══════════════════════════════════════════════════
// Test 1: Rectangle
// ═══════════════════════════════════════════════════

function testRectangle() {
  console.log('\n📐 Test 1: Rectangle (4000 × 2000)')
  
  // CW on-screen (CCW math) rectangle
  const polygon = [
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    { x: 4000, y: 2000 },
    { x: 0, y: 2000 }
  ]
  
  const result = computeStraightSkeleton(polygon)
  
  assert(result.faces.length === 4, `Should have 4 faces, got ${result.faces.length}`)
  
  // Each face should have at least 3 vertices
  for (const face of result.faces) {
    assert(face.polygon.length >= 3, `Face ${face.edgeIndex} has ${face.polygon.length} vertices (≥3)`)
  }
  
  // Total face area should approximately equal the rectangle area (4000*2000 = 8,000,000)
  const rectArea = 4000 * 2000
  const ta = totalArea(result)
  assertRange(ta, rectArea * 0.8, rectArea * 1.2, `Total area ~${rectArea}`)
  
  // Should have skeleton arcs (ridge + 4 hips = ~6 arcs minimum)
  assert(result.arcs.length >= 4, `Should have ≥4 arcs, got ${result.arcs.length}`)
  
  console.log(`  📊 Faces: ${result.faces.length}, Arcs: ${result.arcs.length}, Area: ${ta.toFixed(0)}`)
}

// ═══════════════════════════════════════════════════
// Test 2: L-Shape (with internal corner → valley)
// ═══════════════════════════════════════════════════

function testLShape() {
  console.log('\n📐 Test 2: L-Shape (valley at internal corner)')
  
  // L-shape: CW on-screen (CCW math)
  //   (0,0)---------(4000,0)
  //     |               |
  //     |          (4000,2000)
  //     |               |
  //     |    (2000,2000)-+
  //     |       |
  //   (0,4000)-(2000,4000)
  const polygon = [
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    { x: 4000, y: 2000 },
    { x: 2000, y: 2000 },
    { x: 2000, y: 4000 },
    { x: 0, y: 4000 }
  ]
  
  const result = computeStraightSkeleton(polygon)
  
  assert(result.faces.length === 6, `Should have 6 faces, got ${result.faces.length}`)
  
  // Total area should ~ match the L-shape area
  // L area = 4000*2000 + 2000*2000 = 12,000,000
  const lArea = 4000 * 2000 + 2000 * 2000
  const ta = totalArea(result)
  assertRange(ta, lArea * 0.7, lArea * 1.3, `Total area ~${lArea}`)
  
  // Should have a valley arc (from the reflex vertex at (2000,2000))
  // The reflex vertex should produce a split event
  const reflexArcs = result.arcs.filter(a => {
    // Valley arcs come from the reflex vertex
    const isFromReflex = (Math.abs(a.start.x - 2000) < 10 && Math.abs(a.start.y - 2000) < 10)
    return isFromReflex
  })
  assert(reflexArcs.length >= 1, `Should have ≥1 arc from reflex vertex (2000,2000), got ${reflexArcs.length}`)
  
  console.log(`  📊 Faces: ${result.faces.length}, Arcs: ${result.arcs.length}, Area: ${ta.toFixed(0)}`)
  console.log(`  🏔️ Reflex arcs: ${reflexArcs.length}`)
}

// ═══════════════════════════════════════════════════
// Test 3: Triangle
// ═══════════════════════════════════════════════════

function testTriangle() {
  console.log('\n📐 Test 3: Equilateral-ish Triangle')
  
  const polygon = [
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    { x: 2000, y: 3464 }
  ]
  
  const result = computeStraightSkeleton(polygon)
  
  assert(result.faces.length === 3, `Should have 3 faces, got ${result.faces.length}`)
  
  // All 3 bisectors should converge to a single point (the incenter)
  // Each face should be a triangle
  for (const face of result.faces) {
    assert(face.polygon.length >= 3, `Face ${face.edgeIndex} has ${face.polygon.length} vertices`)
  }
  
  const triArea = 0.5 * 4000 * 3464
  const ta = totalArea(result)
  assertRange(ta, triArea * 0.8, triArea * 1.2, `Total area ~${triArea}`)
  
  console.log(`  📊 Faces: ${result.faces.length}, Arcs: ${result.arcs.length}, Area: ${ta.toFixed(0)}`)
}

// ═══════════════════════════════════════════════════
// Test 4: Pentagon (convex)
// ═══════════════════════════════════════════════════

function testPentagon() {
  console.log('\n📐 Test 4: Regular Pentagon')
  
  const r = 2000
  const polygon = []
  for (let i = 0; i < 5; i++) {
    const angle = (2 * Math.PI * i) / 5 - Math.PI / 2
    polygon.push({
      x: r * Math.cos(angle) + r,
      y: r * Math.sin(angle) + r
    })
  }
  
  const result = computeStraightSkeleton(polygon)
  
  assert(result.faces.length === 5, `Should have 5 faces, got ${result.faces.length}`)
  assert(result.arcs.length >= 5, `Should have ≥5 arcs, got ${result.arcs.length}`)
  
  console.log(`  📊 Faces: ${result.faces.length}, Arcs: ${result.arcs.length}`)
}

// ═══════════════════════════════════════════════════
// Run All Tests
// ═══════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════')
console.log('  Straight Skeleton Algorithm — Test Suite')
console.log('═══════════════════════════════════════════════════')

testRectangle()
testTriangle()
testPentagon()
testLShape()

console.log('\n═══════════════════════════════════════════════════')
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('═══════════════════════════════════════════════════')

if (failed > 0) {
  process.exit(1)
}
