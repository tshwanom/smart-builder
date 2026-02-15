'use client'

import React, { useState } from 'react'
import { Group, Line, Arc, Circle, Text, Rect } from 'react-konva'
import { Opening, Wall } from '../../../application/types'

// Interface moved to be near component definition

/* ── Helpers ─────────────────────────────────────────────── */

function sub(a: Point, b: Point): Point { return { x: a.x - b.x, y: a.y - b.y } }
function vecLen(v: Point): number { return Math.sqrt(v.x * v.x + v.y * v.y) }

/** Get opening center position and wall angle */
function getOpeningTransform(opening: Opening, wall: Wall) {
  if (wall.points.length < 2) return null
  const start = wall.points[0]
  const end = wall.points[wall.points.length - 1]
  const dir = sub(end, start)
  const wallLen = vecLen(dir)
  if (wallLen === 0) return null

  // Position along wall centerline
  const cx = start.x + dir.x * opening.position
  const cy = start.y + dir.y * opening.position
  const angle = Math.atan2(dir.y, dir.x) * (180 / Math.PI)

  return { cx, cy, angle, wallLen, thickness: wall.thickness || 0.23 }
}

/* ── Door symbols ────────────────────────────────────────── */

/** SWING DOOR - Architectural Floor Plan Symbol */
function SwingDoor({ 
  width, 
  thickness, 
  isDouble,
  openPercentage = 0,
  flipSide = 'left',
  openingAngle = 90
}: { 
  width: number
  thickness: number
  isDouble?: boolean
  openPercentage?: number
  flipSide?: 'left' | 'right'
  openingAngle?: number
}) {
  const halfW = width / 2
  const halfT = thickness / 2
  const currentAngle = (openPercentage / 100) * openingAngle
  const panelThick = 0.04 // 40mm door leaf
  
  // Helper to draw a rotated thick panel
  const renderPanel = (hingeX: number, hingeY: number, panelW: number, angleDeg: number, direction: 1 | -1) => {
    // Geometry:
    // Hinge Point (x,y)
    // Angle 0: Panel runs from Hinge to (HingeX + Width, HingeY)
    // Rotated Angle:
    // Vector P (along panel): (cos(a), sin(a)) * Width
    // Vector T (thickness): (-sin(a), cos(a)) * Thickness (perpendicular)
      
    // Let's use simple relative rotation from "Closed" state.
    // Closed state:
    // Left Hinge: Vector (1, 0). 
    // Right Hinge: Vector (-1, 0).
    
    // Rotation:
    // Opens "Up" (negative Y).
    // Left Hinge: Rotates -90 deg.
    // Right Hinge: Rotates +90 deg.
    
    const rot = (direction === 1) ? -currentAngle : currentAngle
    const rL = rot * Math.PI / 180
    
    // Base vector (Closed position)
    const baseDirX = direction // 1 for left (points right), -1 for right (points left)
    const baseDirY = 0
    
    // Rotate base vector
    const pdx = (baseDirX * Math.cos(rL) - baseDirY * Math.sin(rL)) * panelW
    const pdy = (baseDirX * Math.sin(rL) + baseDirY * Math.cos(rL)) * panelW
    
    // Thickness vector (perpendicular pointing "in" to jamb? or always same way?)
    // Let's maintain thickness "below" the line for continuity with wall?
    // Wall is from -halfT to +halfT in Y? No, thickness is full wall.
    // Door usually sits flush with one side or centered. 
    // In plan, often flush with inside face.
    // Let's assume Center alignment for simplicity, or flush.
    // Let's use simple perp vector (-y, x)
    const tScale = panelThick / panelW
    const tdx = -pdy * tScale * direction // Flip thickness direction for symmetry?
    const tdy = pdx * tScale * direction
    
    // Corners
    const p1x = hingeX
    const p1y = hingeY
    const p2x = hingeX + pdx
    const p2y = hingeY + pdy
    const p3x = p2x + tdx
    const p3y = p2y + tdy
    const p4x = p1x + tdx
    const p4y = p1y + tdy
    
    return (
      <Group>
        <Line 
          points={[p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y]} 
          closed 
          fill="#FFFFFF" 
          stroke="#000000" 
          strokeWidth={0.015} 
        />
        {/* Hinge Pin */}
        <Circle cx={hingeX} cy={hingeY} r={0.015} fill="#000000" />
      </Group>
    )
  }

  if (isDouble) {
    // Double door
    const panelW = width / 2
    // Left Panel (Hinge at -halfW, Direction 1)
    // Right Panel (Hinge at halfW, Direction -1)
    
    return (
      <Group>
        {renderPanel(-halfW, -halfT, panelW, currentAngle, 1)}
        {renderPanel(halfW, -halfT, panelW, currentAngle, -1)}
        
        {/* Arcs */}
        <Arc x={-halfW} y={-halfT} innerRadius={0} outerRadius={panelW} angle={currentAngle} rotation={-90} stroke="#000000" strokeWidth={0.01} opacity={0.3} dash={[0.05,0.05]} />
        <Arc x={halfW} y={-halfT} innerRadius={0} outerRadius={panelW} angle={currentAngle} rotation={-90 - currentAngle} stroke="#000000" strokeWidth={0.01} opacity={0.3} dash={[0.05,0.05]} /> 
        {/* Wait, right arc rotation? Starts at 180, goes to 180+angle? or 180-angle?
            Right hinge opens "Up/Left". 
            Start Angle (Closed): 180 deg (Left).
            End Angle (Open): 180 + 90? No, Canvas rotation.
            Arc drawing in Konva: angle is extent. rotation is start.
            Left Side: Start -90 (Up), sweep +angle? No.
            Standard Konva Arc: starts at 0 (East). Positive is CW.
            We want Up (-90).
            So rotation = -90. Sweep = ?
            Actually, let's keep the arcs simple lines as they were, just update endpoints if needed.
            Previous arc code was working. Let's start with that logic.
        */}
         <Arc x={halfW} y={-halfT} innerRadius={0} outerRadius={panelW} angle={currentAngle} rotation={270 - currentAngle} stroke="#000000" strokeWidth={0.01} opacity={0.3} dash={[0.05,0.05]} />
      </Group>
    )
  }

  // Single swing door
  const hingeX = flipSide === 'left' ? -halfW : halfW
  const dir = flipSide === 'left' ? 1 : -1
  const arcRot = flipSide === 'left' ? -90 : 270 - currentAngle // Adjust for right side

  return (
    <Group>
      {renderPanel(hingeX, -halfT, width, currentAngle, dir)}
      
      {/* Swing arc */}
      <Arc 
        x={hingeX} 
        y={-halfT} 
        innerRadius={0} 
        outerRadius={width} 
        angle={currentAngle} 
        rotation={arcRot} 
        stroke="#000000" 
        strokeWidth={0.01} 
        opacity={0.3} 
        dash={[0.05,0.05]} 
      />
    </Group>
  )
}

