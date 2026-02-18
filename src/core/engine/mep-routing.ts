import { Point, Room } from '../../modules/canvas/application/types'

export interface ElectricalPoint {
  id: string
  type: 'db_board' | 'socket' | 'switch' | 'light' | 'isolator'
  position: Point
}

export interface WirePath {
    from: Point
    to: Point
    type: 'main' | 'sub' // main = to DB, sub = device to device
    circuitType: 'light' | 'socket' | 'isolator'
}

/**
 * Calculates efficient electrical routing (Daisy-chaining & Switch logic)
 * Now Room-Contextual:
 * - Lights only connect to switches in the same room.
 * - Sockets daisy-chain within rooms before exiting.
 */
export const calculateElectricalRouting = (
    points: ElectricalPoint[],
    dbPoint: ElectricalPoint | undefined,
    rooms: Room[] = []
): WirePath[] => {
    if (!dbPoint) return []

    const paths: WirePath[] = []
    
    // 0. Assign Points to Rooms
    // We create a map of RoomID -> Points[]
    // Points outside any room are treated as "Global/Outside"
    const roomGroups = new Map<string, ElectricalPoint[]>()
    const globalPoints: ElectricalPoint[] = []

    points.forEach(p => {
        // Find which room this point belongs to
        const room = rooms.find(r => isPointInPolygon(p.position, r.polygon))
        if (room) {
            if (!roomGroups.has(room.id)) roomGroups.set(room.id, [])
            roomGroups.get(room.id)?.push(p)
        } else {
            globalPoints.push(p)
        }
    })

    // Helper to process a set of points (either a room or global)
    const processGroup = (groupPoints: ElectricalPoint[], isGlobal: boolean) => {
        const lights = groupPoints.filter(p => p.type === 'light')
        const switches = groupPoints.filter(p => p.type === 'switch')
        const sockets = groupPoints.filter(p => p.type === 'socket')
        const isolators = groupPoints.filter(p => p.type === 'isolator')
        const dbInGroup = groupPoints.find(p => p.type === 'db_board')

        // --- LIGHTING ---
        // 1. Group lights by nearest switch IN THIS GROUP
        const switchGroups = new Map<string, ElectricalPoint[]>()
        switches.forEach(s => switchGroups.set(s.id, []))

        lights.forEach(light => {
            let nearestSwitchId = ''
            let minDist = Infinity
            
            switches.forEach(sw => {
                const dist = getDistance(light.position, sw.position)
                if (dist < minDist) {
                    minDist = dist
                    nearestSwitchId = sw.id
                }
            })

            if (nearestSwitchId) {
                switchGroups.get(nearestSwitchId)?.push(light)
            } else {
                // No switch in room? Route to DB directly (or nearest global switch? For now DB)
                paths.push({ from: light.position, to: dbPoint.position, type: 'main', circuitType: 'light' })
            }
        })

        // Route Switches
        switchGroups.forEach((groupLights, switchId) => {
            const switchPoint = switches.find(p => p.id === switchId)!
            
            // Switch -> DB
            paths.push({ from: dbPoint.position, to: switchPoint.position, type: 'main', circuitType: 'light' })

            // Switch -> Lights (Daisy Chain)
            let currentPos = switchPoint.position
            const unvisited = [...groupLights]

            while (unvisited.length > 0) {
                let nearestIdx = -1
                let minDist = Infinity

                unvisited.forEach((l, idx) => {
                    const dist = getDistance(currentPos, l.position)
                    if (dist < minDist) {
                        minDist = dist
                        nearestIdx = idx
                    }
                })

                if (nearestIdx !== -1) {
                    const target = unvisited[nearestIdx]
                    paths.push({ from: currentPos, to: target.position, type: 'sub', circuitType: 'light' })
                    currentPos = target.position
                    unvisited.splice(nearestIdx, 1)
                }
            }
        })

        // --- SOCKETS ---
        // Daisy chain within room
        if (sockets.length > 0) {
            // Find socket closest to DB (entry point to room)
            let entrySocketIdx = -1
            let minDistToDB = Infinity
            
            sockets.forEach((s, idx) => {
                const dist = getDistance(s.position, dbPoint.position)
                if (dist < minDistToDB) {
                    minDistToDB = dist
                    entrySocketIdx = idx
                }
            })

            if (entrySocketIdx !== -1) {
                // Route DB -> First Socket
                const firstSocket = sockets[entrySocketIdx]
                paths.push({ from: dbPoint.position, to: firstSocket.position, type: 'main', circuitType: 'socket' })

                // Daisy chain the rest
                let currentPos = firstSocket.position
                // Remove first
                const unvisited = [...sockets]
                unvisited.splice(entrySocketIdx, 1)

                while (unvisited.length > 0) {
                    let nearestIdx = -1
                    let minDist = Infinity

                    unvisited.forEach((s, idx) => {
                        const dist = getDistance(currentPos, s.position)
                        if (dist < minDist) {
                            minDist = dist
                            nearestIdx = idx
                        }
                    })

                    if (nearestIdx !== -1) {
                        const target = unvisited[nearestIdx]
                        paths.push({ from: currentPos, to: target.position, type: 'sub', circuitType: 'socket' })
                        currentPos = target.position
                        unvisited.splice(nearestIdx, 1)
                    }
                }
            }
        }
        
        // --- ISOLATORS ---
        isolators.forEach(iso => {
             paths.push({ from: dbPoint.position, to: iso.position, type: 'main', circuitType: 'isolator' })
        })
    }

    // Process all rooms
    roomGroups.forEach((points) => processGroup(points, false))
    // Process global points
    if (globalPoints.length > 0) processGroup(globalPoints, true)

    return paths
}

function getDistance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return Math.sqrt(dx*dx + dy*dy)
}

// Ray-casting algorithm for point in polygon
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y
        const xj = polygon[j].x, yj = polygon[j].y
        
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside
    }
    return inside
}
