import polygonClipping from 'polygon-clipping';
import { Point } from '../../application/types';

export class PolygonProcessor {
    /**
     * Calculates the signed area of a polygon.
     * Positive for counter-clockwise, negative for clockwise.
     */
    static signedArea(points: Point[]): number {
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return area / 2;
    }
    
    // Alias for signedArea to match usage
    static calculateSignedArea(points: Point[]): number {
        return this.signedArea(points);
    }

    /**
     * Ensures polygon points are in counter-clockwise order (standard for geometric ops).
     */
    static normalizeOrientation(points: Point[]): Point[] {
        if (this.signedArea(points) < 0) {
            return [...points].reverse();
        }
        return points;
    }

    /**
     * Calculates the geometric centroid (center of mass) of a polygon.
     * Uses the area-weighted formula.
     */
    static calculateCentroid(points: Point[]): Point {
        let cx = 0, cy = 0, area = 0;
        const n = points.length;
        
        // If simple triangle or rect, vertex average works, but for general poly:
        for (let i = 0; i < n; i++) {
            const p0 = points[i];
            const p1 = points[(i + 1) % n];
            const cross = p0.x * p1.y - p1.x * p0.y;
            area += cross;
            cx += (p0.x + p1.x) * cross;
            cy += (p0.y + p1.y) * cross;
        }

        area *= 0.5;
        if (Math.abs(area) < 1e-9) {
             // Fallback to vertex average for degenerate polygons
             let sumX = 0, sumY = 0;
             for (const p of points) { sumX += p.x; sumY += p.y; }
             return { x: sumX / n, y: sumY / n };
        }

        cx /= (6 * area);
        cy /= (6 * area);
        return { x: cx, y: cy };
    }
    
    static calculateArea(points: Point[]): number {
        return Math.abs(this.signedArea(points));
    }

    /**
     * offsets a polygon by distance d. 
     * Positive d expands (if CCW), negative contracts.
     * This is a simplified implementation for non-intersecting polygons.
     * For complex roofs, we might need a robust library like polygon-clipping or similar,
     * but for now we implement a basic parallel offset.
     */
    static offsetPolygon(points: Point[], distance: number): Point[] {
        const offsetPoints: Point[] = [];
        const n = points.length;

        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            const p0 = points[(i - 1 + n) % n];

            // Vector p0 -> p1
            const v01 = { x: p1.x - p0.x, y: p1.y - p0.y };
            const len01 = Math.sqrt(v01.x * v01.x + v01.y * v01.y);
            const n0 = { x: -v01.y / len01, y: v01.x / len01 }; // Normal

            // Vector p1 -> p2
            const v12 = { x: p2.x - p1.x, y: p2.y - p1.y };
            const len12 = Math.sqrt(v12.x * v12.x + v12.y * v12.y);
            const n1 = { x: -v12.y / len12, y: v12.x / len12 }; // Normal

            // Average normal (bisector direction)
            // But strict parallel offset requires intersection of parallel lines
            
            // Tangent vectors for the two segments
            // Line 1: P = (p0 + n0*d) + t * v01
            // Line 2: P = (p1 + n1*d) + u * v12
            
            // Intersection of two offset lines:
            // Line 1 point on offset: A = {x: p0.x + n0.x*d, y: p0.y + n0.y*d}
            // Line 1 slope vector: v01
            
            // Line 2 point on offset: B = {x: p1.x + n1.x*d, y: p1.y + n1.y*d}
            // Line 2 slope vector: v12
            
            // We want intersection.
            // Using logic: Corner point P_offset = P_original + (bisector_vector * dist / sin(alpha/2))
            
            // Let's implement intersection of infinite lines approach for robustness
            const O1 = { x: p0.x + n0.x * distance, y: p0.y + n0.y * distance };
            const O2 = { x: p1.x + n0.x * distance, y: p1.y + n0.y * distance }; // Line 1 is O1->O2
            
            const O3 = { x: p1.x + n1.x * distance, y: p1.y + n1.y * distance };
            const O4 = { x: p2.x + n1.x * distance, y: p2.y + n1.y * distance }; // Line 2 is O3->O4
            
            const intersect = this.lineIntersection(O1, O2, O3, O4);
            if (intersect) {
                offsetPoints.push(intersect);
            } else {
                // Parallel lines? Should not happen for valid polygon corners
                offsetPoints.push({ x: p1.x + n0.x * distance, y: p1.y + n0.y * distance });
            }
        }
        
