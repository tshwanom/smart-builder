import { ProjectGeometry, Point3D, WallSegment, Opening3D } from '../../domain/types'
// import { scaleLinear } from 'd3-scale'
// Actually, let's stick to pure math to avoid dependencies for now.
import { projectToPlan } from '../../domain/projection/ProjectionEngine'

interface SVGExportSettings {
  width: number
  height: number
  scale: number // e.g. 50 pixels per meter.
  padding: number
  offsetX?: number // Optional override for panning
  offsetY?: number // Optional override for panning
}

export function generateSVG(geometry: ProjectGeometry, settings: SVGExportSettings = { width: 800, height: 600, scale: 50, padding: 20 }): string {
  const { walls, openings = [], roofs = [] } = geometry
  
  let offsetX = settings.offsetX
  let offsetY = settings.offsetY

  // If offsets are not provided, auto-center content
  if (offsetX === undefined || offsetY === undefined) {
    // 1. Calculate Bounding Box of Project
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    const allPoints: Point3D[] = []
    walls.forEach(w => { allPoints.push(w.start, w.end) })
    roofs.forEach(r => { allPoints.push(...r.vertices) })
    
    // Default to center if no geometry
    if (allPoints.length === 0) {
        minX = -5; maxX = 5; minY = -5; maxY = 5;
    } else {
        allPoints.forEach(p => {
            if (p.x < minX) minX = p.x
            if (p.y < minY) minY = p.y
            if (p.x > maxX) maxX = p.x
            if (p.y > maxY) maxY = p.y
        })
    }
    
    // Center project in SVG
    const projWidth = maxX - minX
    const projHeight = maxY - minY
    
    if (offsetX === undefined) offsetX = (settings.width - projWidth * settings.scale) / 2 - minX * settings.scale
    if (offsetY === undefined) offsetY = (settings.height - projHeight * settings.scale) / 2 - minY * settings.scale
  }
  
  const projSettings = {
    scale: settings.scale,
    offsetX: offsetX || 0,
    offsetY: offsetY || 0
  }

  let svgContent = ''
  
  // 2. Draw Walls
  // 2. Draw Walls
  walls.forEach(wall => {
    const start2D = projectToPlan(wall.start, projSettings)
    const end2D = projectToPlan(wall.end, projSettings)
    
    // Check if we have structure to render detailed skins
    if (wall.structure && wall.structure.skins && wall.structure.skins.length > 1) {
        // Render double lines
        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        const len = Math.sqrt(dx*dx + dy*dy)
        if (len === 0) return

        const ux = dx/len // unit vector X
        const uy = dy/len // unit vector Y
        
        // Perpendicular vector (-y, x)
        const px = -uy
        const py = ux
        
        // Offset for outer lines based on thickness
        const halfThick = (wall.thickness * settings.scale) / 2 / settings.scale // in meters
        
        // We actually want to draw two parallel lines representing the skins?
        // Or just the outer boundary? Standard plan view is two lines.
        // Let's draw outer boundary lines.
        
        const p1 = { x: wall.start.x + px * halfThick, y: wall.start.y + py * halfThick, z: 0 }
        const p2 = { x: wall.end.x + px * halfThick, y: wall.end.y + py * halfThick, z: 0 }
        
        const p3 = { x: wall.start.x - px * halfThick, y: wall.start.y - py * halfThick, z: 0 }
        const p4 = { x: wall.end.x - px * halfThick, y: wall.end.y - py * halfThick, z: 0 }
        
        const sp1 = projectToPlan(p1, projSettings)
        const sp2 = projectToPlan(p2, projSettings)
        const sp3 = projectToPlan(p3, projSettings)
        const sp4 = projectToPlan(p4, projSettings)
        
        // Outer Face
        svgContent += `<line x1="${sp1.x}" y1="${sp1.y}" x2="${sp2.x}" y2="${sp2.y}" stroke="black" stroke-width="2" />`
        // Inner Face
        svgContent += `<line x1="${sp3.x}" y1="${sp3.y}" x2="${sp4.x}" y2="${sp4.y}" stroke="black" stroke-width="2" />`
        
        // Fill? Maybe hatch later.
        
    } else {
        // Simple center line or thick single line for basic walls
        // Ideally we should always draw boundary lines for accurate plans
        // But for now, fallback to thick center line
        svgContent += `<line x1="${start2D.x}" y1="${start2D.y}" x2="${end2D.x}" y2="${end2D.y}" stroke="black" stroke-width="${Math.max(2, wall.thickness * settings.scale)}" opacity="0.5" />`
    }
  })
  
  // 3. Draw Foundations (Layer below walls)
  walls.forEach(wall => {
    if (wall.foundation) {
        const { width, offset } = wall.foundation
        
        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        const len = Math.sqrt(dx*dx + dy*dy)
        if (len === 0) return

        const ux = dx/len
        const uy = dy/len
        
        // Perpendicular vector (-y, x)
        const px = -uy
        const py = ux
        
        const offsetDist = offset || 0
        const halfWidth = width / 1000 / 2 // mm -> m
        
        // 4 corners of foundation polygon
        const p1 = {
            x: wall.start.x + px * (offsetDist/1000 - halfWidth),
            y: wall.start.y + py * (offsetDist/1000 - halfWidth),
            z: 0
        }
        const p2 = {
            x: wall.start.x + px * (offsetDist/1000 + halfWidth),
            y: wall.start.y + py * (offsetDist/1000 + halfWidth),
            z: 0
        }
        const p3 = {
            x: wall.end.x + px * (offsetDist/1000 + halfWidth),
            y: wall.end.y + py * (offsetDist/1000 + halfWidth),
            z: 0
        }
        const p4 = {
            x: wall.end.x + px * (offsetDist/1000 - halfWidth),
            y: wall.end.y + py * (offsetDist/1000 - halfWidth),
            z: 0
        }
        
        const sp1 = projectToPlan(p1, projSettings)
        const sp2 = projectToPlan(p2, projSettings)
        const sp3 = projectToPlan(p3, projSettings)
        const sp4 = projectToPlan(p4, projSettings)
        
        const points = `${sp1.x},${sp1.y} ${sp2.x},${sp2.y} ${sp3.x},${sp3.y} ${sp4.x},${sp4.y}`
        
        // Draw dashed grey polygon
        svgContent += `<polygon points="${points}" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4" />`
    }
  })

  // 4. Draw Openings (Rectangles aligned with walls)
  const wallMap = new Map(walls.map(w => [w.id, w]))

  openings.forEach(op => {
      const wall = wallMap.get(op.wallId)
      if (!wall) return

      const center2D = projectToPlan(op.center, projSettings)
      
      // Calculate wall angle
      const dx = wall.end.x - wall.start.x
      const dy = wall.end.y - wall.start.y
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)

      // Dimensions in screen pixels
      const widthPx = op.width * settings.scale
      // For plan view, "height" of the rect is the wall thickness usually, 
      // or a standard visual thickness for the symbol.
      const depthPx = wall.thickness * settings.scale 
      
      // SVG rotate transform is around a point: rotate(angle, x, y)
      // We draw the rect centered at (center2D.x, center2D.y)
      // x = center - width/2, y = center - depth/2
      const rectX = center2D.x - widthPx / 2
      const rectY = center2D.y - depthPx / 2

      const color = op.type === 'window' ? '#bfdbfe' : '#e5e7eb' // Blue-ish for window, Gray for door

      svgContent += `<rect 
          x="${rectX}" y="${rectY}" 
          width="${widthPx}" height="${depthPx}" 
          fill="${color}" stroke="black" stroke-width="1"
          transform="rotate(${angle}, ${center2D.x}, ${center2D.y})"
      />`
  })

  // 4. Draw Roofs (Dashed outlines)
  roofs.forEach(roof => {
      const pts = roof.vertices.map(v => projectToPlan(v, projSettings))
      const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ')
      svgContent += `<polygon points="${pointsStr}" fill="none" stroke="gray" stroke-dasharray="5,5" />`
  })

  return `<svg width="${settings.width}" height="${settings.height}" viewBox="0 0 ${settings.width} ${settings.height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="white" />
    ${svgContent}
  </svg>`
}