/** SLIDING DOOR - Architectural Floor Plan Symbol */
function SlidingDoor({ 
  width, 
  thickness,
  panels = 2,
  openPercentage = 0
}: {
  width: number
  thickness: number
  panels?: number
  openPercentage?: number
}) {
  const halfW = width / 2
  const halfT = thickness / 2
  const panelWidth = width / panels
  const frameThick = 0.05 // 50mm frame
  
  return (
    <Group>
      {/* Track Background/Floor Line */}
      <Rect
        x={-halfW}
        y={-halfT}
        width={width}
        height={thickness}
        fill="transparent" 
      />

      {/* Draw each sliding panel */}
      {Array.from({ length: panels }, (_, i) => {
        const baseX = -halfW + i * panelWidth
        
        // Sliding Logic:
        // Even indices (0, 2) are "back" track. Odd indices (1, 3) are "front" track.
        const isBackTrack = i % 2 === 0
        // Offset Y deeply for back track, less deep for front track
        // Let's center within wall thickness?
        // Wall T = 230mm (default). Frame = 50mm.
        // Back Track Y: -halfT + gap
        // Front Track Y: -halfT + frameThick + gap
        
        const trackGap = 0.02
        const trackY = isBackTrack ? -halfT + trackGap : -halfT + frameThick + trackGap * 2
        
        // Slide displacement
        // Simple 2-panel logic: alternating slide towards center?
        // Let's implement X-O... slider.
        // Panel 1 slides Left over Panel 0.
        // Generic: Odd panels slide Left (negative). Even panels stay fixed?
        // Or all slide? "Open" usually means moving panels.
        // Let's slide Odd panels left.
        
        const slideMax = panelWidth * 0.9
        const slide = (i % 2 !== 0) ? -(openPercentage / 100) * slideMax : 0
        
        const x = baseX + slide
        
        return (
          <Group key={i}>
            {/* Panel Frame */}
            <Rect 
              x={x}
              y={trackY}
              width={panelWidth + 0.02} // Slight visual overlap
              height={frameThick}
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth={0.01}
            />
            
            {/* Glass */}
            <Rect 
              x={x + 0.01}
              y={trackY + 0.015}
              width={panelWidth}
              height={frameThick - 0.03}
              fill="#e0f2fe" // Light blue glass
              stroke="#0ea5e9"
              strokeWidth={0.005}
              opacity={0.6}
            />
            
            {/* Frame Center Line (visual detail) */}
            <Line
                points={[x + panelWidth/2, trackY, x+panelWidth/2, trackY+frameThick]}
                stroke="#000000"
                strokeWidth={0.005}
                opacity={0.1}
            />
          </Group>
        )
      })}
      
      {/* Track indicators - floor lines */}
      <Line 
        points={[-halfW, -halfT + frameThick + 0.01, halfW, -halfT + frameThick + 0.01]} 
        stroke="#64748b" 
        strokeWidth={0.005} 
        dash={[0.05, 0.05]}
      />
    </Group>
  )
}

