/**
 * Subfloor Calculator
 * Handles SANS 10400-H compliant subfloor calculations
 */

import { BOQItem } from './types'
import { SubfloorStructure } from '../../../domain/types'
import { MaterialDatabase } from '../../../application/services/MaterialDatabase'

export function calculateSubfloor(
  floorArea: number,
  structure: SubfloorStructure
): BOQItem[] {
  const items: BOQItem[] = []
  
  // 1. Common: Surface Bed / Topping
  // If beam & block or hollow core, we usually have a structural topping (e.g. 50-75mm)
  // If slab on ground, it's the main slab (e.g. 100mm)
  
  if (structure.type === 'slab_on_ground') {
      calculateSlabOnGround(items, floorArea, structure)
  } else if (structure.type === 'beam_and_block') {
      calculateBeamAndBlock(items, floorArea, structure)
  } else if (structure.type === 'hollow_core') {
      calculateHollowCore(items, floorArea, structure)
  }

  return items
}

function calculateSlabOnGround(items: BOQItem[], area: number, structure: SubfloorStructure) {
    const thickness = structure.slab?.thickness || 100
    const vol = area * (thickness / 1000)
    
    // 1. Hardcore Fill
    items.push({
        category: 'Subfloor - Fill',
        item: 'Hardcore Fill (G5)',
        quantity: parseFloat((area * 0.15 * 1.3).toFixed(2)), // 150mm compacted
        unit: 'm³',
        notes: 'Includes compaction factor'
    })
    
    // 2. DPM
    items.push({
        category: 'Subfloor - DPM',
        item: 'DPM 250 micron',
        quantity: parseFloat(area.toFixed(2)),
        unit: 'm²',
        notes: 'Under surface bed'
    })
    
    // 3. Concrete
    items.push({
        category: 'Subfloor - Concrete',
        item: `Surface Bed Concrete ${thickness}mm`,
        quantity: parseFloat(vol.toFixed(2)),
        unit: 'm³',
        notes: '25MPa'
    })
    
    // 4. Mesh
    const meshRef = structure.slab?.meshRef || 'Ref 193'
    items.push({
        category: 'Subfloor - Reinforcement',
        item: `${meshRef} Mesh`,
        quantity: parseFloat((area * 1.1).toFixed(2)), // 10% lap
        unit: 'm²',
        notes: 'Includes 10% laps'
    })
}

function calculateBeamAndBlock(items: BOQItem[], area: number, structure: SubfloorStructure) {
    // Assumptions for estimation:
    // Beams are spaced at e.g. 600mm centers (standard for 440 blocks + 110 beams = 550?)
    // Actually block is 440 wide. Beam is 110 wide usually inverted T.
    // Center spacing = 440 + ~60 = 500mm or similar. 
    // Let's rely on config spacing.
    
    const spacing = structure.beamAndBlock?.beamSpacing || 600
    const beamLengthTotal = (area / (spacing / 1000)) 
    
    // 1. Beams
    items.push({
        category: 'Subfloor - Structure',
        item: 'Prestressed Concrete Beams 150mm',
        quantity: parseFloat(beamLengthTotal.toFixed(2)),
        unit: 'm',
        rate: 180, // From DB
        notes: `Spacing: ${spacing}mm c/c`
    })
    
    // 2. Blocks
    // Blocks cover the area between beams.
    // Roughly 90% of area is blocks (minus beam widths)
    // Block size 440x215. Area = 0.095m2 each.
    // Roughly 10 blocks per m2.
    const blocks = Math.ceil(area * 10.5) // 10.5 blocks per m2 standard
    
    items.push({
        category: 'Subfloor - Structure',
        item: 'Hollow Concrete Blocks 440x215x110',
        quantity: blocks,
        unit: 'No',
        rate: 14,
        notes: 'Infill blocks'
    })
    
    // 3. Topping concrete (structural texturing)
    const toppingThick = 50 // mm
    const toppingVol = area * (toppingThick / 1000)
    
    items.push({
        category: 'Subfloor - Topping',
        item: `Concrete Topping ${toppingThick}mm`,
        quantity: parseFloat(toppingVol.toFixed(2)),
        unit: 'm³',
        notes: '20MPa Monolithic'
    })
    
    // 4. Mesh in topping
    items.push({
        category: 'Subfloor - Topping',
        item: 'Ref 100 Mesh',
        quantity: parseFloat((area * 1.1).toFixed(2)),
        unit: 'm²',
        notes: 'Topping reinforcement'
    })
}

function calculateHollowCore(items: BOQItem[], area: number, structure: SubfloorStructure) {
    // 1. Slabs
    items.push({
        category: 'Subfloor - Structure',
        item: 'Hollow Core Slabs 150mm',
        quantity: parseFloat(area.toFixed(2)),
        unit: 'm²',
        rate: 850,
        notes: 'Supply and Install'
    })
    
    // 2. Structural Screed / Topping
    const toppingThick = 40 // mm
    const toppingVol = area * (toppingThick / 1000)
    
    items.push({
        category: 'Subfloor - Topping',
        item: `Structural Screed ${toppingThick}mm`,
        quantity: parseFloat(toppingVol.toFixed(2)),
        unit: 'm³',
        notes: 'Levelling screed'
    })
}
