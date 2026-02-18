/**
 * Foundation Calculator
 * Handles SANS 10400-H compliant foundation calculations
 */

import { BOQItem } from './types'
import { FoundationStructure, SoilClass, DesignMode, RebarSpec } from '../../../domain/types'
import { MaterialDatabase } from '../../../application/services/MaterialDatabase'

const SANS_TABLES = {
  foundingDepth: {
    'H1': 750,
    'H2': 900,
    'H3': 1200,
    'H4': 1500,
    'S': 450,
    'custom': 0
  },
  bearingCapacity: {
    'H1': 200,
    'H2': 150,
    'H3': 100,
    'H4': 75,
    'S': 500,
    'custom': 0
  },
  minWidth: 450,
  minDepth: 300,
  minConcreteClass: 'conc_20mpa'
}

export function calculateFoundation(
  wallLength: number,
  structure: FoundationStructure
): BOQItem[] {
  const items: BOQItem[] = []
  
  // Deterministic parameters based on mode
  let width = structure.width
  let depth = structure.depth
  let excavationDepth = structure.foundingLevel
  
  if (structure.designMode === 'standard' && structure.soilClass !== 'custom') {
    // Enforce SANS minimums in Standard Mode
    const minDepth = SANS_TABLES.foundingDepth[structure.soilClass]
    excavationDepth = Math.max(structure.foundingLevel, minDepth)
    width = Math.max(structure.width, SANS_TABLES.minWidth)
    depth = Math.max(structure.depth, SANS_TABLES.minDepth)
  }

  // 1. EXCAVATION
  // Allow 300mm working space either side
  const excavWidth = (width / 1000) + 0.6 
  const excavVol = wallLength * excavWidth * (excavationDepth / 1000)
  
  items.push({
    category: 'Foundation - Excavation',
    item: `Excavation (${structure.soilClass})`,
    quantity: parseFloat(excavVol.toFixed(2)),
    unit: 'm³',
    notes: `Depth: ${excavationDepth}mm, Width: ${Math.round(excavWidth*1000)}mm`
  })

  // Risk of collapse / cartel logic? (Optional SANS requirement for deep trenches)
  if (excavationDepth > 1500) {
    items.push({
      category: 'Foundation - Safety',
      item: 'Planking and Strutting',
      quantity: parseFloat((wallLength * excavationDepth / 1000 * 2).toFixed(2)),
      unit: 'm²',
      notes: 'Deep excavation support'
    })
  }
  
  // 2. CONCRETE
  const concVol = wallLength * (width / 1000) * (depth / 1000)
  const waste = 1.05 // 5%
  const totalConcVol = concVol * waste
  
  // Concrete Grade
  const concGrade = structure.concrete.grade // e.g., '20MPa'
  const concMatId = `conc_${concGrade.toLowerCase().replace('mpa', 'mpa')}` || 'conc_20mpa'
  const concMat = MaterialDatabase.getMaterial(concMatId)
  
  items.push({
    category: 'Foundation - Concrete',
    item: concMat ? concMat.name : `Concrete ${concGrade}`,
    quantity: parseFloat(totalConcVol.toFixed(2)),
    unit: 'm³',
    notes: `Width: ${width}mm, Depth: ${depth}mm`
  })
  
  // 3. REINFORCEMENT
  if (structure.reinforcement) {
    // Bottom Bars
    if (structure.reinforcement.bottomBars) {
      calculateRebar(items, wallLength, structure.reinforcement.bottomBars, 'Bottom')
    }
    
    // Top Bars
    if (structure.reinforcement.topBars) {
        calculateRebar(items, wallLength, structure.reinforcement.topBars, 'Top')
    }
    
    // Starter Bars
    if (structure.reinforcement.starterBars) {
      const spec = structure.reinforcement.starterBars
      const spacing = spec.spacing || 600
      const count = Math.ceil(wallLength * 1000 / spacing)
      const length = spec.length || 600 // mm
      
      const barMat = getRebarMaterial(spec.size)
      if (barMat) {
         const totalLength = count * (length / 1000)
         const mass = totalLength * barMat.massPerMeter * 1.05 // 5% waste
         items.push({
           category: 'Foundation - Reinforcement',
           item: `Starter Bars ${spec.size} @ ${spacing}mm`,
           quantity: parseFloat(mass.toFixed(2)),
           unit: 'kg',
           notes: `${count} bars, ${length}mm long`
         })
      }
    }
  }

  // 4. FORMWORK
  const formworkArea = wallLength * (depth / 1000) * 2 // Both sides
  items.push({
    category: 'Foundation - Formwork',
    item: 'Timber Formwork to Sides',
    quantity: parseFloat(formworkArea.toFixed(2)),
    unit: 'm²',
    notes: 'Sides of strip footing'
  })

  return items
}

function calculateRebar(items: BOQItem[], wallLength: number, spec: RebarSpec, location: string) {
    const bars = spec.quantity || 2 // Default 2 bars if not specified
    const totalLength = wallLength * bars
    
    const mat = getRebarMaterial(spec.size)
    if (mat) {
        // Laps: Allow 50d lap every 6m
        const laps = Math.ceil(totalLength / 6)
        const lapLength = (mat.diameter * 50 / 1000) * laps
        
        const finalLength = totalLength + lapLength
        const mass = finalLength * mat.massPerMeter
        
        items.push({
            category: 'Foundation - Reinforcement',
            item: `${location} Reinforcement ${spec.size}`,
            quantity: parseFloat(mass.toFixed(2)),
            unit: 'kg',
            notes: `${bars} bars, ${spec.spacing ? '@ ' + spec.spacing + 'mm' : ''}`
        })
    }
}

function getRebarMaterial(size: string) {
    // Map Y12 to rebar_y12
    const id = `rebar_${size.toLowerCase()}`
    return MaterialDatabase.getMaterial(id) as import('../../../domain/materialTypes').ReinforcementMaterial | undefined
}
