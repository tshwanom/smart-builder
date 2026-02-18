import { WallStructure } from '../../../domain/types'
import { MaterialDatabase } from '../../../application/services/MaterialDatabase'
import { BOQItem } from './types'
import { WallConstruction } from '@/modules/canvas/domain/wall/WallTypes'
import { MasonryStrategy } from '@/modules/canvas/domain/wall/strategies/MasonryStrategy'
import { DrywallStrategy } from '@/modules/canvas/domain/wall/strategies/DrywallStrategy'
import { Wall } from '@/modules/canvas/application/types'

const STANDARD_JOINT = 10 // mm

export const WallCalculator = {
  
  calculateThickness: (structure: WallStructure): number => {
    // ... existing implementation remains as fallback ...
    let thickness = 0
    // DRY WALL
    if (structure.type === 'drywall' && structure.drywall) {
        thickness = structure.drywall.studSize + 24
        return thickness
    }
    // ICF
    if (structure.type === 'icf' && structure.icf) {
        return structure.icf.coreWidth + 130
    }
    // MASONRY (Legacy Structure)
    if (structure.skins) {
        structure.skins.forEach(skin => {
            const material = MaterialDatabase.getMaterial(skin.materialId)
            if (material && material.category === 'masonry_unit') {
                // @ts-ignore
                const dim = material.dimensions
                if (skin.orientation === 'stretcher') {
                    thickness += dim.width
                } else if (skin.orientation === 'header') {
                    thickness += dim.length
                }
            }
        })
        if (structure.type === 'masonry' && structure.cavityWidth) {
            thickness += (structure.cavityWidth || 50)
        } else if (structure.type === 'masonry' && structure.skins.length > 1) {
            thickness += STANDARD_JOINT * (structure.skins.length - 1)
        }
    }
    // Plaster
    if (structure.plaster) {
        if (structure.plaster.internal) thickness += structure.plaster.thickness
        if (structure.plaster.external) thickness += structure.plaster.thickness
    }
    return thickness
  },

  createDefaultDoubleSkin: (): WallStructure => ({
      type: 'masonry',
      skins: [
          { materialId: 'brick_clay_stock', orientation: 'stretcher' },
          { materialId: 'brick_clay_stock', orientation: 'stretcher' }
      ],
      cavityWidth: 50,
      plaster: {
          internal: 'plaster_smooth',
          external: 'plaster_smooth',
          thickness: 15
      }
  }),

  createDefaultSingleSkin: (): WallStructure => ({
      type: 'masonry',
      skins: [
          { materialId: 'brick_clay_stock', orientation: 'stretcher' }
      ],
      plaster: {
          internal: 'plaster_smooth',
          external: 'plaster_smooth',
          thickness: 15
      }
  }),

  createDefaultDrywall: (): WallStructure => ({
      type: 'drywall',
      drywall: {
          studSize: 64,
          studSpacing: 600,
          boardType: 'gypsum_12mm',
          insulation: true
      }
  }),

  getDescription: (structure: WallStructure): string => {
     if (structure.type === 'drywall' && structure.drywall) {
         return `Drywall ${structure.drywall.studSize}mm Stud`
     }
     if (structure.type === 'icf' && structure.icf) {
         return `ICF Wall ${structure.icf.coreWidth}mm Core`
     }
     
     if (!structure.skins || structure.skins.length === 0) return 'Unknown Wall'

     const skinCount = structure.skins.length
     const firstSkin = MaterialDatabase.getMaterial(structure.skins[0].materialId)
     const typeName = firstSkin ? firstSkin.name : 'Unknown Brick'
     
     let typeDesc = 'Single Skin'
     if (skinCount === 2) {
         typeDesc = (structure.type === 'masonry' && structure.cavityWidth) ? 'Cavity Wall' : 'Double Skin'
     }
     
     return `${typeDesc} - ${typeName}`
  },

  /**
   * Calculates BOQ Items for a wall segment
   */
  calculateWallItems: (
      netArea: number, 
      length: number, 
      height: number, 
      structure: WallStructure,

      construction?: WallConstruction,
      openings?: import('../../../modules/canvas/domain/wall/strategies/IWallStrategy').IOpeningDimensions[]
  ): BOQItem[] => {
      
      // Feature Flag / Priority: If construction is present, use New Strategies
      if (construction && openings) {
          // Construct a mock Wall object for the strategy
          const mockWall: any = { length, height } 
          
          if (construction.category === 'masonry') {
              const strategy = new MasonryStrategy()
              return strategy.calculate(mockWall, construction, openings)
          } else if (construction.category === 'drywall') {
              const strategy = new DrywallStrategy()
              return strategy.calculate(mockWall, construction, openings)
          }
          // Fallback or other categories
      }

      const items: BOQItem[] = []

      if (structure.type === 'drywall') {
          return calculateDrywall(netArea, length, height, structure)
      }
      
      if (structure.type === 'icf') {
          return calculateICF(netArea, length, height, structure)
      }
      
      // Default to Masonry
      return calculateMasonry(netArea, structure)
  }
}