/** FOLDING DOOR - Architectural Floor Plan Symbol (Bifold/Accordion) */
function FoldingDoor({ 
  width, 
  thickness,
  panels = 4,
  openPercentage = 0
}: {
  width: number
  thickness: number
  panels?: number
  openPercentage?: number
}) {
  const halfW = width / 2
  const halfT = thickness / 2
  const panelWidth = width / panels
  
  // Realistic folding simulation with THICKNESS
  // Fix: Use a continuous chain of points to ensure panels are connected (no gaps)
  
  const maxAngle = 85
  const currentAngle = (openPercentage / 100) * maxAngle
  const angleRad = currentAngle * Math.PI / 180
  const panelThickness = 0.04
  
  // Calculate the Zigzag offsets
  // dx = horizontal advance per panel
  // dy = vertical offset per panel (depth of fold)
  const dx = panelWidth * Math.cos(angleRad)
  const dy = panelWidth * Math.sin(angleRad)
  
  // Helper to draw a thick panel between two points
  const renderPanel = (x1: number, y1: number, x2: number, y2: number, key: string) => {
    // Vector along panel
    const vx = x2 - x1
    const vy = y2 - y1
    
    // Perpendicular vector for thickness (rotated 90 deg)
    // We want thickness to go "inward" or "outward"?
    // Let's normalize
    const len = Math.sqrt(vx*vx + vy*vy)
    const nx = -vy / len * panelThickness
    const ny = vx / len * panelThickness
    
    // 4 corners
    const p1x = x1, p1y = y1
    const p2x = x2, p2y = y2
    const p3x = x2 + nx, p3y = y2 + ny
    const p4x = x1 + nx, p4y = y1 + ny
    
    return (
      <Group key={key}>
        <Line 
          points={[p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y]} 
          closed
          fill="#FFFFFF"
          stroke="#000000" 
          strokeWidth={0.015} 
        />
        {/* Hinge at start point */}
        <Circle cx={x1} cy={y1} r={0.01} fill="#000000" />
        {/* Hinge at end point */}
        <Circle cx={x2} cy={y2} r={0.01} fill="#000000" />
      </Group>
    )
  }

  return (
    <Group>
      {/* Left side panels */}
      {Array.from({ length: Math.floor(panels / 2) }, (_, i) => {
        // Calculate start and end points for this panel index in the chain
        // P0 starts at wall (-halfW)
        // Even indices (0, 2) go "Up/Out" (negative Y offset in our logic to match visual)
        // Odd indices (1, 3) go "Down/In" (back to track)
        
        // Base X position (accumulated)
        const xStart = -halfW + i * dx
        const xEnd = -halfW + (i + 1) * dx
        
        // Y position
        // Even (0): Track -> Fold ( -halfT -> -halfT - dy )
        // Odd (1): Fold -> Track ( -halfT - dy -> -halfT )
        // Note: Using -dy to fold "Up" (visually away from wall in plan)
        
        const yBase = -halfT
        const yFold = -halfT - dy
        
        const yStart = i % 2 === 0 ? yBase : yFold
        const yEnd = i % 2 === 0 ? yFold : yBase
        
        return renderPanel(xStart, yStart, xEnd, yEnd, `left-${i}`)
      })}
      
      {/* Right side panels */}
      {Array.from({ length: Math.ceil(panels / 2) }, (_, i) => {
        // P0 starts at wall (halfW) and moves LEFT (-dx)
        const xStart = halfW - i * dx
        const xEnd = halfW - (i + 1) * dx
        
        // Y position logic matches left side for symmetry?
        // Left side P0 went Track -> Fold. 
        // Right side P0 should also go Track -> Fold to look symmetric.
        
        const yBase = -halfT
        const yFold = -halfT - dy
        
        const yStart = i % 2 === 0 ? yBase : yFold
        const yEnd = i % 2 === 0 ? yFold : yBase
        
        return renderPanel(xStart, yStart, xEnd, yEnd, `right-${i}`)
      })}
      
      {/* Track line */}
      <Line 
        points={[-halfW, -halfT, halfW, -halfT]} 
        stroke="#64748b" 
        strokeWidth={0.015} 
        dash={[0.05, 0.05]}
      />
    </Group>
  )
}

