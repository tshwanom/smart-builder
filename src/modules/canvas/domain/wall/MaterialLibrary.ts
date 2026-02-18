import { 
    BrickType, 
    MortarType, 
    PlasterType, 
    TimberStudType, 
    SteelStudType, 
    GypsumBoardType, 
    InsulationType, 
    ICFBlockType,
    WallConstruction 
} from './WallTypes'

// --- Masonry Library (Vol IX) ---

export const BRICK_LIBRARY: BrickType[] = [
    {
        id: 'clay_stock_brick',
        name: 'Clay Stock Brick',
        category: 'clay',
        cost: { unit: 'no', rate: 2.50 },
        dimensions: { length: 222, width: 106, height: 73 },
        coordinating: { length: 232, height: 83 },
        strength: { grade: '7MPa', compressiveStrength: 7 }
    },
    {
        id: 'clay_face_brick',
        name: 'Clay Face Brick (Standard)',
        category: 'clay',
        cost: { unit: 'no', rate: 4.20 },
        dimensions: { length: 222, width: 106, height: 73 },
        coordinating: { length: 232, height: 83 },
        strength: { grade: '10MPa', compressiveStrength: 10 }
    },
    {
        id: 'concrete_block_standard',
        name: 'Concrete Block 140',
        category: 'concrete',
        cost: { unit: 'no', rate: 12.50 },
        dimensions: { length: 390, width: 140, height: 190 },
        coordinating: { length: 400, height: 200 },
        strength: { grade: '7MPa', compressiveStrength: 7 }
    },
    {
        id: 'concrete_block_90',
        name: 'Concrete Block 90',
        category: 'concrete',
        cost: { unit: 'no', rate: 9.20 },
        dimensions: { length: 390, width: 90, height: 190 },
        coordinating: { length: 400, height: 200 },
        strength: { grade: '7MPa', compressiveStrength: 7 }
    }
]

export const MORTAR_LIBRARY: MortarType[] = [
    {
        id: 'class_ii',
        name: 'Class II (1:4)',
        cost: { unit: 'm3', rate: 720 },
        mix: '1:4',
        classification: 'II',
        jointThickness: { typical: 10 }
    }
]

export const PLASTER_LIBRARY: PlasterType[] = [
    {
        id: 'cement_plaster_internal',
        name: 'Internal Cement Plaster',
        cost: { unit: 'm2', rate: 73 },
        mix: '1:4',
        thickness: { typical: 15, min: 10, max: 20 },
        application: 'internal'
    },
    {
        id: 'cement_plaster_external',
        name: 'External Cement Plaster',
        cost: { unit: 'm2', rate: 93 },
        mix: '1:3',
        thickness: { typical: 20, min: 15, max: 25 },
        application: 'external'
    },
    {
        id: 'rhinolite',
        name: 'Rhinolite Skim',
        cost: { unit: 'm2', rate: 80 },
        mix: 'Gypsum',
        thickness: { typical: 3, min: 2, max: 5 },
        application: 'internal'
    }
]


// --- Modern Systems Library (Vol IX-B) ---

export const TIMBER_STUD_LIBRARY: TimberStudType[] = [
    {
        id: 'stud_38x89',
        name: 'Timber Stud 38x89',
        cost: { unit: 'm', rate: 22 },
        dimensions: { width: 38, depth: 89 },
        grade: 'SA_Pine_Grade_5',
        treatment: 'H3'
    },
    {
        id: 'stud_38x114',
        name: 'Timber Stud 38x114',
        cost: { unit: 'm', rate: 28 },
        dimensions: { width: 38, depth: 114 },
        grade: 'SA_Pine_Grade_5',
        treatment: 'H3'
    }
]

export const STEEL_STUD_LIBRARY: SteelStudType[] = [
    {
        id: 'steel_c_92',
        name: 'Steel C-Stud 92mm',
        cost: { unit: 'm', rate: 35 },
        dimensions: { width: 35, depth: 92, thickness: 0.75 },
        profile: 'C_section',
        material: { coating: 'Z275', yieldStrength: 450 }
    }
]

export const GYPSUM_BOARD_LIBRARY: GypsumBoardType[] = [
    {
        id: 'gyp_standard_12.5',
        name: 'Standard Gypsum 12.5mm',
        type: 'standard',
        cost: { unit: 'm2', rate: 50 },
        dimensions: { thickness: 12.5, width: 1200, length: 2400 },
        performance: { fireRating: 30, soundReduction: 28, moistureResistant: false }
    },
    {
        id: 'gyp_fire_15',
        name: 'FireStop Gypsum 15mm',
        type: 'fire_rated',
        cost: { unit: 'm2', rate: 76 },
        dimensions: { thickness: 15, width: 1200, length: 2400 },
        performance: { fireRating: 60, soundReduction: 32, moistureResistant: false }
    }
]

