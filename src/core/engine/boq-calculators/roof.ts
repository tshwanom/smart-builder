/**
 * Roof Calculator
 * Handles pitched and flat roof materials
 */

import { BOQItem } from './types'

export function calculatePitchedRoof(
  floorArea: number,
  roofType: 'gable' | 'hip' = 'gable',
  pitch: number = 30
): BOQItem[] {
  const items: BOQItem[] = []

  // Calculate roof area
  const pitchFactor = 1 / Math.cos((pitch * Math.PI) / 180)
  const roofArea = floorArea * pitchFactor * (roofType === 'hip' ? 1.15 : 1.05)
  const buildingWidth = Math.sqrt(floorArea)
  const numberOfTrusses = Math.ceil(buildingWidth / 0.6)

  // ROOF STRUCTURE
  const timberPerTruss = buildingWidth * 2.5
  const totalTimber = numberOfTrusses * timberPerTruss * 1.1

  items.push({
    category: 'Roof Structure',
    item: 'Roof Trusses (Timber)',
    quantity: numberOfTrusses,
    unit: 'units',
    notes: '600mm spacing'
  })

  items.push({
    category: 'Roof Structure',
    item: 'Timber for Trusses (50x114mm)',
    quantity: parseFloat(totalTimber.toFixed(2)),
    unit: 'm',
    notes: '10% waste included'
  })

  items.push({
    category: 'Roof Structure',
    item: 'Gang Nail Plates',
    quantity: numberOfTrusses * 8,
    unit: 'units',
    notes: '~8 plates per truss'
  })

  items.push({
    category: 'Roof Structure',
    item: 'Hurricane Straps',
    quantity: numberOfTrusses,
    unit: 'units',
    notes: 'Truss to wall connection'
  })

  const purlinLength = buildingWidth * numberOfTrusses * 3 * 1.05

  items.push({
    category: 'Roof Structure',
    item: 'Purlins (50x76mm)',
    quantity: parseFloat(purlinLength.toFixed(2)),
    unit: 'm',
    notes: '900mm spacing, 5% waste'
  })

  // ROOF COVERING
  const sheeting = roofArea * 1.15

  items.push({
    category: 'Roof Covering',
    item: 'Roof Underlay/Sarking',
    quantity: parseFloat(roofArea.toFixed(2)),
    unit: 'm²',
    notes: 'Breathable membrane'
  })

  items.push({
    category: 'Roof Covering',
    item: 'IBR Roof Sheeting (0.5mm)',
    quantity: parseFloat(sheeting.toFixed(2)),
    unit: 'm²',
    notes: '15% overlap included'
  })

  items.push({
    category: 'Roof Covering',
    item: 'Roof Screws',
    quantity: Math.ceil(roofArea * 8),
    unit: 'units',
    notes: '8 screws per m²'
  })

  items.push({
    category: 'Roof Covering',
    item: 'Ridge Capping',
    quantity: parseFloat(buildingWidth.toFixed(2)),
    unit: 'm'
  })

  // ROOF ACCESSORIES
  items.push({
    category: 'Roof Accessories',
    item: 'Fascia Boards (22x228mm)',
    quantity: parseFloat((buildingWidth * 2 * 1.05).toFixed(2)),
    unit: 'm',
    notes: '5% waste'
  })

  items.push({
    category: 'Roof Accessories',
    item: 'Barge Boards (22x228mm)',
    quantity: parseFloat((buildingWidth * 2 * 1.05).toFixed(2)),
    unit: 'm',
    notes: '5% waste'
  })

  items.push({
    category: 'Roof Accessories',
    item: 'Soffit Boards',
    quantity: parseFloat((buildingWidth * 2 * 0.6).toFixed(2)),
    unit: 'm²',
    notes: '600mm wide soffit'
  })

  items.push({
    category: 'Roof Accessories',
    item: 'Gutters (PVC 150mm)',
    quantity: parseFloat((buildingWidth * 2).toFixed(2)),
    unit: 'm',
    notes: 'Both sides'
  })

  items.push({
    category: 'Roof Accessories',
    item: 'Downpipes (PVC 110mm)',
    quantity: Math.ceil(buildingWidth / 6) * 3,
    unit: 'm',
    notes: '1 downpipe per 6m, 3m high'
  })

  items.push({
    category: 'Roof Accessories',
    item: 'Gutter Brackets',
    quantity: Math.ceil(buildingWidth * 2 / 0.6),
    unit: 'units',
    notes: '@ 600mm spacing'
  })

  return items
}

