import { Wall, Opening, WallTemplate, WallLayer } from '../../application/types'

export interface Quantities {
    bricks: Record<string, number> // materialId -> count
    sandVolume: number // m3
    cementBags: number // 50kg bags
    plasterVolume: number // m3 (internal/external separability is todo)
    paintArea: number // m2
    tiesCount: number
    dpcLength: number // m
}

export class WallCalculator {
    
    /**
     * Calculates the thickness used for rendering on the canvas.
     * Only sums layers marked as `isStructural`.
     */
    static getVisualThickness(template: WallTemplate): number {
        return template.layers
            .filter(l => l.isStructural)
            .reduce((sum, l) => sum + (l.thickness / 1000), 0) // Convert mm to meters
    }

    /**
     * Calculates detailed material quantities for a wall
     */
    static calculateQuantities(wall: Wall, template: WallTemplate, openings: Opening[] = []): Quantities {
        const wallLength = wall.length || 0
        const wallHeight = wall.height || 2.7
        const grossArea = wallLength * wallHeight
        
        // Calculate opening deductions
        const openingsArea = openings.reduce((sum, op) => sum + (op.width * op.height), 0)
        const netArea = Math.max(0, grossArea - openingsArea)

        const quantities: Quantities = {
            bricks: {},
            sandVolume: 0,
            cementBags: 0, 
            plasterVolume: 0,
            paintArea: 0,
            tiesCount: 0,
            dpcLength: 0
        }

        // 1. DPC (Damp Proof Course) - Linear meters of structural width
        // Usually applied under the structural skins
        if (wallLength > 0) {
            quantities.dpcLength = wallLength
        }

        // 2. Wall Ties
        // Standard rule: 2.5 ties per m2 for cavity walls
        const hasCavity = template.layers.some(l => l.type === 'CAVITY')
        if (hasCavity) {
            quantities.tiesCount = Math.ceil(netArea * 2.5)
        }

        // 3. Process Layers
        for (const layer of template.layers) {
            if (layer.type === 'MASONRY' && layer.material) {
                this.calculateMasonryLayer(layer, netArea, quantities)
            } else if (layer.type === 'FINISH') {
                this.calculateFinishLayer(layer, netArea, quantities)
            }
        }

        return quantities
    }

    private static calculateMasonryLayer(layer: WallLayer, netArea: number, quantities: Quantities) {
        if (!layer.material) return

        // Standard brick dimensions fallback
        const L = layer.material.lengthMm || 222
        const H = layer.material.heightMm || 73
        const W = layer.material.widthMm || 106
        const joint = layer.material.jointThicknessMm || 10

        // Calculate Bricks per m2 with mortar
        // (L + joint) * (H + joint)
        const brickAreaWithMortar = ((L + joint) / 1000) * ((H + joint) / 1000)
        const bricksPerM2 = 1 / brickAreaWithMortar
        
        // Total Bricks (add 5% waste? keeping raw for now)
        const totalBricks = Math.ceil(netArea * bricksPerM2)
        
        // Add to quantities
        const matId = layer.materialId || 'unknown'
        quantities.bricks[matId] = (quantities.bricks[matId] || 0) + totalBricks

        // Mortar Calculation (Volume of joints)
        // Volume = Area * Thickness - Volume of Bricks
        // This is a rough estimation. Better: (L+j)*(H+j)*W - L*H*W
        const wallVol = netArea * (W / 1000)
        const brickVol = totalBricks * (L/1000 * H/1000 * W/1000)
        const mortarVol = Math.max(0, wallVol - brickVol)

        // Convert Mortar Vol to Sand/Cement (Assuming 1:4 ratio approx)
        // 1m3 wet mortar requires ~1.1m3 dry sand and ~0.3 tons cement (6-7 bags)
        // Very rough accumulation
        quantities.sandVolume += mortarVol * 1.1 
        quantities.cementBags += mortarVol * 7 // bags
    }

    private static calculateFinishLayer(layer: WallLayer, netArea: number, quantities: Quantities) {
        // Simple logic derived from layer material name or category
        // TODO: Refine this based on actual material properties
        
        if (layer.thickness > 0) {
            // Plaster (Volume)
            const vol = netArea * (layer.thickness / 1000)
            quantities.plasterVolume += vol
            
            // Plaster also needs Sand/Cement
            // 1m3 plaster ~ 1.1m3 sand + 8 bags cement (richer mix)
            quantities.sandVolume += vol * 1.1
            quantities.cementBags += vol * 8
        } else {
            // Paint (Area) -> thickness usually 0 in template
            quantities.paintArea += netArea
        }
    }
}
