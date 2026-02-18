import { IWallBOQStrategy, IOpeningDimensions } from './IWallStrategy'
import { Wall } from '../../../application/types'
import { WallConstruction, WallLayer } from '../WallTypes'
import { BOQItem } from '../../../../../core/engine/boq-calculators/types'

export class DrywallStrategy implements IWallBOQStrategy {
    calculate(wall: Wall, construction: WallConstruction, openings: IOpeningDimensions[]): BOQItem[] {
        const items: BOQItem[] = []
        
        const length = wall.length || 0
        const height = wall.height || 2.7
        const grossArea = length * height
        
        const openingsArea = openings.reduce((sum, op) => sum + (op.width * op.height), 0)
        const netArea = Math.max(0, grossArea - openingsArea)
        
        // 1. Tracks (Top and Bottom)
        // Length * 2 (Floor + Ceiling)
        // Deduct openings? Usually floor track stops at doors.
        // Approx: Length * 2 - DoorWidths
        const doorWidths = openings.filter(o => o.type === 'door').reduce((sum, o) => sum + o.width, 0)
        const trackLength = (length * 2) - doorWidths
        
        // Find Frame Layer to determine Stud width
        const frameLayer = construction.layers.find(l => l.type === 'drywall_frame')
        const studSize = frameLayer ? frameLayer.thickness : 64 // default
        
        items.push({
            category: 'Drywall_Structure',
            item: `Galvanized Track ${studSize}mm`,
            description: 'Top and bottom metal tracks',
            quantity: Math.ceil(trackLength / 3.0), // 3m standard lengths
            unit: 'length (3m)',
            rate: 150 // R150 per length
        })
        
        // 2. Studs
        // Spacing: 600mm default (SANS standard for simple partitions)
        const spacing = 0.6
        // Base studs = Length / Spacing + 1 (Starter)
        let studs = Math.ceil(length / spacing) + 1
        
        // Add studs for openings (Jambs x 2 per opening)
        studs += openings.length * 2
        
        // Approx Corners/Junctions: +10%?
        studs = Math.ceil(studs * 1.1)
        
        items.push({
            category: 'Drywall_Structure',
            item: `Galvanized Stud ${studSize}mm`,
            description: `Vertical studs at ${spacing * 1000}mm centers`,
            quantity: studs,
            unit: 'length (2.7m)', // Assuming matches wall height
            rate: 165
        })
        
        // 3. Boards (Cladding)
        construction.layers.forEach(layer => {
            if (layer.type === 'gypsum_board' || layer.type === 'panel') {
                this.calculateBoardLayer(items, layer, netArea, height)
            } else if (layer.type === 'insulation') {
                this.calculateInsulation(items, layer, netArea)
            }
        })
        
        // 4. Sundries (Screws, Tape, Compound)
        // Screws: ~30 per board (1.2x2.7 = 3.24m2). Net Area / 3.24 matches board count logic.
        // Tape: ~1.5m per m2
        // Compound: ~0.5kg per m2
        
        items.push({
            category: 'Drywall_Sundries',
            item: 'Drywall Screws (25mm)',
            description: 'Screws for attaching boards',
            quantity: Math.ceil(netArea * 15), // approx 15 screws/m2 total (both sides often calc'd separately in board layer loop)
            // Wait, calculateBoardLayer iterates PER SIDE layer. checking context...
            // items are pushed dynamically.
            unit: 'no',
            rate: 0.15
        })
        
        items.push({
            category: 'Drywall_Sundries',
            item: 'Joint Tape',
            description: 'Fiber tape for joints',
            quantity: Math.ceil(netArea * 1.5),
            unit: 'm',
            rate: 2.0
        })
        
        items.push({
            category: 'Drywall_Sundries',
            item: 'Joint Compound',
            description: 'Finishing plaster',
            quantity: Math.ceil(netArea * 0.8),
            unit: 'kg',
            rate: 25.0
        })

        return items
    }
    
    private calculateBoardLayer(items: BOQItem[], layer: WallLayer, netArea: number, wallHeight: number) {
        // Board dimensions: 1.2m width. Height usually 2.7m or 3.0m.
        const boardW = 1.2
        const boardH = wallHeight <= 2.7 ? 2.7 : 3.0 // simplistic choice
        
        const boardArea = boardW * boardH
        const numBoards = Math.ceil((netArea * 1.1) / boardArea) // 10% waste
        
        items.push({
            category: 'Drywall_Cladding',
            item: `Gypsum Board ${layer.thickness}mm`,
            description: `Standard ${boardW}x${boardH}m board (Inc 10% waste)`,
            quantity: numBoards,
            unit: 'sheet',
            rate: 180
        })
    }
    
    private calculateInsulation(items: BOQItem[], layer: WallLayer, netArea: number) {
        items.push({
             category: 'Drywall_Insulation',
             item: `Insulation ${layer.thickness}mm`,
             description: 'Cavity insulation',
             quantity: parseFloat(netArea.toFixed(2)),
             unit: 'm2',
             rate: 95.0
        })
    }
}
