import { ProjectGeometry, Point3D, WallSegment, Opening3D } from '../../domain/types'
import { scaleLinear } from 'd3-scale' // Might need d3-scale if available, or just math.
// Actually, let's stick to pure math to avoid dependencies for now.
import { projectToPlan } from '../../domain/projection/ProjectionEngine'

interface SVGExportSettings {
  width: number
  height: number
  scale: number // e.g. 100 for 1:100 if units are m? No, 50 means 50 pixels per meter.
  padding: number
}

export function generateSVG(geometry: ProjectGeometry, settings: SVGExportSettings = { width: 800, height: 600, scale: 50, padding: 20 }): string {
  const { walls, openings, roofs } = geometry
  
  // 1. Calculate Bounding Box of Project
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  
  const allPoints: Point3D[] = []
  walls.forEach(w => { allPoints.push(w.start, w.end) })
  roofs.forEach(r => { allPoints.push(...r.vertices) })
  
  if (allPoints.length === 0) return '<svg></svg>'
  
  allPoints.forEach(p => {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  })
  
  // Center project in SVG
  const projWidth = maxX - minX
  const projHeight = maxY - minY
  
  const offsetX = (settings.width - projWidth * settings.scale) / 2 - minX * settings.scale
  const offsetY = (settings.height - projHeight * settings.scale) / 2 - minY * settings.scale
  
  const projSettings = {
    scale: settings.scale,
    offsetX,
    offsetY
  }

  let svgContent = ''
  
  // 2. Draw Walls
  walls.forEach(wall => {
    const start2D = projectToPlan(wall.start, projSettings)
    const end2D = projectToPlan(wall.end, projSettings)
    
    // Simple line for now
    svgContent += `<line x1="${start2D.x}" y1="${start2D.y}" x2="${end2D.x}" y2="${end2D.y}" stroke="black" stroke-width="2" />`
  })
  
  // 3. Draw Openings (Simple representation)
  openings.forEach(op => {
      // For plan view, openings are usually holes in walls or specific symbols.
      // We'll draw a small circle at the center for now.
      const center2D = projectToPlan(op.center, projSettings)
      svgContent += `<circle cx="${center2D.x}" cy="${center2D.y}" r="${0.5 * settings.scale}" fill="white" stroke="blue" stroke-width="1" />`
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
