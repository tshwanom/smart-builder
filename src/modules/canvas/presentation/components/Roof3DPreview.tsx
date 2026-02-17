import React, { useRef, useEffect } from 'react'
import { useCanvasStore } from '../../application/store'
import { RoofGenerator } from '../../domain/geometry/RoofGenerator'

/**
 * 3D Isometric Preview of Roof Geometry
 * Uses Canvas 2D with isometric projection - no Three.js dependencies needed
 */
const Roof3DPreview = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const walls = useCanvasStore(state => state.walls)
    const activeStoryId = useCanvasStore(state => state.activeStoryId)
    const roofPitch = useCanvasStore(state => state.roofPitch)
    const roofOverhang = useCanvasStore(state => state.roofOverhang)
    const rooms = useCanvasStore(state => state.rooms)

    // Camera State
    const [cameraState, setCameraState] = React.useState({
        azimuth: Math.PI / 4, // 45 degrees
        elevation: Math.PI / 6, // 30 degrees
        zoom: 3,
        pan: { x: 0, y: 0 }
    })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Get roof geometry
        const candidateRooms = rooms.filter(r => {
            if (activeStoryId && r.storyId !== activeStoryId) return false
            if (r.hasRoof === false) return false
            return true
        })

        if (candidateRooms.length === 0) return

        // Generate Composite Roof for ALL rooms
        // We need to gather all panels first
        // In the real app, panels come from RoofEditor or are auto-generated per room.
        // Here we simulate auto-generation for all rooms with roofs.
        
        const allPanels = candidateRooms.map(room => ({
            id: `panel-${room.id}`,
            roomId: room.id,
            footprint: room.polygon,
            pitchedConfig: { pitch: roofPitch }
        }))

        // Generate geometry for the whole set
        // Note: RoofGenerator might expect a single connected set or handle multiples.
        // It currently unions them.
        const geometry = RoofGenerator.generateFromRoofPanels(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            allPanels as any[],
            candidateRooms,
            walls,
            roofPitch,
            roofOverhang
        )

        if (!geometry || !geometry.planes || geometry.planes.length === 0) return

        // Calculate Bounding Box to center the model
        let minX = Infinity, maxX = -Infinity
        let minY = Infinity, maxY = -Infinity
        let minZ = Infinity, maxZ = -Infinity

        const updateBounds = (p: {x: number, y: number}, z: number) => {
            if (p.x < minX) minX = p.x
            if (p.x > maxX) maxX = p.x
            if (p.y < minY) minY = p.y
            if (p.y > maxY) maxY = p.y
            if (z < minZ) minZ = z
            if (z > maxZ) maxZ = z
        }
        
        // Helper: Calculate Z from plane equation (moved up for bounds calc)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getZ = (plane: any, x: number, y: number) => {
            const dx = x - plane.baselineRef.x
            const dy = y - plane.baselineRef.y
            const dist = dx * plane.inwardNormal.x + dy * plane.inwardNormal.y
            return plane.baselineHeight + plane.slopeRise * dist
        }

        // Iterate all points to find bounds
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geometry.planes.forEach((plane: any) => {
            if (!plane.trimmedPolygons) return
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            plane.trimmedPolygons.forEach((poly: any[]) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                poly.forEach((p: any) => {
                    updateBounds(p, getZ(plane, p.x, p.y))
                })
            })
        })

        const center = {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
            z: (minZ + maxZ) / 2
        }

        // Isometric projection settings removed, using camera state

        
        const cx = canvas.width / 2 + cameraState.pan.x
        const cy = canvas.height / 2 + cameraState.pan.y

        // Precompute rotation functions
        const cosAz = Math.cos(cameraState.azimuth)
        const sinAz = Math.sin(cameraState.azimuth)
        const cosEl = Math.cos(cameraState.elevation)
        const sinEl = Math.sin(cameraState.elevation)

        // Helper to project a single 3D point to 2D screen space (and return depth)
        const projectPoint = (x: number, y: number, z: number) => {
             // Translate to center
             const tx = x - center.x
             const ty = y - center.y
             const tz = z - center.z
 
             // 1. Rotate around Z (azimuth)
             const x1 = tx * cosAz - ty * sinAz
             const y1 = tx * sinAz + ty * cosAz
             
             // 2. Rotate around X (elevation)
             const depth = y1 * cosEl - tz * sinEl

             const screenX = cx + x1 * cameraState.zoom
             const screenY = cy - (y1 * sinEl + tz * cosEl) * cameraState.zoom
             
             return { x: screenX, y: screenY, depth }
        }

        // --- Textures & Materials ---
        // Shingle pattern removed for clean solid look
        const shinglePattern = null

        // Lighting Direction (Afternoon Sun for contrast)
        const lightDir = { x: -0.6, y: -0.4, z: 0.7 } 
        const len = Math.sqrt(lightDir.x**2 + lightDir.y**2 + lightDir.z**2)
        lightDir.x /= len; lightDir.y /= len; lightDir.z /= len

        // Prepare render list with depth info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderList: any[] = []

        // 1. Process Planes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geometry.planes.forEach((plane: any, i: number) => {
            if (!plane.trimmedPolygons || plane.trimmedPolygons.length === 0) return

            const poly = plane.trimmedPolygons[0]
            if (poly.length < 3) return

            // Calculate 3D center for sorting
            let sumX = 0, sumY = 0
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            poly.forEach((p: any) => { sumX += p.x; sumY += p.y })
            const cenX = sumX / poly.length
            const cenY = sumY / poly.length
            const cenZ = getZ(plane, cenX, cenY)
            
            const projCen = projectPoint(cenX, cenY, cenZ)
            
            // Calculate Normals & Lighting
            const p0 = { x: poly[0].x, y: poly[0].y, z: getZ(plane, poly[0].x, poly[0].y) }
            const p1 = { x: poly[1].x, y: poly[1].y, z: getZ(plane, poly[1].x, poly[1].y) }
            const p2 = { x: poly[2].x, y: poly[2].y, z: getZ(plane, poly[2].x, poly[2].y) }

            const v1 = { x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z }
            const v2 = { x: p2.x - p0.x, y: p2.y - p0.y, z: p2.z - p0.z }

            let nx = v1.y * v2.z - v1.z * v2.y
            let ny = v1.z * v2.x - v1.x * v2.z
            let nz = v1.x * v2.y - v1.y * v2.x
            const nLen = Math.sqrt(nx*nx + ny*ny + nz*nz)
            nx /= nLen; ny /= nLen; nz /= nLen

            // Force normal UP
            if (nz < 0) { nx = -nx; ny = -ny; nz = -nz }
            
            let dot = nx * lightDir.x + ny * lightDir.y + nz * lightDir.z
            dot = Math.max(0.0, dot)

            // Stronger contrast: 0.2 ambient, 0.8 diffuse
            const lighting = 0.2 + 0.8 * dot

            renderList.push({
                type: 'plane',
                depth: projCen.depth,
                rawPoly: poly,
                plane,
                lighting,
                index: i
            })
        })
        
        // 2. Sort: Furthest first
        renderList.sort((a, b) => b.depth - a.depth)

        // 3. Draw sorted
        renderList.forEach(item => {
            if (item.type === 'plane') {
                const { rawPoly, plane, lighting } = item // eslint-disable-line @typescript-eslint/no-unused-vars
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const vertices3D = rawPoly.map((p: any) => ({
                    x: p.x, 
                    y: p.y, 
                    z: getZ(plane, p.x, p.y)
                }))

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const vertices2D = vertices3D.map((v: any) => projectPoint(v.x, v.y, v.z))

                if (vertices2D.length < 3) return

                ctx.beginPath()
                ctx.moveTo(vertices2D[0].x, vertices2D[0].y)
                for (let j = 1; j < vertices2D.length; j++) {
                    ctx.lineTo(vertices2D[j].x, vertices2D[j].y)
                }
                ctx.closePath()

                // Solid Color with Lighting Definition
                // Hue 20 (Terracotta), Saturation 60%
                // Lightness modulates from 20% (shadow) to 60% (sun)
                const l = Math.floor(lighting * 40 + 20)
                ctx.fillStyle = `hsl(20, 60%, ${l}%)`
                ctx.fill()
                
                // Subtle stroke for definition
                ctx.strokeStyle = `rgba(60, 30, 20, 0.4)`
                ctx.lineWidth = 1
                ctx.stroke()
            }
        })

        // Helper: Point in Polygon
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isPointInPoly = (p: {x: number, y: number}, poly: any[]) => {
            let inside = false
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const xi = poly[i].x, yi = poly[i].y
                const xj = poly[j].x, yj = poly[j].y
                
                const intersect = ((yi > p.y) !== (yj > p.y)) &&
                    (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)
                if (intersect) inside = !inside
            }
            return inside
        }
        
        // Helper: Distance squared from point to segment
        const distToSegmentSq = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
            const l2 = (x1-x2)**2 + (y1-y2)**2
            if (l2 === 0) return (px-x1)**2 + (py-y1)**2
            let t = ((px-x1)*(x2-x1) + (py-y1)*(y2-y1)) / l2
            t = Math.max(0, Math.min(1, t))
            return (px - (x1 + t*(x2-x1)))**2 + (py - (y1 + t*(y2-y1)))**2
        }

        // Draw ridge/valley/hip lines
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const drawEdges = (edges: any[], color: string, width: number) => {
            edges.forEach(edge => {
                // Strict Z-finding
                const findZ = (p: {x: number, y: number}) => {
                    let bestZ = -Infinity
                    
                    // 1. Strict containment
                    for (const plane of geometry.planes) {
                        if (plane.trimmedPolygons && isPointInPoly(p, plane.trimmedPolygons[0])) {
                            const z = getZ(plane, p.x, p.y)
                            if (z > bestZ) bestZ = z
                        }
                    }
                    if (bestZ !== -Infinity) return bestZ

                    // 2. Tolerance check (Point might be slightly outside polygon due to float errors)
                    // Check edges of polygons
                    let closestDistSq = Infinity
                    let closestZ = -Infinity

                    for (const plane of geometry.planes) {
                        if (!plane.trimmedPolygons || plane.trimmedPolygons.length === 0) continue
                        const poly = plane.trimmedPolygons[0]
                        for (let i = 0; i < poly.length; i++) {
                            const p1 = poly[i]
                            const p2 = poly[(i + 1) % poly.length]
                            const d2 = distToSegmentSq(p.x, p.y, p1.x, p1.y, p2.x, p2.y)
                            
                            // If very close to an edge, use this plane's Z
                            if (d2 < 0.05) { // ~20cm tolerance
                                if (d2 < closestDistSq) {
                                    closestDistSq = d2
                                    closestZ = getZ(plane, p.x, p.y)
                                }
                            }
                        }
                    }
                    
                    if (closestZ !== -Infinity) return closestZ

                    // 3. Fallback to Baseline (Plate Height)
                    // DO NOT search infinite planes, it causes sky artifacts.
                    // If the point isn't on the roof, ground it to the plate height.
                    return geometry.planes[0]?.baselineHeight ?? 2.7
                }

                const z1 = findZ(edge.start)
                const z2 = findZ(edge.end)

                const p1 = projectPoint(edge.start.x, edge.start.y, z1)
                const p2 = projectPoint(edge.end.x, edge.end.y, z2)

                ctx.beginPath()
                ctx.moveTo(p1.x, p1.y)
                ctx.lineTo(p2.x, p2.y)
                ctx.strokeStyle = color
                ctx.lineWidth = width
                ctx.stroke()
            })
        }

        // Distinct Edge Colors
        if (geometry.ridges) drawEdges(geometry.ridges, '#222', 4)       // Thick Black Ridge
        if (geometry.hips) drawEdges(geometry.hips, '#444', 3)           // Dark Grey Hip
        if (geometry.valleys) drawEdges(geometry.valleys, '#E0E0E0', 3)  // Bright Silver Valley
        if (geometry.eaves) drawEdges(geometry.eaves, '#000', 2)         // Black Eave

    }, [walls, activeStoryId, roofPitch, roofOverhang, rooms, cameraState])

    // Dragging State for Panel
    const [position, setPosition] = React.useState({ x: window.innerWidth - 440, y: 80 })
    const [size, setSize] = React.useState({ width: 400, height: 300 })
    const [isDraggingPanel, setIsDraggingPanel] = React.useState(false)
    const [isResizing, setIsResizing] = React.useState(false)
    const dragOffset = useRef({ x: 0, y: 0 })
    const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

    // Camera Control Handlers
    const lastMouse = useRef({ x: 0, y: 0 })
    const isOrbiting = useRef(false)
    const isPanning = useRef(false)

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        lastMouse.current = { x: e.clientX, y: e.clientY }
        if (e.button === 2 || e.shiftKey) {
            isPanning.current = true
        } else {
            isOrbiting.current = true
        }
    }

    const handleWindowMouseMove = React.useCallback((e: MouseEvent) => {
        // Resize Drag
        if (isResizing) {
            const dx = e.clientX - resizeStart.current.x
            const dy = e.clientY - resizeStart.current.y
            setSize({
                width: Math.max(200, resizeStart.current.w + dx),
                height: Math.max(150, resizeStart.current.h + dy)
            })
            return
        }

        // Panel Drag
        if (isDraggingPanel) {
            setPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            })
            return
        }

        // Camera Drag
        if (isOrbiting.current || isPanning.current) {
            const dx = e.clientX - lastMouse.current.x
            const dy = e.clientY - lastMouse.current.y
            lastMouse.current = { x: e.clientX, y: e.clientY }

            if (isOrbiting.current) {
                setCameraState(prev => ({
                    ...prev,
                    azimuth: prev.azimuth + dx * 0.01,
                    elevation: Math.max(0.1, Math.min(Math.PI / 2, prev.elevation + dy * 0.01))
                }))
            }

            if (isPanning.current) {
                setCameraState(prev => ({
                    ...prev,
                    pan: {
                        x: prev.pan.x + dx,
                        y: prev.pan.y + dy
                    }
                }))
            }
        }
    }, [isDraggingPanel, isResizing])

    const handleWindowMouseUp = React.useCallback(() => {
        setIsDraggingPanel(false)
        setIsResizing(false)
        isOrbiting.current = false
        isPanning.current = false
    }, [])

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation()
        const scale = 1.1
        const factor = e.deltaY < 0 ? scale : 1 / scale
        setCameraState(prev => ({
            ...prev,
            zoom: Math.max(1, Math.min(50, prev.zoom * factor))
        }))
    }

    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDraggingPanel(true)
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        }
    }

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            w: size.width,
            h: size.height
        }
    }

    useEffect(() => {
        window.addEventListener('mousemove', handleWindowMouseMove)
        window.addEventListener('mouseup', handleWindowMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove)
            window.removeEventListener('mouseup', handleWindowMouseUp)
        }
    }, [handleWindowMouseMove, handleWindowMouseUp])

    return (
        <div style={{ 
            position: 'fixed', 
            top: position.y, 
            left: position.x, 
            background: 'white', 
            border: '2px solid #ccc',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            cursor: isDraggingPanel ? 'grabbing' : 'default'
        }}>
            <h3 
                onMouseDown={handleHeaderMouseDown}
                style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    cursor: 'grab',
                    userSelect: 'none',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '5px'
                }}
            >
                3D Roof Preview (Drag Header)
            </h3>
            <div 
                style={{ position: 'relative', width: size.width, height: size.height, background: '#f5f5f5', overflow: 'hidden' }}
                onMouseDown={handleCanvasMouseDown}
                onContextMenu={e => e.preventDefault()}
                onWheel={handleWheel}
            >
                <div style={{ position: 'absolute', top: 5, left: 5, fontSize: '10px', color: '#666', pointerEvents: 'none' }}>
                    Click & Drag to Rotate • Right-Click/Shift to Pan • Scroll to Zoom
                </div>
                <canvas 
                    ref={canvasRef}
                    width={size.width}
                    height={size.height}
                    style={{ display: 'block' }}
                />
            </div>
            
            {/* Resize Handle */}
            <div
                onMouseDown={handleResizeMouseDown}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '15px',
                    height: '15px',
                    cursor: 'nwse-resize',
                    zIndex: 10,
                    background: 'linear-gradient(135deg, transparent 50%, #999 50%)',
                    borderBottomRightRadius: '6px'
                }}
            />
        </div>
    )
}

export default Roof3DPreview