/** Pivot door: thick panel rotating around offset pivot */
function PivotDoor({ width }: { width: number; thickness: number }) {
  const halfW = width / 2
  const pivotOffset = width * 0.2 // 20% offset
  const panelThick = 0.05
  
  // Pivot Point is at ( -halfW + pivotOffset, 0 ) ? 
  // Standard pivot: Pivot is inside the frame, offset from jamb.
  // Center of door is (0,0).
  // Pivot point: x = -halfW + pivotOffset. y = 0.
  
  // Draw panel relative to pivot?
  // Let's just draw it closed for now as openPercentage isn't passed yet? 
  // Wait, I should add openPercentage to PivotDoor prop if I want it to animate.
  // But the interface for OpeningRenderer passes it.
  // I'll stick to static "closed" or "slightly open" symbol if no prop?
  // The current prop definition for PivotDoor only has width/thickness.
  // I should update it to accept openPercentage.
  
  return (
    <Group>
      {/* Pivot point */}
      <Circle cx={-halfW + pivotOffset} cy={0} radius={0.02} fill="#000000" />
      
      {/* Door leaf (Closed for now, as prop missing in signature) */}
      {/* I will update signature in next step if needed, but for now lets make it nice thick rect */}
      <Rect 
        x={-halfW} 
        y={-panelThick/2} 
        width={width} 
        height={panelThick} 
        fill="#FFFFFF" 
        stroke="#000000" 
        strokeWidth={0.015} 
      />
      
      {/* Swing Arc */}
      <Arc 
        x={-halfW + pivotOffset} 
        y={0} 
        innerRadius={width - pivotOffset} 
        outerRadius={width - pivotOffset} 
        angle={90} 
        rotation={-90} 
        stroke="#000000" 
        strokeWidth={0.01} 
        opacity={0.3} 
        dash={[0.05, 0.05]}
      />
    </Group>
  )
}