export function calculateFlatRoof(floorArea: number): BOQItem[] {
  const items: BOQItem[] = []
  const slabThickness = 0.15

  // FORMWORK
  const perimeter = Math.sqrt(floorArea) * 4
  const formworkArea = perimeter * slabThickness

  items.push({
    category: 'Roof Slab - Formwork',
    item: 'Timber Formwork',
    quantity: parseFloat(formworkArea.toFixed(2)),
    unit: 'm²',
    notes: 'Edge formwork'
  })

  items.push({
    category: 'Roof Slab - Formwork',
    item: 'Soffit Formwork (Plywood)',
    quantity: parseFloat((floorArea * 1.05).toFixed(2)),
    unit: 'm²',
    notes: '5% waste'
  })

  items.push({
    category: 'Roof Slab - Formwork',
    item: 'Props/Supports',
    quantity: Math.ceil(floorArea / 2),
    unit: 'units',
    notes: '1 prop per 2m²'
  })

  items.push({
    category: 'Roof Slab - Formwork',
    item: 'Release Agent',
    quantity: parseFloat((floorArea * 0.1).toFixed(2)),
    unit: 'liters',
    notes: '0.1L per m²'
  })

  // CONCRETE
  const concreteVolume = floorArea * slabThickness
  const cementBags = Math.ceil(concreteVolume * 6 * 1.05)
  const sand = concreteVolume * 0.6 * 1.05
  const stone = concreteVolume * 0.6 * 1.05

  items.push({
    category: 'Roof Slab - Concrete',
    item: 'Cement (50kg bags)',
    quantity: cementBags,
    unit: 'bags',
    notes: '1:3:6 mix (5% waste)'
  })

  items.push({
    category: 'Roof Slab - Concrete',
    item: 'Building Sand',
    quantity: parseFloat(sand.toFixed(2)),
    unit: 'm³',
    notes: '5% waste'
  })

  items.push({
    category: 'Roof Slab - Concrete',
    item: 'Stone (19mm)',
    quantity: parseFloat(stone.toFixed(2)),
    unit: 'm³',
    notes: '5% waste'
  })

  // STEEL
  const meshArea = floorArea * 1.1

  items.push({
    category: 'Roof Slab - Steel',
    item: 'BRC Mesh A193',
    quantity: parseFloat(meshArea.toFixed(2)),
    unit: 'm²',
    notes: '10% overlap'
  })

  items.push({
    category: 'Roof Slab - Steel',
    item: 'Mesh Chairs',
    quantity: Math.ceil(floorArea / 2),
    unit: 'units',
    notes: '1 per 2m²'
  })

  // WATERPROOFING
  items.push({
    category: 'Roof Slab - Waterproofing',
    item: 'Torch-on Waterproofing Membrane',
    quantity: parseFloat((floorArea * 1.1).toFixed(2)),
    unit: 'm²',
    notes: '10% overlap'
  })

  items.push({
    category: 'Roof Slab - Waterproofing',
    item: 'Bitumen Primer',
    quantity: parseFloat((floorArea * 0.15).toFixed(2)),
    unit: 'liters',
    notes: '0.15L per m²'
  })

  items.push({
    category: 'Roof Slab - Waterproofing',
    item: 'Screed for Falls (50mm avg)',
    quantity: parseFloat((floorArea * 0.05).toFixed(2)),
    unit: 'm³',
    notes: 'To create drainage slope'
  })

  // DRAINAGE
  items.push({
    category: 'Roof Slab - Drainage',
    item: 'Roof Drains/Outlets',
    quantity: Math.ceil(floorArea / 50),
    unit: 'units',
    notes: '1 per 50m²'
  })

  items.push({
    category: 'Roof Slab - Drainage',
    item: 'Downpipes (PVC 110mm)',
    quantity: Math.ceil(floorArea / 50) * 3,
    unit: 'm',
    notes: '3m per drain'
  })

  // CURING
  items.push({
    category: 'Roof Slab - Curing',
    item: 'Curing Compound',
    quantity: parseFloat((floorArea * 0.2).toFixed(2)),
    unit: 'liters',
    notes: '0.2L per m²'
  })

  return items
}
