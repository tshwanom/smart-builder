/**
 * Finishes Calculator
 * Handles floor, wall, and ceiling finishes
 */

import { BOQItem } from './types'

export function calculateFinishes(
  floorArea: number,
  wallArea: number,
  ceilingArea: number,
  wallLength: number, // Added for skirting
  finishTypes?: {
    floor?: 'tiles' | 'screed' | 'vinyl'
    walls?: 'paint' | 'plaster' | 'tiles'
    ceiling?: 'paint' | 'suspended'
  }
): BOQItem[] {
  const items: BOQItem[] = []
  const { floor = 'tiles', walls = 'paint', ceiling = 'paint' } = finishTypes || {}

  // FLOOR FINISHES
  if (floor === 'tiles') {
    items.push({
      category: 'Finishes - Floor',
      item: 'Ceramic Floor Tiles (600x600mm)',
      quantity: parseFloat((floorArea * 1.1).toFixed(2)),
      unit: 'm²',
      notes: '10% waste included'
    })

    items.push({
      category: 'Finishes - Floor',
      item: 'Tile Adhesive',
      quantity: Math.ceil(floorArea * 0.005 * 20),
      unit: 'bags',
      notes: '5kg per m² in 20kg bags'
    })

    items.push({
      category: 'Finishes - Floor',
      item: 'Tile Grout',
      quantity: Math.ceil(floorArea * 0.002 * 20),
      unit: 'bags',
      notes: '2kg per m² in 20kg bags'
    })

    items.push({
      category: 'Finishes - Floor',
      item: 'Tile Spacers',
      quantity: Math.ceil(floorArea * 10),
      unit: 'units',
      notes: '~10 spacers per m²'
    })

    items.push({
      category: 'Finishes - Floor',
      item: 'Tile Sealer',
      quantity: parseFloat((floorArea * 0.1).toFixed(2)),
      unit: 'liters',
      notes: '0.1L per m²'
    })

    // Skirting (Tile)
    items.push({
      category: 'Finishes - Skirting',
      item: 'Tile Skirting (100mm)',
      quantity: parseFloat((wallLength * 1.05).toFixed(2)),
      unit: 'm',
      notes: 'Cut from floor tiles (5% waste)'
    })
  }

  // FLOOR - SCREED
  if (floor === 'screed') {
    // ... existing screed items ...
  }
  
  // FLOOR - VINYL (New)
  if (floor === 'vinyl') {
    items.push({
      category: 'Finishes - Floor',
      item: 'Vinyl Flooring Sheeting/Planks',
      quantity: parseFloat((floorArea * 1.08).toFixed(2)),
      unit: 'm²',
      notes: '8% waste included'
    })
    
    items.push({
      category: 'Finishes - Floor',
      item: 'Vinyl Adhesive',
      quantity: parseFloat((floorArea * 0.25).toFixed(2)),
      unit: 'liters',
      notes: '0.25L per m²'
    })

    items.push({
      category: 'Finishes - Floor',
      item: 'Self-Leveling Screed',
      quantity: Math.ceil(floorArea / 5),
      unit: 'bags',
      notes: 'Preparation layer'
    })

    // Skirting (Vinyl/Timber)
    items.push({
      category: 'Finishes - Skirting',
      item: 'Vinyl/Timber Skirting (75mm)',
      quantity: parseFloat((wallLength * 1.05).toFixed(2)),
      unit: 'm',
      notes: 'Includes fixings'
    })
  }

  // WALL FINISHES
  if (walls === 'paint') {
    // Plaster materials
    const plasterVolume = wallArea * 0.015 // 15mm plaster
    const plasterCement = Math.ceil(plasterVolume * 7)
    const plasterSand = plasterVolume * 1.05

    items.push({
      category: 'Finishes - Walls',
      item: 'Cement for Plaster (50kg bags)',
      quantity: plasterCement,
      unit: 'bags',
      notes: '1:4 mix for 15mm plaster'
    })

    items.push({
      category: 'Finishes - Walls',
      item: 'Plaster Sand',
      quantity: parseFloat(plasterSand.toFixed(2)),
      unit: 'm³',
      notes: '5% waste included'
    })

    items.push({
      category: 'Finishes - Walls',
      item: 'Bonding Agent',
      quantity: parseFloat((wallArea * 0.15).toFixed(2)),
      unit: 'liters',
      notes: '0.15L per m²'
    })

    // Paint materials
    items.push({
      category: 'Finishes - Walls',
      item: 'Primer/Undercoat',
      quantity: parseFloat((wallArea / 12).toFixed(2)),
      unit: 'liters',
      notes: '12m² per liter coverage'
    })

    items.push({
      category: 'Finishes - Walls',
      item: 'Interior Paint (2 coats)',
      quantity: parseFloat((wallArea / 10).toFixed(2)),
      unit: 'liters',
      notes: '10m² per liter coverage'
    })

    items.push({
      category: 'Finishes - Walls',
      item: 'Filler/Putty',
      quantity: Math.ceil(wallArea * 0.02),
      unit: 'kg',
      notes: 'For crack filling'
    })
  } else if (walls === 'tiles') {
    items.push({
      category: 'Finishes - Walls',
      item: 'Wall Tiles (300x600mm)',
      quantity: parseFloat((wallArea * 1.1).toFixed(2)),
      unit: 'm²',
      notes: '10% waste included'
    })

    items.push({
      category: 'Finishes - Walls',
      item: 'Tile Adhesive',
      quantity: Math.ceil(wallArea * 0.005 * 20),
      unit: 'bags',
      notes: '5kg per m²'
    })

    items.push({
      category: 'Finishes - Walls',
      item: 'Tile Grout',
      quantity: Math.ceil(wallArea * 0.002 * 20),
      unit: 'bags',
      notes: '2kg per m²'
    })
  }

  // CEILING FINISHES
  if (ceiling === 'paint') {
    // Ceiling boards
    items.push({
      category: 'Finishes - Ceiling',
      item: 'Ceiling Boards (Gypsum 9mm)',
      quantity: parseFloat((ceilingArea * 1.05).toFixed(2)),
      unit: 'm²',
      notes: '5% waste included'
    })

    items.push({
      category: 'Finishes - Ceiling',
      item: 'Ceiling Battens (38x38mm)',
      quantity: parseFloat((ceilingArea * 3).toFixed(2)),
      unit: 'm',
      notes: '@ 400mm spacing'
    })

    items.push({
      category: 'Finishes - Ceiling',
      item: 'Ceiling Screws',
      quantity: Math.ceil(ceilingArea * 8),
      unit: 'units',
      notes: '8 screws per m²'
    })

    items.push({
      category: 'Finishes - Ceiling',
      item: 'Jointing Tape',
      quantity: parseFloat((ceilingArea * 0.5).toFixed(2)),
      unit: 'm',
      notes: 'For board joints'
    })

    items.push({
      category: 'Finishes - Ceiling',
      item: 'Joint Filler',
      quantity: Math.ceil(ceilingArea * 0.3),
      unit: 'kg',
      notes: 'For board joints'
    })

    // Paint
    items.push({
      category: 'Finishes - Ceiling',
      item: 'Ceiling Primer',
      quantity: parseFloat((ceilingArea / 12).toFixed(2)),
      unit: 'liters',
      notes: '12m² per liter'
    })

    items.push({
      category: 'Finishes - Ceiling',
      item: 'Ceiling Paint',
      quantity: parseFloat((ceilingArea / 12).toFixed(2)),
      unit: 'liters',
      notes: '12m² per liter coverage'
    })

    items.push({
      category: 'Finishes - Ceiling',
      item: 'Cornices',
      quantity: parseFloat((Math.sqrt(ceilingArea) * 4).toFixed(2)),
      unit: 'm',
      notes: 'Perimeter estimate'
    })
  }

  return items
}