/** Garage door: thick segmented rectangle */
function GarageDoor({ width, thickness, isDouble }: { width: number; thickness: number; isDouble?: boolean }) {
  const halfW = width / 2
  const halfT = thickness / 2
  const segCount = isDouble ? 6 : 4
  const segW = width / segCount
  return (
    <Group>
      {/* Main panel */}
      <Rect 
        x={-halfW} 
        y={-halfT} 
        width={width} 
        height={thickness} 
        fill="#FFFFFF" 
        stroke="#000000" 
        strokeWidth={0.015} 
      />
      {/* Segment lines */}
      {Array.from({ length: segCount - 1 }, (_, i) => (
        <Line
          key={i}
          points={[-halfW + (i + 1) * segW, -halfT, -halfW + (i + 1) * segW, halfT]}
          stroke="#000000"
          strokeWidth={0.01}
        />
      ))}
       {/* Dashed overhead track indication */}
       <Line
          points={[-halfW, -halfT, -halfW, -halfT - 1.5]}
          stroke="#94a3b8"
          strokeWidth={0.01}
          dash={[0.1, 0.1]}
       />
       <Line
          points={[halfW, -halfT, halfW, -halfT - 1.5]}
          stroke="#94a3b8"
          strokeWidth={0.01}
          dash={[0.1, 0.1]}
       />
       <Line
          points={[-halfW, -halfT - 1.5, halfW, -halfT - 1.5]}
          stroke="#94a3b8"
          strokeWidth={0.01}
          dash={[0.1, 0.1]}
       />
    </Group>
  )
}

/* ── Window symbols ──────────────────────────────────────── */

/** Standard window: 3 parallel lines across wall thickness - NOW PARAMETRIC */
function WindowSymbol({ 
  width, 
  thickness, 
  subtype,
  panels = 1,
  openPercentage = 0
}: { 
  width: number
  thickness: number
  subtype?: string
  panels?: number
  openPercentage?: number
}) {
  const halfW = width / 2
  const halfT = thickness / 2
  const panelWidth = width / panels
  
  return (
    <Group>
      {/* Window panels */}
      {Array.from({ length: panels }, (_, i) => {
        const x = -halfW + i * panelWidth
        
        return (
          <Group key={i}>
            {/* Outer glass line */}
            <Line 
              points={[x, -halfT, x + panelWidth, -halfT]} 
              stroke="#0ea5e9" 
              strokeWidth={0.012} 
            />
            {/* Center glass line */}
            <Line 
              points={[x, 0, x + panelWidth, 0]} 
              stroke="#0ea5e9" 
              strokeWidth={0.008} 
            />
            {/* Inner glass line */}
            <Line 
              points={[x, halfT, x + panelWidth, halfT]} 
              stroke="#0ea5e9" 
              strokeWidth={0.012} 
            />
          </Group>
        )
      })}

      {/* Wall returns at edges */}
      <Line points={[-halfW, -halfT, -halfW, halfT]} stroke="#1e293b" strokeWidth={0.01} />
      <Line points={[halfW, -halfT, halfW, halfT]} stroke="#1e293b" strokeWidth={0.01} />
      
      {/* Panel dividers */}
      {panels > 1 && Array.from({ length: panels - 1 }, (_, i) => {
        const x = -halfW + (i + 1) * panelWidth
        return (
          <Line 
            key={i}
            points={[x, -halfT, x, halfT]} 
            stroke="#1e293b" 
            strokeWidth={0.008} 
          />
        )
      })}

      {/* Top-hung indicator: opening triangle */}
      {subtype === 'top_hung' && openPercentage > 0 && (
        <Line
          points={[-halfW * 0.3, halfT + 0.02, 0, halfT + 0.02 + (openPercentage / 100) * 0.1, halfW * 0.3, halfT + 0.02]}
          stroke="#0ea5e9" strokeWidth={0.006} closed fill="rgba(14,165,233,0.1)"
        />
      )}

      {/* Top-hung indicator (closed) */}
      {subtype === 'top_hung' && openPercentage === 0 && (
        <Line
          points={[-halfW * 0.3, halfT + 0.02, 0, halfT + 0.08, halfW * 0.3, halfT + 0.02]}
          stroke="#0ea5e9" strokeWidth={0.006} closed fill="rgba(14,165,233,0.1)"
        />
      )}

      {/* Side-hung indicator: opening triangle on the side */}
      {subtype === 'side_hung' && openPercentage > 0 && (
        <Line
          points={[-halfW - 0.02, -halfT * 0.3, -halfW - 0.02 - (openPercentage / 100) * 0.1, 0, -halfW - 0.02, halfT * 0.3]}
          stroke="#0ea5e9" strokeWidth={0.006} closed fill="rgba(14,165,233,0.1)"
        />
      )}
      
      {/* Side-hung indicator (closed) */}
      {subtype === 'side_hung' && openPercentage === 0 && (
        <Line
          points={[-halfW - 0.02, -halfT * 0.3, -halfW - 0.08, 0, -halfW - 0.02, halfT * 0.3]}
          stroke="#0ea5e9" strokeWidth={0.006} closed fill="rgba(14,165,233,0.1)"
        />
      )}
    </Group>
  )
}

