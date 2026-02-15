/**
 * Walling Calculator
 * Handles all walling materials (SANS 920 & 10400-K)
 */

import { BOQItem, Opening } from './types'

export function calculateWalling(
  wallArea: number,
  wallHeight: number,
  openings: Opening[] = [],
  brickType: 'clay' | 'cement' | 'block' = 'clay'
): BOQItem[] {
  const items: BOQItem[] = []

  // Calculate net wall area (deduct openings)
  const openingArea = openings.reduce((sum, opening) => {
    return sum + (opening.width * opening.height)
  }, 0)

  const netWallArea = wallArea - openingArea

  // Brick specifications
  const brickSpecs = {
    clay: { bricksPerM2: 55, mortarRatio: '1:4', name: 'Clay Stock Brick' },
    cement: { bricksPerM2: 55, mortarRatio: '1:4', name: 'Cement Stock Brick' },
    block: { bricksPerM2: 12.5, mortarRatio: '1:6', name: 'Concrete Block (140mm)' }
  }

  const spec = brickSpecs[brickType]
  const totalBricks = Math.ceil(netWallArea * spec.bricksPerM2 * 1.05) // 5% waste

  items.push({
    category: 'Walling - Bricks',
    item: spec.name,
    quantity: totalBricks,
    unit: 'units',
    notes: `Net area: ${netWallArea.toFixed(2)}m² (5% waste included)`
  })

  // Mortar calculations
  const mortarPerM2 = brickType === 'block' ? 0.02 : 0.03
  const mortarVolume = netWallArea * mortarPerM2
  const cementRatio = brickType === 'block' ? 1/7 : 1/5
  const cementBags = Math.ceil(mortarVolume * cementRatio * 7 * 1.05)
  const plasterSand = mortarVolume * 1.05

  items.push({
    category: 'Walling - Mortar',
    item: 'Cement (50kg bags)',
    quantity: cementBags,
    unit: 'bags',
    notes: `${spec.mortarRatio} mix (5% waste included)`
  })

  items.push({
    category: 'Walling - Mortar',
    item: 'Plaster Sand',
    quantity: parseFloat(plasterSand.toFixed(2)),
    unit: 'm³',
    notes: '5% waste included'
  })

  // Brickforce
  const brickforceRows = Math.ceil(wallHeight / 0.45)
  const wallPerimeter = wallArea / wallHeight
  const brickforceLength = wallPerimeter * brickforceRows

  items.push({
    category: 'Walling - Reinforcement',
    item: 'Brickforce (Galvanized)',
    quantity: parseFloat(brickforceLength.toFixed(2)),
    unit: 'm',
    notes: 'Every 450mm vertically (SANS 10400-K)'
  })

  return items
}