        return offsetPoints;
    }

    static lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
        const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        if (Math.abs(d) < 1e-9) return null; // Parallel

        const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;

        return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
        };
    }

    /**
     * Cleans a polygon by removing duplicate points and collinear vertices.
     * Also ensures counter-clockwise orientation.
     */
    static cleanPolygon(points: Point[], epsilon = 0.001): Point[] {
        if (points.length < 3) return [];

        // 1. Remove consecutive duplicates
        const unique: Point[] = [];
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const prev = unique.length > 0 ? unique[unique.length - 1] : points[points.length - 1];
            
            const dx = p.x - prev.x;
            const dy = p.y - prev.y;
            if (dx * dx + dy * dy > epsilon * epsilon) {
                unique.push(p);
            }
        }
        
        // Handle wrap-around duplicate (first vs last)
        if (unique.length > 2) {
             const first = unique[0];
             const last = unique[unique.length - 1];
             const dx = first.x - last.x;
             const dy = first.y - last.y;
             if (dx * dx + dy * dy < epsilon * epsilon) {
                 unique.pop();
             }
        }

        if (unique.length < 3) return [];

        // 2. Remove collinear points
        const simple: Point[] = [];
        const n = unique.length;
        for (let i = 0; i < n; i++) {
            const p1 = unique[(i - 1 + n) % n];
            const p2 = unique[i];
            const p3 = unique[(i + 1) % n];

            // Check using cross product (area of triangle)
            // (x2-x1)*(y3-y1) - (y2-y1)*(x3-x1)
            const area = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
            
            // If area is essentially zero, points are collinear -> skip p2
            if (Math.abs(area) > epsilon) {
                simple.push(p2);
            }
        }

        return this.normalizeOrientation(simple);
    }
    static distancePointToSegment(p: Point, a: Point, b: Point): number {
        const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (l2 === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
        
        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        
        const px = a.x + t * (b.x - a.x);
        const py = a.y + t * (b.y - a.y);
        
        return Math.sqrt((p.x - px) ** 2 + (p.y - py) ** 2);
    }

    static isSamePoint(p1: Point, p2: Point, epsilon: number): boolean {
        return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
    }

    /**
     * Snap points to a grid to avoid floating point issues during boolean operations.
     */
    static snapPoints(points: Point[], precision: number = 1): Point[] {
        return points.map(p => ({
            x: Math.round(p.x / precision) * precision,
            y: Math.round(p.y / precision) * precision
        }));
    }

    /**
     * Merges multiple polygons into a single set of non-overlapping polygons (Union).
     * Uses polygon-clipping library.
     */
    /**
     * Welds vertices of multiple polygons that are closer than `epsilon`.
     * This fixes floating point gaps and ensures adjacent walls are mathematically identical.
     */
    static weldVertices(polygons: Point[][], epsilon: number): Point[][] {
        // 1. Flatten all points to find clusters
        const allPoints: { x: number, y: number, polyIndex: number, ptIndex: number }[] = [];
        polygons.forEach((poly, polyIdx) => {
            poly.forEach((pt, ptIdx) => {
                allPoints.push({ x: pt.x, y: pt.y, polyIndex: polyIdx, ptIndex: ptIdx });
            });
        });

        const mergedPoints = new Map<number, { x: number, y: number }>(); // index -> new coord
        const visited = new Set<number>();

        for (let i = 0; i < allPoints.length; i++) {
            if (visited.has(i)) continue;

            // Find cluster
            const cluster = [i];
            visited.add(i);
            
            let cx = allPoints[i].x;
            let cy = allPoints[i].y;

            for (let j = i + 1; j < allPoints.length; j++) {
                if (visited.has(j)) continue;
                
                const dx = allPoints[i].x - allPoints[j].x;
                const dy = allPoints[i].y - allPoints[j].y;
                if (dx*dx + dy*dy <= epsilon * epsilon) {
                    cluster.push(j);
                    visited.add(j);
                    cx += allPoints[j].x;
                    cy += allPoints[j].y;
                }
            }

            // Calculate centroid
            const avgX = cx / cluster.length;
            const avgY = cy / cluster.length;

            cluster.forEach(idx => {
                mergedPoints.set(idx, { x: avgX, y: avgY });
            });
        }

        // 2. Reconstruct polygons
        let k = 0;
        return polygons.map((poly) => {
            return poly.map(() => {
                const newPoint = mergedPoints.get(k);
                k++;
                return newPoint || { x: 0, y: 0 };
            });
        });
    }

    /**
     * Merges multiple polygons into a single set of non-overlapping polygons (Union).
     * Uses polygon-clipping library with validation.
     */
    static union(polygons: Point[][]): Point[][] {
        if (!polygons.length) return [];
        
        // Validate and convert
        const validPolys = polygons
            .map(poly => {
                 // Ensure enough points (triangle minimum), and snap to grid for robustness
                 let pts = poly.map(p => ({...p})) // Clone
                 // Heuristic: If coordinates are large (>500), snap to integer (1mm).
                 // If small (meters), snap to 0.001 (1mm).
                 const isMM = pts.some(p => Math.abs(p.x) > 500)
                 const precision = isMM ? 1 : 0.001
                 
                 pts = this.snapPoints(this.cleanPolygon(pts, precision), precision)
                 
                 if (pts.length < 3) return null
                 return [pts.map(p => [p.x, p.y] as [number, number])] // Polygon = [OuterRing]
            })
            .filter(p => p !== null) as import('polygon-clipping').Polygon[]

        if (validPolys.length === 0) return []

        try {
            const result = polygonClipping.union(...(validPolys as unknown as [import('polygon-clipping').Geom, ...import('polygon-clipping').Geom[]])); 
            
            // Convert back
            const output: Point[][] = [];
            for (const poly of result) {
                if (poly.length > 0) {
                    const ring = poly[0];
                    const converted: Point[] = ring.map((coord: [number, number]) => ({ x: coord[0], y: coord[1] }));
                    const cleaned = this.cleanPolygon(converted, 0.001)
                    if (cleaned.length >= 3) output.push(cleaned);
                }
            }
            return output;
        } catch (e) {
            console.warn('[PolygonProcessor] Union failed', e)
            return []
        }
    }

    /**
     * Incremental polygon union — merges one polygon at a time.
     * Much more reliable than batch union for many overlapping shapes.
     * Coordinates are snapped to 1mm grid before processing.
     */
    static incrementalUnion(polygons: Point[][]): Point[][] {
        if (polygons.length === 0) return []

        // Detect coordinate scale
        const isMM = polygons.some(poly => poly.some(p => Math.abs(p.x) > 500))
        const precision = isMM ? 1 : 0.001

        // Prepare: snap + clean all input polygons
        const prepared: import('polygon-clipping').Polygon[] = []
        for (const poly of polygons) {
            let pts = this.snapPoints(poly.map(p => ({...p})), precision)
            pts = this.cleanPolygon(pts, precision)
            if (pts.length < 3) continue
            prepared.push([pts.map(p => [p.x, p.y] as [number, number])])
        }

        if (prepared.length === 0) return []
        if (prepared.length === 1) {
            const ring = prepared[0][0]
            return [ring.map(c => ({ x: c[0], y: c[1] }))]
        }

        // Incrementally accumulate union
        let accumulated: import('polygon-clipping').MultiPolygon = [prepared[0]]

        for (let i = 1; i < prepared.length; i++) {
            try {
                accumulated = polygonClipping.union(
                    accumulated as unknown as import('polygon-clipping').Geom,
                    prepared[i] as unknown as import('polygon-clipping').Geom
                ) as import('polygon-clipping').MultiPolygon
            } catch (e) {
                console.warn(`[PolygonProcessor] Incremental union failed at polygon ${i}`, e)
                // Skip this polygon and continue
            }
        }

        // Convert result back to Point[][]
        const output: Point[][] = []
        for (const poly of accumulated) {
            if (poly.length > 0) {
                const ring = poly[0]
                const converted: Point[] = ring.map((coord: number[]) => ({ x: coord[0], y: coord[1] }))
                const cleaned = this.cleanPolygon(converted, precision)
                if (cleaned.length >= 3) output.push(cleaned)
            }
        }

        return output
    }

    /**
     * Intersects multiple polygons.
     */
    static intersection(poly1: Point[][], poly2: Point[][]): Point[][] {
        if (!poly1 || !poly2 || poly1.length === 0 || poly2.length === 0) return []
        
        // Convert and Validate with Snapping
        const toGeom = (input: Point[][]) => {
            return input.map(ring => {
                let pts = ring.map(p => ({...p}))
                const isMM = pts.some(p => Math.abs(p.x) > 500)
                const precision = isMM ? 1 : 0.001
                pts = this.snapPoints(this.cleanPolygon(pts, precision), precision)
                
                if (pts.length < 3) return null
                return pts.map(p => [p.x, p.y] as [number, number])
            }).filter(ring => ring !== null) as [number, number][][]
        }

        const geom1 = toGeom(poly1)
        const geom2 = toGeom(poly2)

        if (geom1.length === 0 || geom2.length === 0) return []

        // Wrap as MultiPolygons (Polygon[])
        const mp1 = geom1.map(ring => [ring])
        const mp2 = geom2.map(ring => [ring])
        
        try {
            const result = polygonClipping.intersection(
                mp1 as unknown as import('polygon-clipping').MultiPolygon, 
                mp2 as unknown as import('polygon-clipping').MultiPolygon
            );
            
            const output: Point[][] = [];
            for (const poly of result) {
                if (poly.length > 0) {
                    const ring = poly[0];
                    const converted: Point[] = ring.map((coord: [number, number]) => ({ x: coord[0], y: coord[1] }));
                    const cleaned = this.cleanPolygon(converted, 0.001)
                    if (cleaned.length >= 3) output.push(cleaned);
                }
            }
            return output;
        } catch (e) {
             console.warn('[PolygonProcessor] Intersection failed', e)
             return []
        }
    }
    
    /**
     * Difference (Poly1 - Poly2).
     */
    static difference(poly1: Point[][], poly2: Point[][]): Point[][] {
        if (!poly1.length) return []
        if (!poly2.length) return poly1
        
        // Convert and Validate with Snapping
        const toGeom = (input: Point[][]) => {
            return input.map(ring => {
                let pts = ring.map(p => ({...p}))
                // Re-use snapping logic
                const isMM = pts.some(p => Math.abs(p.x) > 500)
                const precision = isMM ? 1 : 0.001
                pts = this.snapPoints(this.cleanPolygon(pts, precision), precision)
                
                if (pts.length < 3) return null
                return pts.map(p => [p.x, p.y] as [number, number])
            }).filter(ring => ring !== null) as [number, number][][]
        }

        const geom1 = toGeom(poly1)
        const geom2 = toGeom(poly2)
        
        if (geom1.length === 0) return []
        if (geom2.length === 0) return poly1

        const mp1 = geom1.map(ring => [ring])
        const mp2 = geom2.map(ring => [ring])
        
        try {
            const result = polygonClipping.difference(
                mp1 as unknown as import('polygon-clipping').MultiPolygon, 
                mp2 as unknown as import('polygon-clipping').MultiPolygon
            );
            
            const output: Point[][] = [];
            for (const poly of result) {
                if (poly.length > 0) {
                    const ring = poly[0];
                    const converted: Point[] = ring.map((coord: [number, number]) => ({ x: coord[0], y: coord[1] }));
                    const cleaned = this.cleanPolygon(converted, 0.001) // 1mm snap
                    if (cleaned.length >= 3) output.push(cleaned);
                }
            }
            return output;
        } catch (e) {
             console.warn('[PolygonProcessor] Difference failed', e)
             return poly1 // Fallback
        }
    }
    /**
     * Decomposes a polygon into convex sub-polygons by splitting at reflex vertices.
     * This produces fewer, better-shaped parts (rectangles) than ear clipping for architectural shapes.
     */
    static decompose(polygon: Point[]): Point[][] {
        const cleaned = this.cleanPolygon(polygon);
        if (cleaned.length < 3) return [];

        if (this.isConvex(cleaned)) {
            return [cleaned];
        }

        // Find a reflex vertex
        const n = cleaned.length;
        let reflexIndex = -1;
        
        for (let i = 0; i < n; i++) {
            const p1 = cleaned[(i - 1 + n) % n];
            const p2 = cleaned[i];
            const p3 = cleaned[(i + 1) % n];
            
            // Cross product z-component
            // Assumes CCW winding. If Right Turn (negative cross), it's reflex.
            const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
            if (cross < -1e-9) {
                reflexIndex = i;
                break;
            }
        }

        if (reflexIndex === -1) return [cleaned];

        // Split Polygon at Reflex Vertex
        const vReflex = cleaned[reflexIndex];
        let bestSplitIndex = -1;
        let minDistSq = Infinity;
        // let bestScore = Infinity; // Not used in the provided snippet

        for (let i = 0; i < n; i++) {
             // Cannot connect to self or immediate neighbors
             if (i === reflexIndex || i === (reflexIndex - 1 + n) % n || i === (reflexIndex + 1) % n) continue;
             
             const vTarget = cleaned[i];
             
             // Check if diagonal is valid (internal)
             if (this.isValidDiagonal(cleaned, reflexIndex, i)) {
                 const distSq = (vReflex.x - vTarget.x)**2 + (vReflex.y - vTarget.y)**2;
                 
                 // Heuristic: Prefer shorter splits, but also prefer splits that align with axis?
                 // For now simple distance.
                 if (distSq < minDistSq) {
                     minDistSq = distSq;
                     bestSplitIndex = i;
                 }
             }
        }

        if (bestSplitIndex !== -1) {
            const poly1: Point[] = [];
            const poly2: Point[] = [];
            
            // Walk from reflex to split
            let curr = reflexIndex;
            while (curr !== bestSplitIndex) {
                poly1.push(cleaned[curr]);
                curr = (curr + 1) % n;
            }
            poly1.push(cleaned[bestSplitIndex]);
            
            // Walk from split to reflex
            curr = bestSplitIndex;
            while (curr !== reflexIndex) {
                poly2.push(cleaned[curr]);
                curr = (curr + 1) % n;
            }
            poly2.push(cleaned[reflexIndex]);
            
            return [...this.decompose(poly1), ...this.decompose(poly2)];
        } else {
             // Fallback
             return [cleaned];
        }
    }

    private static isValidDiagonal(poly: Point[], i: number, j: number): boolean {
        const p1 = poly[i];
        const p2 = poly[j];
        const mid = { x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2 };
        
        // 1. Ray casting: Midpoint must be inside
        if (!this.isPointInPolygon(mid, poly)) return false;
        
        // 2. Check intersection with any other edge ONLY if strictly crossing
        for (let k = 0; k < poly.length; k++) {
            const e1 = poly[k];
            const e2 = poly[(k+1)%poly.length];
            
            // Skip edges sharing endpoints with diagonal
            if (k === i || k === j || (k+1)%poly.length === i || (k+1)%poly.length === j) continue;
            
            if (this.segmentsIntersectStrict(p1, p2, e1, e2)) return false;
        }
        return true;
    }

    static isConvex(polygon: Point[]): boolean {
        if (polygon.length < 3) return false;
        const n = polygon.length;
        let hasPositive = false;
        let hasNegative = false;
        
        for (let i = 0; i < n; i++) {
            const p1 = polygon[(i - 1 + n) % n];
            const p2 = polygon[i];
            const p3 = polygon[(i + 1) % n];
            
            const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
            if (cross > 1e-9) hasPositive = true;
            if (cross < -1e-9) hasNegative = true;
            
            if (hasPositive && hasNegative) return false;
        }
        return true;
    }

    static isPointInPolygon(p: Point, poly: Point[]): boolean {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            
            const intersect = ((yi > p.y) !== (yj > p.y)) &&
                 (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    /**
     * Checks if two line segments (p1-p2) and (q1-q2) intersect strictly (excluding endpoints).
     */
    static segmentsIntersectStrict(p1: Point, p2: Point, q1: Point, q2: Point): boolean {
        const orientation = (a: Point, b: Point, c: Point) => {
            const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
            if (Math.abs(val) < 1e-9) return 0; // colinear
            return (val > 0) ? 1 : 2; // clock or counterclock wise
        };

        const o1 = orientation(p1, p2, q1);
        const o2 = orientation(p1, p2, q2);
        const o3 = orientation(q1, q2, p1);
        const o4 = orientation(q1, q2, p2);

        // General case
        if (o1 !== o2 && o3 !== o4) return true;
        
        return false;
    }

    /**
     * Checks if segment A is a sub-segment of segment B (collinear and contained).
     */
    static isSubSegment(segA: {start: Point, end: Point}, segB: {start: Point, end: Point}, tolerance: number): boolean {
        // 1. Check collinearity (distance from points to line)
        const d1 = this.pointToLineDist(segA.start, segB.start, segB.end);
        const d2 = this.pointToLineDist(segA.end, segB.start, segB.end);
        
        if (d1 > tolerance || d2 > tolerance) return false;
        
        // 2. Check overlap
        // Project onto B's axis
        const dx = segB.end.x - segB.start.x;
        const dy = segB.end.y - segB.start.y;
        const lenSq = dx*dx + dy*dy;
        if (lenSq < 1e-9) return false;
        
        // Dot product projection
        const t1 = ((segA.start.x - segB.start.x) * dx + (segA.start.y - segB.start.y) * dy) / lenSq;
        const t2 = ((segA.end.x - segB.start.x) * dx + (segA.end.y - segB.start.y) * dy) / lenSq;
        
        const minT = Math.min(t1, t2);
        const maxT = Math.max(t1, t2);
        
        // Check if A is roughly within B [0, 1]
        // Allow slight tolerance
        return maxT > -0.01 && minT < 1.01;
    }

    private static pointToLineDist(p: Point, a: Point, b: Point): number {
         const ab = {x: b.x - a.x, y: b.y - a.y}
         const lenSq = ab.x*ab.x + ab.y*ab.y
         if (lenSq < 1e-9) return Math.sqrt((p.x - a.x)**2 + (p.y - a.y)**2)
         
         const cross = Math.abs((b.x - a.x)*(a.y - p.y) - (a.x - p.x)*(b.y - a.y))
         return cross / Math.sqrt(lenSq)
    }
    
    // ... rest of file (isPointInPolygon, segmentsIntersectStrict can be removed or kept)
}