/* ── Selection handles & dimensions ──────────────────────── */

function SelectionOverlay({
  opening, wallLen, thickness,
  onDragWidth,
}: {
  opening: Opening
  wallLen: number
  thickness: number
  onDragWidth?: (newWidth: number) => void
}) {
  const [editingDim, setEditingDim] = useState(false)
  const halfW = opening.width / 2
  const halfT = thickness / 2
  const distFromStart = opening.position * wallLen

  return (
    <Group>
      {/* Selection highlight box */}
      <Rect
        x={-halfW - 0.03}
        y={-halfT - 0.03}
        width={opening.width + 0.06}
        height={thickness + 0.06}
        stroke="#3b82f6"
        strokeWidth={0.015}
        dash={[0.03, 0.02]}
        listening={false}
      />

      {/* Width handles (left/right drag) */}
      <Rect
        x={-halfW - 0.04}
        y={-halfT * 0.5}
        width={0.04}
        height={thickness * 0.5}
        fill="#3b82f6"
        cornerRadius={0.01}
        draggable
        onDragEnd={(e) => {
          const dx = e.target.x() + halfW + 0.04
          const newWidth = Math.max(0.3, opening.width - dx)
          onDragWidth?.(newWidth)
          e.target.x(0) // reset
          e.target.y(0)
        }}
        cursor="ew-resize"
      />
      <Rect
        x={halfW}
        y={-halfT * 0.5}
        width={0.04}
        height={thickness * 0.5}
        fill="#3b82f6"
        cornerRadius={0.01}
        draggable
        onDragEnd={(e) => {
          const dx = e.target.x()
          const newWidth = Math.max(0.3, opening.width + dx)
          onDragWidth?.(newWidth)
          e.target.x(0)
          e.target.y(0)
        }}
        cursor="ew-resize"
      />

      {/* Dimension label: distance from wall start */}
      <Group y={halfT + 0.12}>
        {/* Dimension line */}
        <Line points={[-halfW, -0.02, -halfW, 0.02]} stroke="#ef4444" strokeWidth={0.008} />
        <Line points={[-halfW, 0, -halfW - distFromStart + halfW, 0]} stroke="#ef4444" strokeWidth={0.006} dash={[0.02, 0.01]} />
        
        {/* Label background */}
        <Rect
          x={-0.12}
          y={-0.04}
          width={0.24}
          height={0.08}
          fill="white"
          stroke="#ef4444"
          strokeWidth={0.006}
          cornerRadius={0.01}
          onClick={() => setEditingDim(!editingDim)}
          cursor="text"
        />
        
        {/* Dimension text (distance from start) */}
        <Text
          x={-0.10}
          y={-0.025}
          text={`${(distFromStart * 1000).toFixed(0)}`}
          fontSize={0.05}
          fill="#ef4444"
          fontStyle="bold"
          onClick={() => setEditingDim(!editingDim)}
        />
      </Group>

      {/* Width dimension label */}
      <Group y={-halfT - 0.06}>
        <Line points={[-halfW, 0, halfW, 0]} stroke="#3b82f6" strokeWidth={0.006} />
        <Line points={[-halfW, -0.02, -halfW, 0.02]} stroke="#3b82f6" strokeWidth={0.008} />
        <Line points={[halfW, -0.02, halfW, 0.02]} stroke="#3b82f6" strokeWidth={0.008} />
        <Text
          x={-0.08}
          y={-0.06}
          text={`${(opening.width * 1000).toFixed(0)}`}
          fontSize={0.04}
          fill="#3b82f6"
          fontStyle="bold"
        />
      </Group>
    </Group>
  )
}

/* ── Main OpeningRenderer ────────────────────────────────── */

interface OpeningRendererProps {
  openings: Opening[]
  walls: Wall[]
  onOpeningClick?: (openingId: string) => void
  selectedOpeningId?: string
  selection?: Array<{ type: string, data: { id: string } }>
  onOpeningUpdate?: (id: string, updates: Partial<Opening>) => void
  ghostOpening?: Opening | null
}

