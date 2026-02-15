/**
 * Opening Calculator - PARAMETRIC VERSION
 * Calculates Frame, Glazing, Lintel, Sill, Tracks, and Panel-based components
 */

import { BOQItem, Opening } from './types'

export function calculateOpenings(openings: Opening[]): BOQItem[] {
  const items: BOQItem[] = []

  if (openings.length === 0) return items

  // 1. FRAMES & GLAZING - WITH PARAMETRIC PANEL SUPPORT
  openings.forEach(op => {
    // Apply defaults for parametric fields
    const panels = op.panels ?? (
      op.subtype === 'folding' ? 4 :
      op.subtype === 'sliding' ? 2 :
      op.type === 'window' ? 1 :
      1
    )
    const frameThickness = op.frameThickness ?? 0.05
    const panelWidth = op.width / panels
    
    // Calculate glass area per panel
    const glassAreaPerPanel = (panelWidth - 2 * frameThickness) * (op.height - 2 * frameThickness)
    const totalGlassArea = panels * glassAreaPerPanel
    
    // Format description with panel count
    const panelText = panels > 1 ? `${panels}-panel ` : ''
    const desc = `${op.material ? capitalize(op.material) : 'Std'} ${panelText}${capitalize(op.subtype || op.type)} ${op.type === 'window' ? 'Window' : 'Door'}`
    const size = `(${op.width}m x ${op.height}m)`

    items.push({
      category: op.type === 'window' ? 'Windows' : 'Doors',
      item: `${desc} ${size}`,
      quantity: 1,
      unit: 'unit',
      notes: `Complete unit with ${op.glazing || 'standard'} glazing${panels > 1 ? `, ${panels} panels` : ''}`
    })
    
    // Glass calculation (panel-aware)
    items.push({
      category: op.type === 'window' ? 'Windows - Glass' : 'Doors - Glass',
      item: `${op.glazing || 'Standard'} Glass`,
      quantity: parseFloat(totalGlassArea.toFixed(2)),
      unit: 'm²',
      notes: `${panels} panel${panels > 1 ? 's' : ''}, each ${(panelWidth * 1000).toFixed(0)}mm wide`
    })
    
    // Track system for sliding/folding
    if (op.subtype === 'sliding' || op.subtype === 'folding') {
      items.push({
        category: op.type === 'window' ? 'Windows - Components' : 'Doors - Components',
        item: `${capitalize(op.subtype)} Track System`,
        quantity: op.width,
        unit: 'm',
        notes: `${panels}-panel ${op.subtype} track`
      })
      
      // Hinges for folding panels
      if (op.subtype === 'folding') {
        items.push({
          category: op.type === 'window' ? 'Windows - Components' : 'Doors - Components',
          item: 'Panel Hinges',
          quantity: panels * 2, // Top and bottom per panel
          unit: 'units',
          notes: `${panels} panels × 2 hinges`
        })
      }
    }

    // Frames usually need lugs/screws for installation
    items.push({
      category: op.type === 'window' ? 'Windows' : 'Doors',
      item: 'Installation Fixings',
      quantity: 1,
      unit: 'pack',
      notes: 'Screws/Lugs/Foam'
    })
    
    // 3. IRONMONGERY & ACCESSORIES
    // Internal Doors (Hollow Core)
    if (op.subtype === 'single' && op.material !== 'aluminium' && op.material !== 'steel') {
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Internal Door Lock (2 Lever)',
        quantity: 1,
        unit: 'unit',
        notes: 'Chrome/Brass finish'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Door Handles (Lever Pair)',
        quantity: 1,
        unit: 'pair',
        notes: 'Internal plate handles'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Butt Hinges (100mm)',
        quantity: 1,
        unit: 'pair',
        notes: 'Steel/Brass'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Door Stop',
        quantity: 1,
        unit: 'unit',
        notes: 'Floor/Wall mounted'
      })
    }

    // External Doors (Solid Wood)
    if ((op.subtype === 'single' || op.subtype === 'stable') && op.sillType?.includes('external')) {
      items.push({
        category: 'Doors - Ironmongery',
        item: 'External Door Lock (3 Lever/Cylinder)',
        quantity: 1,
        unit: 'unit',
        notes: 'Security lockset'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'External Door Handles (Lever Pair)',
        quantity: 1,
        unit: 'pair',
        notes: 'Solid brass/stainless steel'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Heavy Duty Hinges (100mm)',
        quantity: 1.5, // 3 hinges per door
        unit: 'pair',
        notes: 'Brass/Stainless Steel (3 per door)'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Weather Bar / Threshold',
        quantity: 1,
        unit: 'unit',
        notes: 'To prevent water ingress'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Cabin Hook',
        quantity: 1,
        unit: 'unit',
        notes: 'To hold door open'
      })
    }

    // Aluminium Doors (Hinge)
    if (op.material === 'aluminium' && (op.subtype === 'single' || op.subtype === 'double')) {
      const qty = op.subtype === 'double' ? 2 : 1
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Aluminium Door Lockset (Cylinder)',
        quantity: 1,
        unit: 'unit',
        notes: 'Includes cylinder and keys'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Aluminium Lever Handles',
        quantity: 1,
        unit: 'pair',
        notes: 'Matching frame colour'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Door Stop',
        quantity: qty,
        unit: 'unit'
      })
    }

    // Pivot Doors
    if (op.subtype === 'pivot') {
       items.push({
        category: 'Doors - Ironmongery',
        item: 'Pivot Hinge Mechanism',
        quantity: 1,
        unit: 'set',
        notes: 'Top and bottom pivot set'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Large Pull Handle (Stainless Steel)',
        quantity: 1,
        unit: 'unit',
        notes: 'External pull handle'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Roller Catch / Deadbolt',
        quantity: 1,
        unit: 'unit',
        notes: 'Locking mechanism'
      })
    }

    // Sliding/Folding Doors
    if (op.subtype === 'sliding' || op.subtype === 'folding') {
       items.push({
        category: 'Doors - Ironmongery',
        item: 'Sliding/Folding Lockset (Hook Lock)',
        quantity: 1,
        unit: 'unit',
        notes: 'Security hook bolt'
      })
      items.push({
        category: 'Doors - Ironmongery',
        item: 'Flush Pull Handles',
        quantity: 1,
        unit: 'pair',
        notes: 'Recessed handles'
      })
    }

    // Garage Doors
    if (op.subtype?.includes('garage')) {
      items.push({
        category: 'Garage Doors',
        item: 'Garage Door Motor (Automation)',
        quantity: 1,
        unit: 'unit',
        notes: 'Includes track and chain/belt'
      })
      items.push({
        category: 'Garage Doors',
        item: 'Remote Controls',
        quantity: 2,
        unit: 'units',
        notes: 'Handheld remotes'
      })
      items.push({
        category: 'Garage Doors',
        item: 'Emegency Key Release',
        quantity: 1,
        unit: 'unit',
        notes: 'In case of power failure'
      })
    }

    // Windows
    if (op.type === 'window') {
      const handleCount = Math.max(1, Math.floor(op.width / 0.6)) // approx 1 handle per 600mm width section
      
      items.push({
        category: 'Windows - Ironmongery',
        item: `${op.material === 'aluminium' ? 'Aluminium' : 'Steel'} Window Handle`,
        quantity: handleCount,
        unit: 'unit',
        notes: 'Matching frame colour'
      })
      
      items.push({
        category: 'Windows - Ironmongery',
        item: 'Window Stay (Peg/Sliding)',
        quantity: handleCount,
        unit: 'unit',
        notes: 'To hold window open'
      })
    }

  })

  // 2. LINTELS & SILLS
  const lintelItems = calculateLintels(openings)
  items.push(...lintelItems)

  return items
}

function calculateLintels(openings: Opening[]): BOQItem[] {
  const items: BOQItem[] = []
  
  openings.forEach(op => {
    // Lintel selection logic
    // Rule of thumb: Span + 300mm bearing each side
    const lintelLength = op.width + 0.6 
    
    // Lintel Profile (Deep lintels for wide spans)
    let lintelProfile = '110x75mm'
    if (op.width > 2.5) lintelProfile = '110x150mm (Deep)'
    
    items.push({
      category: 'Lintels',
      item: `Precast Concrete Lintel ${lintelProfile}`,
      quantity: parseFloat(lintelLength.toFixed(2)),
      unit: 'm',
      notes: `For ${op.width}m opening`
    })

    // DPC for wide openings?
    if (op.width > 1.5) {
       items.push({
        category: 'Lintels',
        item: 'Lintel DPC',
        quantity: parseFloat(lintelLength.toFixed(2)),
        unit: 'm',
        notes: 'Damp proofing over lintel'
      })
    }
  })

  // Padstones
  if (openings.length > 0) {
    items.push({
      category: 'Lintels',
      item: 'Concrete Padstones',
      quantity: openings.length * 2,
      unit: 'units',
      notes: 'Lintel bearing'
    })
  }

  return items
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
