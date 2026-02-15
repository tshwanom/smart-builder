
import { RoofGenerator } from './src/modules/canvas/domain/geometry/RoofGenerator'
import { Wall } from './src/application/types'

// Mock Data
const room1 = {
    polygon: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
    ],
    hasRoof: true,
    walls: []
}

const room2 = {
    polygon: [
        { x: 11, y: 0 }, // 1m gap
        { x: 21, y: 0 },
        { x: 21, y: 10 },
        { x: 11, y: 10 }
    ],
    hasRoof: true,
    walls: []
}

// Overhang 600mm = 0.6m
// Gap 1m.
// Overhang from Room1 extends 0.6 to x=10.6
// Overhang from Room2 extends 0.6 to x=10.4
// Overlap! Union should merge them.

// Run

import * as fs from 'fs'

const geometry = RoofGenerator.generate([], 30, 0.6, [room1, room2])

let output = ''
const log = (msg: string, ...args: any[]) => {
    output += msg + ' ' + args.join(' ') + '\n'
}

log('Result:', geometry ? 'Generated' : 'Failed')
if (geometry) {
    log('Ridges:', geometry.ridges.length)
    log('Hips:', geometry.hips.length)
    log('Valleys:', geometry.valleys.length)
    log('Eaves:', geometry.eaves.length)
    
    // Check bounding box of eaves
    if (geometry.eaves.length > 0) {
        const allX = geometry.eaves.flatMap(e => [e.start.x, e.end.x])
        const minX = Math.min(...allX)
        const maxX = Math.max(...allX)
        log('Bounding Box X:', minX, maxX)
    }
    
    if (geometry.ridges.length === 1 && geometry.valleys.length === 0) {
        log('SUCCESS: Rooms merged into single long roof.')
    } else {
        log('RESULT: Complex geometry or disjoint.')
    }
}

fs.writeFileSync('test_output.txt', output)

