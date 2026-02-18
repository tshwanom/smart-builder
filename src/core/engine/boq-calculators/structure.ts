
import { BOQItem } from './types'
import { StructureElementDomain } from '@/modules/structure/domain/StructureTypes'

export const StructureCalculator = {
  calculate(elements: StructureElementDomain[]): BOQItem[] {
    const items: BOQItem[] = []

    elements.forEach((element, index) => {
      switch (element.type) {
        case 'COLUMN':
          items.push(...calculateColumnPoints(element, index))
          break
        case 'BEAM':
          items.push(...calculateBeamPoints(element, index))
          break
        case 'SLAB':
          items.push(...calculateSlabPoints(element, index))
          break
      }
    })

    return items
  }
}

function calculateColumnPoints(col: StructureElementDomain, index: number): BOQItem[] {
  const items: BOQItem[] = []
  const { geometry, profile } = parseColumnData(col)
  
  // 1. Concrete (m3)
  const vol = (profile.area / 1000000) * geometry.height // mm2 to m2 * m
  const concreteVol = vol * 1.05 // +5% Waste

  items.push({
    id: `col-concrete-${index}`,
    category: 'Structural Skeleton',
    item: 'Reinforced Concrete',
    description: `Concrete ${col.mixClass || '30MPa'} in Columns`,
    quantity: parseFloat(concreteVol.toFixed(3)),
    unit: 'm³',
    rate: 1850,
    totalPrice: concreteVol * 1850
  })

  // 2. Formwork (m2)
  const perimeter = profile.perimeter / 1000 // mm to m
  const area = perimeter * geometry.height
  
  items.push({
    id: `col-formwork-${index}`,
    category: 'Structural Skeleton',
    item: 'Formwork',
    description: 'Column Formwork (Vertical)',
    quantity: parseFloat(area.toFixed(2)),
    unit: 'm²',
    rate: 450,
    totalPrice: area * 450
  })

  // 3. Reinforcement (Ton)
  if (col.parsedRebar) {
      const mass = col.parsedRebar.totalMass || estimateRebarMass(vol, 150) // 150kg/m3 default
      items.push({
        id: `col-rebar-${index}`,
        category: 'Structural Skeleton',
        item: 'Reinforcement',
        description: 'High Tensile Steel (Y-Bars)',
        quantity: parseFloat((mass / 1000).toFixed(3)), // Tons
        unit: 'Ton',
        rate: 18500,
        totalPrice: (mass / 1000) * 18500
      })
  }

  return items
}

function calculateBeamPoints(beam: StructureElementDomain, index: number): BOQItem[] {
    // Similar logic for beams (Bottom + Side formwork)
    const items: BOQItem[] = []
    const { geometry, profile } = parseBeamData(beam)

    // Concrete
    const vol = (profile.area / 1000000) * geometry.length
    items.push({
        id: `beam-concrete-${index}`,
        category: 'Structural Skeleton',
        item: 'Reinforced Concrete',
        description: `Concrete ${beam.mixClass || '30MPa'} in Beams`,
        quantity: parseFloat((vol * 1.05).toFixed(3)),
        unit: 'm³',
        rate: 1850,
        totalPrice: vol * 1.05 * 1850
    })

    // Formwork (Sides + Soffit)
    const soffit = profile.width / 1000
    const sides = (profile.depth * 2) / 1000
    const formArea = (soffit + sides) * geometry.length

    items.push({
        id: `beam-formwork-${index}`,
        category: 'Structural Skeleton',
        item: 'Formwork',
        description: 'Beam Formwork (Sides & Soffit)',
        quantity: parseFloat(formArea.toFixed(2)),
        unit: 'm²',
        rate: 550,
        totalPrice: formArea * 550
    })

    return items
}

function calculateSlabPoints(slab: StructureElementDomain, index: number): BOQItem[] {
    // Slab logic
    const items: BOQItem[] = []
    const { area, thickness } = parseSlabData(slab)
    const vol = area * (thickness / 1000)

    items.push({
        id: `slab-concrete-${index}`,
        category: 'Structural Skeleton',
        item: 'Reinforced Concrete',
        description: `Concrete ${slab.mixClass || '25MPa'} in Slabs`,
        quantity: parseFloat((vol * 1.05).toFixed(3)),
        unit: 'm³',
        rate: 1650,
        totalPrice: vol * 1.05 * 1650
    })

    return items
}

// Helpers
function parseColumnData(col: StructureElementDomain) {
    const dimA = col.parsedProfile.dimensions.dimA || 0
    const dimB = col.parsedProfile.dimensions.dimB || dimA
    const height = Math.abs(col.parsedPoints.end.y - col.parsedPoints.start.y) / 1000 // assumption Y is up? or Z?
    // In SVG CAD, usually Y is 2D plane, Z is height? 
    // Need to verify coordinate system. Assuming Z is height for now based on 'ProjectGeometry' usually being 3D-ish 
    const h = Math.abs(col.parsedPoints.end.z - col.parsedPoints.start.z) || 2.7 // fallback
    
    return {
        geometry: { height: h },
        profile: {
            area: dimA * dimB,
            perimeter: (dimA + dimB) * 2,
            width: dimA,
            depth: dimB
        }
    }
}

function parseBeamData(beam: StructureElementDomain) {
    const len = Math.sqrt(
        Math.pow(beam.parsedPoints.end.x - beam.parsedPoints.start.x, 2) + 
        Math.pow(beam.parsedPoints.end.y - beam.parsedPoints.start.y, 2)
    ) / 1000 // m

    const dimA = beam.parsedProfile.dimensions.width || 230
    const dimB = beam.parsedProfile.dimensions.depth || 300

    return {
        geometry: { length: len },
        profile: {
            area: dimA * dimB,
            width: dimA,
            depth: dimB
        }
    }
}

function parseSlabData(slab: StructureElementDomain) {
    // Polygon area calc needed
    // For now assuming 'profile.dimensions.area' might be pre-calculated or simple rect
    return {
        area: slab.parsedProfile.properties?.area || 0, // Fallback
        thickness: slab.parsedProfile.dimensions.thickness || 170
    }
}

function estimateRebarMass(volM3: number, factor: number): number {
    return volM3 * factor
}
