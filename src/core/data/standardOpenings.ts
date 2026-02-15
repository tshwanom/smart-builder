/**
 * Standard Openings Library
 * Defines standard sizes and properties for SA market
 */

import { Opening } from '../boq-calculators/types'

export const DOOR_LIBRARY = {
  // INTERNAL DOORS
  'Door - Internal Hollow Core': {
    type: 'door',
    subtype: 'single',
    material: 'wood',
    width: 0.813,
    height: 2.032,
    lintelType: 'concrete',
    sillType: 'none'
  },
  
  // EXTERNAL DOORS - HARDWOOD
  'Door - External Solid Meranti': {
    type: 'door',
    subtype: 'single',
    material: 'wood',
    width: 0.813,
    height: 2.032,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },
  'Door - Stable Meranti': {
    type: 'door',
    subtype: 'single',
    material: 'wood',
    width: 0.813,
    height: 2.032,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },
  
  // EXTERNAL - ALUMINIUM
  'Door - Alu Single Hinge': {
    type: 'door',
    subtype: 'single',
    material: 'aluminium',
    width: 0.9,
    height: 2.1,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },
  'Door - Alu Double Hinge': {
    type: 'door',
    subtype: 'double',
    material: 'aluminium',
    width: 1.8,
    height: 2.1,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },
  'Door - Alu Pivot (1.2m)': {
    type: 'door',
    subtype: 'pivot',
    material: 'aluminium',
    width: 1.2,
    height: 2.1,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },
  
  // SLIDING DOORS
  'Door - Sliding (1.8m)': {
    type: 'door',
    subtype: 'sliding',
    material: 'aluminium',
    width: 1.8,
    height: 2.1,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },
  'Door - Sliding (2.1m)': {
    type: 'door',
    subtype: 'sliding',
    material: 'aluminium',
    width: 2.1,
    height: 2.1,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },
  'Door - Sliding (3.0m)': {
    type: 'door',
    subtype: 'sliding',
    material: 'aluminium',
    width: 3.0,
    height: 2.1,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },
  
  // FOLDING DOORS
  'Door - Folding (3 Panel)': {
    type: 'door',
    subtype: 'folding',
    material: 'aluminium',
    width: 2.7,
    height: 2.1,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },
  'Door - Folding (5 Panel)': {
    type: 'door',
    subtype: 'folding',
    material: 'aluminium',
    width: 4.5,
    height: 2.1,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },

  // GARAGE DOORS
  'Door - Garage Single': {
    type: 'door',
    subtype: 'garage_single',
    material: 'steel', // Aluzinc usually
    width: 2.44,
    height: 2.13,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  },
  'Door - Garage Double': {
    type: 'door',
    subtype: 'garage_double',
    material: 'steel',
    width: 4.88,
    height: 2.13,
    lintelType: 'concrete',
    sillType: 'external_concrete'
  }
} as const

export const WINDOW_LIBRARY = {
  // ALUMINIUM - TOP HUNG (PT)
  'Window - PT66 (600x600)': {
    type: 'window',
    subtype: 'top_hung',
    material: 'aluminium',
    width: 0.6,
    height: 0.6,
    lintelType: 'concrete',
    sillType: 'external_brick'
  },
  'Window - PT69 (600x900)': {
    type: 'window',
    subtype: 'top_hung',
    material: 'aluminium',
    width: 0.6,
    height: 0.9,
    lintelType: 'concrete',
    sillType: 'external_brick'
  },
  'Window - PT99 (900x900)': {
    type: 'window',
    subtype: 'top_hung',
    material: 'aluminium',
    width: 0.9,
    height: 0.9,
    lintelType: 'concrete',
    sillType: 'external_brick'
  },
  'Window - PT129 (1200x900)': {
    type: 'window',
    subtype: 'top_hung',
    material: 'aluminium',
    width: 1.2,
    height: 0.9,
    lintelType: 'concrete',
    sillType: 'external_brick'
  },
  'Window - PT1512 (1500x1200)': {
    type: 'window',
    subtype: 'top_hung',
    material: 'aluminium',
    width: 1.5,
    height: 1.2,
    lintelType: 'concrete',
    sillType: 'external_brick'
  },
  'Window - PT1812 (1800x1200)': {
    type: 'window',
    subtype: 'top_hung',
    material: 'aluminium',
    width: 1.8,
    height: 1.2,
    lintelType: 'concrete',
    sillType: 'external_brick'
  },
  
  // STEEL WINDOWS (Standard NE)
  'Window - NE1 (533x359)': {
    type: 'window',
    subtype: 'side_hung',
    material: 'steel',
    width: 0.533,
    height: 0.359,
    lintelType: 'concrete',
    sillType: 'external_brick'
  },
  'Window - NCT1 (533x949)': {
    type: 'window',
    subtype: 'side_hung',
    material: 'steel',
    width: 0.533,
    height: 0.949,
    lintelType: 'concrete',
    sillType: 'external_brick'
  },
  'Window - ND2 (1022x1245)': {
    type: 'window',
    subtype: 'side_hung',
    material: 'steel',
    width: 1.022,
    height: 1.245,
    lintelType: 'concrete',
    sillType: 'external_brick'
  },
  'Window - ND4 (1511x1245)': {
    type: 'window',
    subtype: 'side_hung',
    material: 'steel',
    width: 1.511,
    height: 1.245,
    lintelType: 'concrete',
    sillType: 'external_brick'
  }
} as const
