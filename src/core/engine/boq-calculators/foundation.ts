/**
 * Foundation Calculator
 * Handles all foundation-related materials (SANS 10400-B)
 */

import { BOQItem } from './types'

export function calculateFoundation(
  wallLength: number,
  wallThickness: number,
  depth: number,
  _floorArea: number
): BOQItem[] {
  const items: BOQItem[] = []

  // 1. EXCAVATION
  const foundationWidth = wallThickness + 0.6 // 300mm each side
  const excavationVolume = wallLength * foundationWidth * depth * 1.2 // 20% extra for working space
  
  items.push({
    category: 'Foundation - Excavation',
    item: 'Excavation & Earthworks',
    quantity: parseFloat(excavationVolume.toFixed(2)),
    unit: 'm³',
    notes: 'Includes 20% working space'
  })

  items.push({
    category: 'Foundation - Excavation',
    item: 'Disposal of Excavated Material',
    quantity: parseFloat(excavationVolume.toFixed(2)),
    unit: 'm³',
    notes: 'Off-site disposal'
  })

  // 2. BLINDING LAYER
  const blindingVolume = wallLength * foundationWidth * 0.05 // 50mm sand
  
  items.push({
    category: 'Foundation - Preparation',
    item: 'Sand Blinding (50mm)',
    quantity: parseFloat(blindingVolume.toFixed(2)),
    unit: 'm³',
    notes: 'Compacted layer under foundation'
  })

  // 3. CONCRETE FOUNDATION
  const foundationVolume = wallLength * foundationWidth * depth
  const concreteBags = Math.ceil(foundationVolume * 6 * 1.05) // 5% waste
  const sand = foundationVolume * 0.6 * 1.05
  const stone = foundationVolume * 0.6 * 1.05

  items.push({
    category: 'Foundation - Concrete',
    item: 'Cement (50kg bags)',
    quantity: concreteBags,
    unit: 'bags',
    notes: '1:3:6 mix (5% waste included)'
  })

  items.push({
    category: 'Foundation - Concrete',
    item: 'Building Sand',
    quantity: parseFloat(sand.toFixed(2)),
    unit: 'm³',
    notes: '5% waste included'
  })

  items.push({
    category: 'Foundation - Concrete',
    item: 'Stone (19mm)',
    quantity: parseFloat(stone.toFixed(2)),
    unit: 'm³',
    notes: '5% waste included'
  })

  // 4. STEEL REINFORCEMENT
  const steelLength = wallLength * 4 // 4 bars per foundation
  const steelMass = steelLength * 0.888 * 1.1 // Y12 = 0.888 kg/m + 10% waste

  items.push({
    category: 'Foundation - Steel',
    item: 'Steel Reinforcement Y12',
    quantity: parseFloat(steelMass.toFixed(2)),
    unit: 'kg',
    notes: '10% waste included'
  })

  items.push({
    category: 'Foundation - Steel',
    item: 'Binding Wire',
    quantity: parseFloat((steelMass * 0.02).toFixed(2)),
    unit: 'kg',
    notes: '2% of steel mass'
  })

  // 5. STARTER BARS (vertical steel into walls)
  const starterBars = Math.ceil(wallLength / 0.6) // Every 600mm
  const starterBarMass = starterBars * 1.2 * 0.888 // 1.2m long Y12 bars

  items.push({
    category: 'Foundation - Steel',
    item: 'Starter Bars Y12 (1.2m)',
    quantity: starterBars,
    unit: 'units',
    notes: `Vertical bars @ 600mm spacing (${starterBarMass.toFixed(1)}kg total)`
  })

  // 6. FORMWORK
  const formworkArea = wallLength * depth * 2 // Both sides

  items.push({
    category: 'Foundation - Formwork',
    item: 'Timber Formwork',
    quantity: parseFloat(formworkArea.toFixed(2)),
    unit: 'm²',
    notes: 'Reusable formwork'
  })

  items.push({
    category: 'Foundation - Formwork',
    item: 'Release Agent/Oil',
    quantity: parseFloat((formworkArea * 0.1).toFixed(2)),
    unit: 'liters',
    notes: '0.1L per m²'
  })

  // 7. WATERPROOFING
  const waterproofArea = wallLength * foundationWidth

  items.push({
    category: 'Foundation - Waterproofing',
    item: 'Bitumen Waterproofing',
    quantity: parseFloat(waterproofArea.toFixed(2)),
    unit: 'm²',
    notes: 'Applied to foundation exterior'
  })

  items.push({
    category: 'Foundation - Waterproofing',
    item: 'Bitumen Primer',
    quantity: parseFloat((waterproofArea * 0.15).toFixed(2)),
    unit: 'liters',
    notes: '0.15L per m²'
  })

  return items
}
