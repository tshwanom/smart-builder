import { Point2D } from './CoordinateSystem'
import { WallSegment } from '../../../../domain/types'

export const SelectionLogic = {
    // Distance from point P to segment AB
    distanceToSegment: (p: Point2D, a: Point2D, b: Point2D): number => {
        const x = p.x
        const y = p.y
        const x1 = a.x
        const y1 = a.y
        const x2 = b.x
        const y2 = b.y

        const A = x - x1
        const B = y - y1
        const C = x2 - x1
        const D = y2 - y1

        const dot = A * C + B * D
        const len_sq = C * C + D * D
        let param = -1
        if (len_sq !== 0) // in case of 0 length line
            param = dot / len_sq

        let xx, yy

        if (param < 0) {
            xx = x1
            yy = y1
        }
        else if (param > 1) {
            xx = x2
            yy = y2
        }
        else {
            xx = x1 + param * C
            yy = y1 + param * D
        }

        const dx = x - xx
        const dy = y - yy
        return Math.sqrt(dx * dx + dy * dy)
    },

    // Project point P onto segment AB. Returns the point on segment.
    projectOnSegment: (p: Point2D, a: Point2D, b: Point2D): Point2D => {
        const x = p.x
        const y = p.y
        const x1 = a.x
        const y1 = a.y
        const x2 = b.x
        const y2 = b.y

        const A = x - x1
        const B = y - y1
        const C = x2 - x1
        const D = y2 - y1

        const dot = A * C + B * D
        const len_sq = C * C + D * D
        let param = -1
        if (len_sq !== 0) // in case of 0 length line
            param = dot / len_sq

        let xx, yy

        if (param < 0) {
            xx = x1
            yy = y1
        }
        else if (param > 1) {
            xx = x2
            yy = y2
        }
        else {
            xx = x1 + param * C
            yy = y1 + param * D
        }

        return { x: xx, y: yy }
    },

    hitTestWalls: (point: Point2D, walls: WallSegment[], tolerance: number = 0.2): string | null => {
        for (const wall of walls) {
            if (!wall || !wall.start || !wall.end) continue

            const dist = SelectionLogic.distanceToSegment(
                point,
                { x: wall.start.x, y: wall.start.y },
                { x: wall.end.x, y: wall.end.y }
            )
            if (dist < tolerance) {
                return wall.id
            }
        }
        return null
    },

    getNearestWall: (point: Point2D, walls: WallSegment[], tolerance: number = 0.5): { wall: WallSegment, point: Point2D } | null => {
        let nearestDist = tolerance
        let result = null

        for (const wall of walls) {
             if (!wall || !wall.start || !wall.end) continue

            const dist = SelectionLogic.distanceToSegment(
                point,
                { x: wall.start.x, y: wall.start.y },
                { x: wall.end.x, y: wall.end.y }
            )
            if (dist < nearestDist) {
                nearestDist = dist
                const projected = SelectionLogic.projectOnSegment(
                    point,
                    { x: wall.start.x, y: wall.start.y },
                    { x: wall.end.x, y: wall.end.y }
                )
                result = { wall, point: projected }
            }
        }
        return result
    },

    hitTestOpenings: (point: Point2D, openings: { id: string, center: { x: number, y: number } }[], tolerance: number = 0.5): string | null => {
        for (const opening of openings) {
            const dx = point.x - opening.center.x
            const dy = point.y - opening.center.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < tolerance) {
                return opening.id
            }
        }
        return null
    }
}
