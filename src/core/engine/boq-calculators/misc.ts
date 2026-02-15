/**
 * Miscellaneous Calculators
 * Lintels, DPC, and other small items
 */

import { BOQItem, Opening } from './types'

export function calculateLintels(openings: Opening[]): BOQItem[] {
  const items: BOQItem[] = []

  if (openings.length === 0) return items

  const lintelLengths = openings.map(opening => opening.width + 0.6) // 300mm bearing each side
  const totalLintelLength = lintelLengths.reduce((sum, length) => sum + length, 0)

  items.push({
    category: 'Lintels',
    item: 'Precast Concrete Lintels',
    quantity: parseFloat(totalLintelLength.toFixed(2)),
    unit: 'm',
    notes: `${openings.length} openings (width + 600mm bearing)`
  })

  // Padstones for lintel bearing
  items.push({
    category: 'Lintels',
    item: 'Concrete Padstones',
    quantity: openings.length * 2,
    unit: 'units',
    notes: '2 per opening (both ends)'
  })

  return items
}

export function calculateDPC(wallLength: number, wallThickness: number): BOQItem[] {
  const dpcWidth = wallThickness + 0.1 // 50mm each side
  const dpcArea = wallLength * dpcWidth * 1.1 // 10% overlap

  return [
    {
      category: 'Damp Proofing',
      item: 'DPC Membrane (375 micron)',
      quantity: parseFloat(dpcArea.toFixed(2)),
      unit: 'm²',
      notes: '10% overlap (SANS 10400-C)'
    },
    {
      category: 'Damp Proofing',
      item: 'Mastic/Sealant for DPC Joints',
      quantity: parseFloat((wallLength * 0.05).toFixed(2)),
      unit: 'tubes',
      notes: '1 tube per 20m'
    }
  ]
}
