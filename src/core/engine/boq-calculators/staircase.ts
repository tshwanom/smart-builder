import { BOQItem } from './types'
import { Staircase } from '@/modules/canvas/application/types'

export const calculateStaircase = (staircases: Staircase[]): BOQItem[] => {
  const items: BOQItem[] = []

  staircases.forEach(stair => {
      // Basic Geometry
      // Assuming straight stair for now
      // Volume of flight = width * waist_thickness * slope_length + steps volume
      // Simplified: Volume = (width * totalRise * runLength) / 2 is a rough wedge, 
      // but let's be more precise:
      
      const riserHeight = (stair.riserHeight || 175) / 1000 // m
      const treadDepth = stair.treadDepth / 1000 // m
      const width = stair.width / 1000 // m
      const totalRise = stair.totalRise / 1000 // m
      
      const numberOfRisers = Math.round(totalRise / riserHeight)
      const numberOfTreads = numberOfRisers - 1
      const runLength = numberOfTreads * treadDepth
      
      // Concrete Volume
      // 1. Waist slab (approx 150mm thick)
      // Slope length = sqrt(rise^2 + run^2)
      const slopeLength = Math.sqrt(Math.pow(totalRise, 2) + Math.pow(runLength, 2))
      const waistThickness = 0.15 // 150mm
      const waistVolume = width * slopeLength * waistThickness
      
      // 2. Steps (Triangular prisms)
      // Area of one step side = 0.5 * rise * tread
      // Volume of one step = Area * width
      const stepVolume = 0.5 * riserHeight * treadDepth * width * numberOfTreads
      
      const totalConcrete = waistVolume + stepVolume
      
      items.push({
          id: `stair-conc-${stair.id}`,
          category: 'Concrete',
          item: 'Reinforced Concrete (Staircase)',
          description: `30MPa Concrete for staircase ${stair.id.slice(0,4)}`,
          unit: 'm³',
          quantity: parseFloat(totalConcrete.toFixed(2)),
          rate: 2200, // TODO: externalize
          totalPrice: parseFloat((totalConcrete * 2200).toFixed(2)),
          phase: 'structure',
          storyId: stair.storyId
      })
      
      // Formwork
      // Soffit area = width * slopeLength
      // Risers area = width * rise * number
      // Sides area = (Waist side + Steps side) * 2
      
      const soffitArea = width * slopeLength
      const risersFormArea = width * riserHeight * numberOfRisers
      // Side area approx: (0.5 * rise * run + waist_side) * 2 sides
      // Waist side area = slopeLength * waistThickness
      // Total side area roughly = (0.5 * totalRise * runLength + slopeLength * waistThickness) * 2
      const sideArea = (0.5 * totalRise * runLength + slopeLength * waistThickness) * 2
      
      const totalFormwork = soffitArea + risersFormArea + sideArea
      
      items.push({
          id: `stair-form-${stair.id}`,
          category: 'Formwork',
          item: 'Formwork to Staircase',
          description: `Formwork for soffits, risers and sides`,
          unit: 'm²',
          quantity: parseFloat(totalFormwork.toFixed(2)),
          rate: 450,
          totalPrice: parseFloat((totalFormwork * 450).toFixed(2)),
          phase: 'structure',
          storyId: stair.storyId
      })
      
      // Railing
      if (stair.hasRailing) {
          // Railing length approx slope length
          items.push({
              id: `stair-rail-${stair.id}`,
              category: 'Metalwork',
              item: 'Staircase Railing',
              description: 'Stainless steel / Mild steel railing',
              unit: 'm',
              quantity: parseFloat(slopeLength.toFixed(2)),
              rate: 1500,
              totalPrice: parseFloat((slopeLength * 1500).toFixed(2)),
              phase: 'finishes',
              storyId: stair.storyId
          })
      }
      
      // Reinforcement (KG)
      // Approx 100kg / m3
      const rebar = totalConcrete * 100
      items.push({
          id: `stair-rebar-${stair.id}`,
          category: 'Concrete',
          item: 'High Tensile Reinforcement',
          description: 'Y10/Y12 bars for staircase',
          unit: 'kg',
          quantity: parseFloat(rebar.toFixed(2)),
          rate: 18,
          totalPrice: parseFloat((rebar * 18).toFixed(2)),
          phase: 'structure',
          storyId: stair.storyId
      })

  })

  return items
}
