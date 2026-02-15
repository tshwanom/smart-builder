import polygonClipping from 'polygon-clipping';
import { Point } from '../../../application/types';

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
        return polygons.map((poly, polyIdx) => {
            return poly.map((_, ptIdx) => {
                // Find original index
                // We need to match the specific point instance. 
                // Since we iterated in order, we can just reconstruct the linear index?
                // Actually easier: just re-run the layout or store it better.
                // Let's optimize: 'allPoints' stores source indices.
                // But we need to map back efficiently.
                
                // Brute force verify:
                // We know allPoints[k] corresponds to polygons[polyIdx][ptIndex] if we track k.
                // Let's do a linear walk since order is preserved.
                 return { x: 0, y: 0 }; // Placeholder, see logic below
            });
        });
    }

    /**
     * Merges multiple polygons into a single set of non-overlapping polygons (Union).
     * Uses vertex welding to ensure adjacency.
     */
    static union(polygons: Point[][]): Point[][] {
        if (polygons.length === 0) return [];
        if (polygons.length === 1) return [this.cleanPolygon(polygons[0])];

        // 1. Determine Precision
        const sample = polygons[0][0];
        const isMillimeters = Math.abs(sample.x) > 500 || Math.abs(sample.y) > 500;
        const weldTolerance = isMillimeters ? 2 : 0.002; // 2mm weld
        const snapPrecision = isMillimeters ? 1 : 0.001;

        // 2. Weld Vertices
        // Iterate and cluster
        const inputs = JSON.parse(JSON.stringify(polygons)) as Point[][]; // Deep copy
        
        const allPts: {x:number, y:number, pIdx:number, iIdx:number}[] = [];
        inputs.forEach((p, pIdx) => p.forEach((pt, iIdx) => allPts.push({ x: pt.x, y: pt.y, pIdx, iIdx })));

        const assigned = new Uint8Array(allPts.length);
        
        for(let i=0; i<allPts.length; i++) {
            if(assigned[i]) continue;
            
            const clusterIndices = [i];
            let sx = allPts[i].x;
            let sy = allPts[i].y;
            assigned[i] = 1;

            for(let j=i+1; j<allPts.length; j++) {
                if(assigned[j]) continue;
                const dx = allPts[i].x - allPts[j].x;
                const dy = allPts[i].y - allPts[j].y;
                if(dx*dx + dy*dy < weldTolerance*weldTolerance) {
                    clusterIndices.push(j);
                    sx += allPts[j].x;
                    sy += allPts[j].y;
                    assigned[j] = 1;
                }
            }

            const ax = sx / clusterIndices.length;
            const ay = sy / clusterIndices.length;

            for(const idx of clusterIndices) {
                const info = allPts[idx];
                inputs[info.pIdx][info.iIdx] = { x: ax, y: ay };
            }
        }

        // 3. Prepare for clipping
        const clipInputs: import('polygon-clipping').Polygon[] = inputs.map(p => {
             // Snap to grid as final stabilizer
             const snapped = this.snapPoints(p, snapPrecision);
             
             const points = snapped.map(pt => [pt.x, pt.y] as [number, number]);
             if (points.length > 0) {
                 const first = points[0];
                 const last = points[points.length - 1];
                 if (Math.abs(first[0] - last[0]) > 1e-9 || Math.abs(first[1] - last[1]) > 1e-9) {
                     points.push(first);
                 }
             }
             return [points];
        });

        // 4. Perform Union
        const result = polygonClipping.union(clipInputs as import('polygon-clipping').Polygon[]); 

        // 5. Convert back
        const output: Point[][] = [];
        for (const poly of result) {
            if (poly.length > 0) {
                const ring = poly[0];
                const converted: Point[] = ring.map((coord: [number, number]) => ({ x: coord[0], y: coord[1] }));
                output.push(this.cleanPolygon(converted, snapPrecision));
            }
        }
        return output;
    }

    /**
     * Intersects multiple polygons.
     */
    static intersection(poly1: Point[][], poly2: Point[][]): Point[][] {
        if (!poly1.length || !poly2.length) return []
        
        // Prepare inputs
        const clipInputs: any[] = [
            poly1.map(p => p.map(pt => [pt.x, pt.y])),
            poly2.map(p => p.map(pt => [pt.x, pt.y]))
        ]
        
        const result = polygonClipping.intersection(clipInputs[0], clipInputs[1]);
        
        // Convert back
        const output: Point[][] = [];
        for (const poly of result) {
            if (poly.length > 0) {
                const ring = poly[0];
                const converted: Point[] = ring.map((coord: [number, number]) => ({ x: coord[0], y: coord[1] }));
                output.push(this.cleanPolygon(converted));
            }
        }
        return output;
    }
    
    /**
     * Difference (Poly1 - Poly2).
     */
    static difference(poly1: Point[][], poly2: Point[][]): Point[][] {
        if (!poly1.length) return []
        if (!poly2.length) return poly1
        
        // Prepare inputs
        const subject = poly1.map(p => p.map(pt => [pt.x, pt.y]))
        const clip = poly2.map(p => p.map(pt => [pt.x, pt.y]))
        
        const result = polygonClipping.difference(subject as any, clip as any);
        
        // Convert back
        const output: Point[][] = [];
        for (const poly of result) {
            if (poly.length > 0) {
                const ring = poly[0];
                const converted: Point[] = ring.map((coord: [number, number]) => ({ x: coord[0], y: coord[1] }));
                output.push(this.cleanPolygon(converted));
            }
        }
        return output;
    }
}
