/**
 * Subfloor Calculator
 * Handles ground floor slab construction (SANS 10400-B)
 */

import { BOQItem } from './types'

export function calculateSubfloor(floorArea: number): BOQItem[] {
  const items: BOQItem[] = []

  // 1. HARDCORE FILL (150mm compacted stone)
  const hardcoreVolume = floorArea * 0.15 * 1.25 // 25% compaction factor

  items.push({
    category: 'Subfloor - Fill',
    item: 'Hardcore Fill (150mm compacted)',
    quantity: parseFloat(hardcoreVolume.toFixed(2)),
    unit: 'm³',
    notes: '25% compaction allowance included'
  })

  items.push({
    category: 'Subfloor - Fill',
    item: 'Compaction (Mechanical)',
    quantity: parseFloat(floorArea.toFixed(2)),
    unit: 'm²',
    notes: 'Plate compactor required'
  })

  // 2. BLINDING SAND (50mm)
  const blindingSand = floorArea * 0.05

  items.push({
    category: 'Subfloor - Preparation',
    item: 'Blinding Sand (50mm)',
    quantity: parseFloat(blindingSand.toFixed(2)),
    unit: 'm³',
    notes: 'Over hardcore'
  })

  // 3. DPC MEMBRANE (under slab)
  const dpcArea = floorArea * 1.1 // 10% overlap

  items.push({
    category: 'Subfloor - DPC',
    item: 'DPC Membrane (375 micron)',
    quantity: parseFloat(dpcArea.toFixed(2)),
    unit: 'm²',
    notes: '10% overlap included (SANS 10400-C)'
  })

  items.push({
    category: 'Subfloor - DPC',
    item: 'DPC Tape/Jointing',
    quantity: Math.ceil(Math.sqrt(floorArea) * 4 * 1.1),
    unit: 'm',
    notes: 'For sealing DPC joints'
  })

  // 4. CONCRETE SLAB (100mm)
  const slabThickness = 0.1
  const concreteVolume = floorArea * slabThickness
  const cementBags = Math.ceil(concreteVolume * 6 * 1.05)
  const sand = concreteVolume * 0.6 * 1.05
  const stone = concreteVolume * 0.6 * 1.05

  items.push({
    category: 'Subfloor - Concrete Slab',
    item: 'Cement (50kg bags)',
    quantity: cementBags,
    unit: 'bags',
    notes: '1:3:6 mix for 100mm slab (5% waste)'
  })

  items.push({
    category: 'Subfloor - Concrete Slab',
    item: 'Building Sand',
    quantity: parseFloat(sand.toFixed(2)),
    unit: 'm³',
    notes: '5% waste included'
  })

  items.push({
    category: 'Subfloor - Concrete Slab',
    item: 'Stone (19mm)',
    quantity: parseFloat(stone.toFixed(2)),
    unit: 'm³',
    notes: '5% waste included'
  })

  // 5. STEEL MESH
  const meshArea = floorArea * 1.1 // 10% overlap

  items.push({
    category: 'Subfloor - Reinforcement',
    item: 'BRC Mesh A193',
    quantity: parseFloat(meshArea.toFixed(2)),
    unit: 'm²',
    notes: '10% overlap included'
  })

  items.push({
    category: 'Subfloor - Reinforcement',
    item: 'Mesh Chairs/Spacers',
    quantity: Math.ceil(floorArea / 2),
    unit: 'units',
    notes: '1 per 2m²'
  })

  // 6. CURING
  items.push({
    category: 'Subfloor - Curing',
    item: 'Curing Compound',
    quantity: parseFloat((floorArea * 0.2).toFixed(2)),
    unit: 'liters',
    notes: '0.2L per m²'
  })

  // 7. SCREED (50mm) - Optional top layer
  const screedVolume = floorArea * 0.05
  const screedCement = Math.ceil(screedVolume * 8) // Richer mix for screed
  const screedSand = screedVolume * 1.05

  items.push({
    category: 'Subfloor - Screed',
    item: 'Cement for Screed (50kg bags)',
    quantity: screedCement,
    unit: 'bags',
    notes: '1:4 mix for 50mm screed'
  })

  items.push({
    category: 'Subfloor - Screed',
    item: 'Plaster Sand for Screed',
    quantity: parseFloat(screedSand.toFixed(2)),
    unit: 'm³',
    notes: '5% waste included'
  })

  return items
}
