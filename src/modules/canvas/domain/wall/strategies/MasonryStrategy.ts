import { IWallBOQStrategy, IOpeningDimensions } from './IWallStrategy'
import { Wall } from '../../../application/types'
import { WallConstruction, WallLayer } from '../WallTypes'
import { BOQItem } from '../../../../../core/engine/boq-calculators/types'
import { MATERIAL_LIBRARY } from '../MaterialLibrary'

export class MasonryStrategy implements IWallBOQStrategy {
    calculate(wall: Wall, construction: WallConstruction, openings: IOpeningDimensions[]): BOQItem[] {
        const items: BOQItem[] = []
        
        // 1. Geometry Calculation
        const length = wall.length || 0
        const height = wall.height || 2.7 // Default height? Story height should be passed ideally.
        const grossArea = length * height
        
        // precise deductions
        const openingsArea = openings.reduce((sum, op) => sum + (op.width * op.height), 0)
        const netArea = Math.max(0, grossArea - openingsArea)

        // 2. Iterate Layers
        construction.layers.forEach(layer => {
            if (layer.type === 'masonry_skin') {
                this.calculateBrickLayer(items, layer, netArea, openings.length)
            } else if (layer.type === 'plaster') {
                this.calculatePlasterLayer(items, layer, netArea)
            } else if (layer.type === 'cavity') {
                this.calculateCavityItems(items, layer, netArea)
            }
        })
        
        // 3. DPC (Damp Proof Course)
        // ... existing DPC logic ...
        items.push({
            category: 'Masonry_Sundries',
            item: 'DPC 375 micron', 
            description: `Damp Proof Course under wall (${construction.totalThickness}mm width)`,
            quantity: parseFloat(length.toFixed(2)),
            unit: 'm',
            rate: 15.50 
        })

        return items
    }

    private calculateBrickLayer(items: BOQItem[], layer: WallLayer, netArea: number, openingCount: number) {
        // Find material definition
        const matId = layer.masonry?.materialId || 'brick_clay_stock'
        // We'd look this up in MATERIAL_LIBRARY if needed for dimensions
        // Hardcoding standard parameters for Volume IX compliance for now, or using material props.
        
        // Standard SANS 10400 dimensions
        const L = 222
        const H = 73
        const W = 106 // layer.thickness should match this
        const joint = 10

        // Bricks per m2 = 1 / ((L+j)*(H+j))
        // (0.232 * 0.083) = 0.019256 m2 per brick
        // 1 / 0.019256 = ~51.9 bricks/m2
        const bricksPerM2 = 1 / (((L + joint) / 1000) * ((H + joint) / 1000))
        
        // Waste factor: 5% (Volume IX)
        const waste = 1.05
        const totalBricks = Math.ceil(netArea * bricksPerM2 * waste)
        
        items.push({
            category: 'Masonry_Bricks',
            item: `Bricks (${matId})`,
            description: 'Standard clay stock bricks including 5% waste',
            quantity: totalBricks,
            unit: 'no',
            rate: 2.50 // R2.50 per brick
        })
        
        // Mortar Calculation
        // Volume of 1 brick = L*H*W
        // Volume of 1 brick space in wall = (L+j)*(H+j)*W
        // Mortar per brick = Space - Brick
        const brickVol = (L * H * W) / 1e9 // m3
        const spaceVol = ((L + joint) * (H + joint) * W) / 1e9 // m3
        const mortarPerBrick = spaceVol - brickVol
        
        const totalMortarVol = totalBricks * mortarPerBrick // m3
        
        // Sand & Cement (Class II Mortar - 1:6 ratio by volume? Or 1:4?)
        // Volume IX typically specifies Class II (1:6) for general, Class I (1:4) for structural.
        // Using 1:6 (Wheelbarrows) -> 1 bag cement (50kg) + 3 wheelbarrows sand?
        // 1m3 Mortar requires approx:
        // 1.1 m3 Sand
        // 6.0 bags Cement (for 1:6)
        
        items.push({
            category: 'Masonry_Materials',
            item: 'Building Sand',
            description: 'Sand for mortar',
            quantity: parseFloat((totalMortarVol * 1.1).toFixed(2)),
            unit: 'm3',
            rate: 450
        })
        
        items.push({
            category: 'Masonry_Materials',
            item: 'Cement (50kg)',
            description: 'Cement for mortar (Class II)',
            quantity: Math.ceil(totalMortarVol * 6.0),
            unit: 'bag',
            rate: 110
        })
        
        // Brickforce (Reinforcement)
        // Usually every 4-5 courses.
        // 5 courses = 5 * 85mm = ~425mm vertical spacing
        // Total Length = (Height / 0.425) * Length
        const courses = Math.ceil(2.7 / 0.425) // approx 7 rows
        const brickforceLen = length * courses
        
        items.push({
            category: 'Masonry_Sundries',
            item: 'Brickforce 150mm', // Matching wall thickness approx
            description: 'Reinforcement every 5 courses',
            quantity: parseFloat(brickforceLen.toFixed(1)),
            unit: 'm',
            rate: 8.50
        })
    }

    private calculatePlasterLayer(items: BOQItem[], layer: WallLayer, netArea: number) {
        // Plaster logic
        const thick = layer.thickness // mm
        // Volume = Area * Thickness
        const vol = netArea * (thick / 1000)
        
        // 1m3 Plaster (1:6)
        // Sand: 1.1 m3
        // Cement: 6 bags
        
        items.push({
            category: 'Masonry_Materials',
            item: 'Plaster Sand',
            description: `Sand for ${thick}mm plaster`,
            quantity: parseFloat((vol * 1.1).toFixed(2)),
            unit: 'm3',
            rate: 480
        })

        items.push({
            category: 'Masonry_Materials',
            item: 'Cement (Plaster)',
            description: `Cement for ${thick}mm plaster`,
            quantity: Math.ceil(vol * 6),
            unit: 'bag',
            rate: 110
        })
    }
    
    private calculateCavityItems(items: BOQItem[], layer: WallLayer, netArea: number) {
        // Wall Ties
        // SANS: 2.5 ties/m2 (or 3/m2 near openings)
        const count = Math.ceil(netArea * 2.5)
        
        items.push({
             category: 'Masonry_Sundries',
             item: 'Wall Ties (Butterfly)',
             description: 'Ties for cavity wall',
             quantity: count,
             unit: 'no',
             rate: 1.50
        })
    }
}