export const OpeningRenderer: React.FC<OpeningRendererProps> = ({ 
  openings, 
  walls, 
  onOpeningClick,
  selectedOpeningId,
  selection = [],
  onOpeningUpdate,
  ghostOpening
}) => {
  // Helper to apply default parametric values
  const getParametricDefaults = (opening: Opening) => {
    const defaults = {
      panels: opening.panels ?? (
        opening.subtype === 'folding' ? 4 :
        opening.subtype === 'sliding' ? 2 :
        opening.type === 'window' ? 1 :
        1
      ),
      openPercentage: opening.openPercentage ?? 0,
      flipSide: opening.flipSide ?? ('left' as const),
      hingeType: opening.hingeType ?? ('standard' as const),
      frameThickness: opening.frameThickness ?? 0.05,
      openingAngle: opening.openingAngle ?? 90
    }
    return defaults
  }
  
  const allOpenings = ghostOpening ? [...openings, { ...ghostOpening, id: 'ghost-preview' }] : openings

  return (
    <>
      {allOpenings.map((opening) => {
        const wall = walls.find(w => w.id === opening.wallId)
        if (!wall) return null
        
        const transform = getOpeningTransform(opening, wall)
        if (!transform) return null

        const { cx, cy, angle, wallLen, thickness } = transform
        const isMultiSelected = selection.some(s => s.type === 'opening' && s.data.id === opening.id)
        const isSelected = opening.id === selectedOpeningId || isMultiSelected
        const subtype = opening.subtype || (opening.type === 'door' ? 'single' : undefined)
        
        // Get parametric props with defaults
        const params = getParametricDefaults(opening)
        
        return (
          <Group
            key={opening.id}
            x={cx}
            y={cy}
            rotation={angle}
            opacity={opening.id === 'ghost-preview' ? 0.5 : 1}
            onClick={() => opening.id !== 'ghost-preview' && onOpeningClick?.(opening.id)}
            onTap={() => opening.id !== 'ghost-preview' && onOpeningClick?.(opening.id)}
          >
            {/* Render type-specific floor plan symbol */}
            {opening.type === 'door' && (
              <>
                {(subtype === 'single' || !subtype) && (
                  <SwingDoor 
                    width={opening.width} 
                    thickness={thickness} 
                    openPercentage={params.openPercentage}
                    flipSide={params.flipSide}
                    openingAngle={params.openingAngle}
                  />
                )}
                {subtype === 'double' && (
                  <SwingDoor 
                    width={opening.width} 
                    thickness={thickness} 
                    isDouble 
                    openPercentage={params.openPercentage}
                    openingAngle={params.openingAngle}
                  />
                )}
                {subtype === 'sliding' && (
                  <SlidingDoor 
                    width={opening.width} 
                    thickness={thickness} 
                    panels={params.panels}
                    openPercentage={params.openPercentage}
                  />
                )}
                {subtype === 'folding' && (
                  <FoldingDoor 
                    width={opening.width} 
                    thickness={thickness} 
                    panels={params.panels}
                    openPercentage={params.openPercentage}
                  />
                )}
                {subtype === 'pivot' && (
                  <PivotDoor width={opening.width} thickness={thickness} />
                )}
                {subtype === 'garage_single' && (
                  <GarageDoor width={opening.width} thickness={thickness} />
                )}
                {subtype === 'garage_double' && (
                  <GarageDoor width={opening.width} thickness={thickness} isDouble />
                )}
              </>
            )}

            {opening.type === 'window' && (
              <WindowSymbol 
                width={opening.width} 
                thickness={thickness} 
                subtype={subtype} 
                panels={params.panels}
                openPercentage={params.openPercentage}
              />
            )}

            {/* Selection overlay with handles and dimensions */}
            {isSelected && (
              <SelectionOverlay
                opening={opening}
                wallLen={wallLen}
                thickness={thickness}
                onDragWidth={(newWidth) => onOpeningUpdate?.(opening.id, { width: newWidth })}
              />
            )}
          </Group>
        )
      })}
    </>
  )
}