export const INSULATION_LIBRARY: InsulationType[] = [
    {
        id: 'glasswool_75',
        name: 'Glasswool Cavity Batt 75mm',
        material: 'glasswool',
        form: 'batt',
        cost: { unit: 'm2', rate: 45 },
        dimensions: { thickness: 75, width: 600 },
        thermal: { rValue: 1.9, conductivity: 0.04 }
    }
]

export const ICF_LIBRARY: ICFBlockType[] = [
    {
        id: 'icf_250',
        name: 'ICF Standard 250',
        cost: { unit: 'm2', rate: 420 },
        blockDimensions: { length: 1200, height: 300, totalThickness: 250 },
        wallComposition: { coreThickness: 100, insulationThickness: 150 }
    }
]

// --- Standard Wall Constructions (Seeding) ---

export const STANDARD_WALLS: WallConstruction[] = [
    {
        id: 'std_ext_single_230',
        name: 'Standard External Single Skin 230', // Plaster + Brick(222?) + Plaster? Standard SA "230" wall is usually 220 brickwork + plaster
        category: 'masonry',
        standardRef: 'SANS_10400',
        layers: [
            { id: 'l1', sequence: 1, type: 'plaster', thickness: 20, plaster: { typeId: 'cement_plaster_external', coats: 2 } },
            { id: 'l2', sequence: 2, type: 'masonry_skin', thickness: 222, masonry: { materialId: 'clay_stock_brick', bond: 'stretcher', mortarId: 'class_ii', jointThickness: 10 } },
            { id: 'l3', sequence: 3, type: 'plaster', thickness: 15, plaster: { typeId: 'cement_plaster_internal', coats: 1 } }
        ],
        totalThickness: 257, // 20 + 222 + 15
        fireRating: 120,
        acousticRating: 45,
        thermal: { uValue: 2.22, rValue: 0.45 }
    },
    {
        id: 'std_cavity_290',
        name: 'Standard Cavity Wall 290',
        category: 'masonry',
        standardRef: 'SANS_10400',
        layers: [
             { id: 'l1', sequence: 1, type: 'plaster', thickness: 20, plaster: { typeId: 'cement_plaster_external', coats: 2 } },
             { id: 'l2', sequence: 2, type: 'masonry_skin', thickness: 106, masonry: { materialId: 'clay_face_brick', bond: 'stretcher', mortarId: 'class_ii', jointThickness: 10 } },
             { id: 'l3', sequence: 3, type: 'cavity', thickness: 50, cavity: { width: 50, ventilated: true, tiesId: 'butterfly_tie' } },
             { id: 'l4', sequence: 4, type: 'masonry_skin', thickness: 106, masonry: { materialId: 'clay_stock_brick', bond: 'stretcher', mortarId: 'class_ii', jointThickness: 10 } },
             { id: 'l5', sequence: 5, type: 'plaster', thickness: 15, plaster: { typeId: 'cement_plaster_internal', coats: 1 } }
        ],
        totalThickness: 297, // 20 + 106 + 50 + 106 + 15
        fireRating: 180,
        acousticRating: 52,
        thermal: { uValue: 1.5, rValue: 0.6 }
    },
    {
        id: 'drywall_90_steel',
        name: 'Drywall 90mm Steel Frame',
        category: 'drywall',
        standardRef: 'SANS_10400',
        layers: [
            { id: 'l1', sequence: 1, type: 'gypsum_board', thickness: 12.5, gypsumBoard: { boardId: 'gyp_standard_12.5', layers: 1, orientation: 'vertical' } },
            { id: 'l2', sequence: 2, type: 'drywall_frame', thickness: 92, drywallFrame: { studId: 'steel_c_92', spacing: 600 }, insulation: { materialId: 'glasswool_75' } },
            { id: 'l3', sequence: 3, type: 'gypsum_board', thickness: 12.5, gypsumBoard: { boardId: 'gyp_standard_12.5', layers: 1, orientation: 'vertical' } }
        ],
        totalThickness: 117, // 12.5 + 92 + 12.5
        fireRating: 30,
        acousticRating: 40,
        thermal: { uValue: 0.5, rValue: 2.0 }
    }
]
// --- Aggregated Library ---
export const MATERIAL_LIBRARY = {
    bricks: BRICK_LIBRARY,
    mortar: MORTAR_LIBRARY,
    plaster: PLASTER_LIBRARY,
    timberStuds: TIMBER_STUD_LIBRARY,
    steelStuds: STEEL_STUD_LIBRARY,
    gypsumBoards: GYPSUM_BOARD_LIBRARY,
    insulation: INSULATION_LIBRARY,
    icfBlocks: ICF_LIBRARY,
    
    // Helper to find by ID
    getMaterial: (id: string) => {
        const all = [
            ...BRICK_LIBRARY, ...MORTAR_LIBRARY, ...PLASTER_LIBRARY,
            ...TIMBER_STUD_LIBRARY, ...STEEL_STUD_LIBRARY,
            ...GYPSUM_BOARD_LIBRARY, ...INSULATION_LIBRARY, ...ICF_LIBRARY
        ]
        return all.find(m => m.id === id)
    }
}