function calculateMasonry(area: number, structure: WallStructure): BOQItem[] {
    const items: BOQItem[] = []
    let bricks = 0
    let mortarVolume = 0

    if (structure.skins) {
        structure.skins.forEach(skin => {
            const material = MaterialDatabase.getMaterial(skin.materialId)
            if (material && material.category === 'masonry_unit') {
                let bricksPerM2 = 52 
                if (skin.orientation === 'header') bricksPerM2 = 104
                if (material.id.includes('maxi')) bricksPerM2 = 35
                if (material.id.includes('block')) bricksPerM2 = 12.5

                bricks += area * bricksPerM2
            }
        })
    }
    
    mortarVolume = (bricks / 1000) * 0.5 

    if (bricks > 0) {
        items.push({
            category: 'Superstructure',
            item: 'Masonry Unit',
            quantity: Math.ceil(bricks),
            unit: 'No',
            rate: 2.50, // Should look up metric
            notes: 'Calculated from skin configuration'
        })
    }

    if (mortarVolume > 0) {
        items.push({
            category: 'Superstructure',
            item: 'Mortar',
            quantity: parseFloat(mortarVolume.toFixed(2)),
            unit: 'm³',
            rate: 1200,
            notes: 'Class II'
        })
    }

    // Plaster
    if (structure.plaster) {
        const plasterArea = (structure.plaster.internal ? area : 0) + (structure.plaster.external ? area : 0)
        if (plasterArea > 0) {
            items.push({
                category: 'Finishes',
                item: 'Plaster',
                quantity: parseFloat(plasterArea.toFixed(2)),
                unit: 'm²',
                rate: 85,
                notes: `${structure.plaster.thickness}mm`
            })
        }
    }

    return items
}

function calculateDrywall(area: number, length: number, height: number, structure: WallStructure): BOQItem[] {
    const items: BOQItem[] = []
    const config = structure.drywall
    if (!config) return items

    // 1. Framing
    // Studs @ spacing
    const spacing = config.studSpacing || 600
    const studs = Math.ceil((length * 1000) / spacing) + 2 // + Starters
    
    items.push({
        category: 'Drywall',
        item: `Steel Stud ${config.studSize}mm`,
        quantity: studs * height, // Total length in meters
        unit: 'm',
        rate: config.studSize === 64 ? 28 : 38
    })

    // Track (Top + Bottom)
    items.push({
        category: 'Drywall',
        item: `Steel Track ${config.studSize}mm`,
        quantity: length * 2,
        unit: 'm',
        rate: config.studSize === 64 ? 26 : 35
    })

    // 2. Cladding / Board
    // Area * 2 sides
    const boardArea = area * 2
    // Add waste 10%
    const finalBoardArea = boardArea * 1.1

    items.push({
        category: 'Drywall',
        item: `Gypsum Board 12mm`, // Should lookup config.boardType
        quantity: parseFloat(finalBoardArea.toFixed(2)),
        unit: 'm²',
        rate: 65
    })

    // 3. Insulation
    if (config.insulation) {
        items.push({
            category: 'Drywall',
            item: 'Cavity Insulation 50mm',
            quantity: parseFloat(area.toFixed(2)),
            unit: 'm²',
            rate: 55
        })
    }

    return items
}

function calculateICF(area: number, length: number, height: number, structure: WallStructure): BOQItem[] {
    const items: BOQItem[] = []
    const config = structure.icf
    if (!config) return items

    // 1. Blocks
    // Area / Block Face Area (0.36m2 approx for 1.2x0.3m)
    // 1.2 * 0.3 = 0.36
    const blocks = Math.ceil(area / 0.36)
    
    items.push({
        category: 'ICF',
        item: `ICF Block ${config.coreWidth}mm Core`,
        quantity: blocks,
        unit: 'No',
        rate: 180
    })

    // 2. Concrete Core
    // Area * Core Width
    const vol = area * (config.coreWidth / 1000)
    
    items.push({
        category: 'ICF',
        item: `Concrete 30MPa (Pumped)`,
        quantity: parseFloat(vol.toFixed(2)),
        unit: 'm³',
        rate: 2350
    })

    // 3. Rebar
    // 120kg / m3 typical for ICF or specified pattern
    // Let's est 8kg/m2 of wall
    const rebarMass = area * 8
    
    items.push({
        category: 'ICF',
        item: 'Rebar High Yield',
        quantity: parseFloat(rebarMass.toFixed(2)),
        unit: 'kg',
        rate: 28
    })

    return items
}
