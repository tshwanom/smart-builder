'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useGeometryStore } from '../../../../application/store/geometryStore'
import { generateSVG } from '../../../../application/services/svgExporter'
import { useCanvasInteraction } from '../hooks/useCanvasInteraction'
import { CoordinateSystem, ViewSettings } from '../logic/CoordinateSystem'
import { ToolPalette } from './ui/ToolPalette'
import { UtilityBar } from './ui/UtilityBar'
import { CanvasControls } from './ui/CanvasControls'
import { StatusBar } from './ui/StatusBar'

export const SvgCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { project, selectedIds } = useGeometryStore()
  
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    scale: 50, // 50px per unit (meter)
    width: 800,
    height: 600,
    padding: 0,
    offsetX: 400, // Start centered-ish
    offsetY: 300
  })

  // --- Interaction Hook ---
  const { 
      activeTool, 
      setActiveTool, 
      handleMouseDown: handleToolMouseDown, 
      handleMouseMove: handleToolMouseMove,
      handleKeyDown,
      tempWallStart,
      mouseWorldPos,
      snappedPos
  } = useCanvasInteraction(viewSettings)

  // Attach key listeners
  useEffect(() => {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return
    
    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect
            setViewSettings(prev => ({ ...prev, width, height }))
        }
    })
    
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Generate SVG String (Background)
  const svgString = React.useMemo(() => {
    if (!project) return ''
    return generateSVG(project, {
        width: viewSettings.width,
        height: viewSettings.height,
        scale: viewSettings.scale,
        padding: viewSettings.padding,
        offsetX: viewSettings.offsetX,
        offsetY: viewSettings.offsetY
    })
  }, [project, viewSettings])

  // --- Pan / Zoom Logic ---
  const [isPanning, setIsPanning] = useState(false)
  
  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(1, Math.min(500, viewSettings.scale * delta))
      
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const worldX = (mouseX - viewSettings.offsetX) / viewSettings.scale
      const worldY = (mouseY - viewSettings.offsetY) / viewSettings.scale
      
      const newOffsetX = mouseX - worldX * newScale
      const newOffsetY = mouseY - worldY * newScale

      setViewSettings(prev => ({
          ...prev,
          scale: newScale,
          offsetX: newOffsetX,
          offsetY: newOffsetY
      }))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
      // Priority: Panning overrides Tools if Middle Click or Space
      if (e.button === 1 || (e.button === 0 && e.nativeEvent.getModifierState('Space'))) {
          setIsPanning(true)
          e.preventDefault()
          return
      }
      // Otherwise delegate to tool
      handleToolMouseDown(e)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isPanning) {
          setViewSettings(prev => ({
              ...prev,
              offsetX: prev.offsetX + e.movementX,
              offsetY: prev.offsetY + e.movementY
          }))
      } else {
          handleToolMouseMove(e)
      }
  }

  const handleMouseUp = () => {
      setIsPanning(false)
  }

  // Preview Element Construction
  let previewElement = null
  if (activeTool === 'wall' && tempWallStart && mouseWorldPos) {
      // Wall Preview
      const startScreen = CoordinateSystem.worldToScreen(tempWallStart, viewSettings)
      const endScreen = CoordinateSystem.worldToScreen(mouseWorldPos, viewSettings)
      
      previewElement = (
          <line 
              x1={startScreen.x} y1={startScreen.y} 
              x2={endScreen.x} y2={endScreen.y} 
              stroke="red" strokeWidth="2" strokeDasharray="5,5" 
          />
      )
  } else if ((activeTool === 'window' || activeTool === 'door') && snappedPos) {
      // Opening Preview
      const screenPos = CoordinateSystem.worldToScreen(snappedPos.point, viewSettings)
      const radius = (activeTool === 'window' ? 0.6 : 0.45) * viewSettings.scale
      
      previewElement = (
          <circle 
              cx={screenPos.x} cy={screenPos.y} 
              r={radius} 
              fill="none" stroke="red" strokeWidth="2" 
          />
      )
  }

  // Selection Overlay Construction
  // Create a list of lines for selected walls to be drawn on top
  const selectionOverlay = (project?.walls || [])
        .filter(w => selectedIds.includes(w.id))
        .map(w => {
            const startScreen = CoordinateSystem.worldToScreen({ x: w.start.x, y: w.start.y }, viewSettings)
            const endScreen = CoordinateSystem.worldToScreen({ x: w.end.x, y: w.end.y }, viewSettings)
            return (
                <line
                    key={`sel-${w.id}`}
                    x1={startScreen.x} y1={startScreen.y}
                    x2={endScreen.x} y2={endScreen.y}
                    stroke="#3b82f6" strokeWidth="3" opacity="0.6"
                />
            )
        })
        
  const openingSelectionOverlay = (project?.openings || [])
        .filter(o => selectedIds.includes(o.id))
        .map(o => {
            const center = o.center || { x: 0, y: 0 } // Fallback if center missing
            const screenPos = CoordinateSystem.worldToScreen(center, viewSettings)
             const radius = (o.type === 'window' ? 0.6 : 0.45) * viewSettings.scale
            return (
                <circle
                    key={`sel-${o.id}`}
                    cx={screenPos.x} cy={screenPos.y}
                    r={radius}
                    fill="none" stroke="#3b82f6" strokeWidth="3" opacity="0.6"
                />
            )
        })

  const [showGrid, setShowGrid] = useState(true)
  const [snapEnabled, setSnapEnabled] = useState(true)

  // Calculate rough area (Sum of room areas)
  const projectArea = React.useMemo(() => {
      if (!project || !project.rooms) return 0
      // Assuming rooms calculate their own area or we have a helper.
      // For now, let's just sum a placeholder if available, or 0.
      return project.rooms.length * 15 // Placeholder: 15m2 per room avg
  }, [project])

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full bg-gray-100 overflow-hidden relative select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
        {/* Main Geometry Layer */}
        <div 
            className="w-full h-full pointer-events-none absolute top-0 left-0"
            dangerouslySetInnerHTML={{ __html: svgString }}
            style={{ opacity: showGrid ? 1 : 1 }} // Grid is in SVG usually?
        />
        
        {/* Dynamic Overlay Layer (Preview + Selection) */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {selectionOverlay}
            {openingSelectionOverlay}
            {previewElement}
        </svg>
        
        {/* UI Overlay */}
        <ToolPalette 
            activeTool={activeTool}
            onToolChange={setActiveTool}
            hasSelection={selectedIds.length > 0}
            onOpenSettings={(tab) => {
                window.dispatchEvent(new CustomEvent('open-engineer-modal', { detail: { tab } }))
            }}
            onDelete={() => {}} 
            onGenerateRoof={() => {
                import('../../domain/geometry/generators/RoofGenerator').then(({ generateRoofs }) => {
                    if (project) {
                        const roofs = generateRoofs(project)
                        useGeometryStore.getState().setRoofs(roofs)
                    }
                })
            }}
        />

        <UtilityBar 
            activeTool={activeTool}
            onToolChange={setActiveTool}
            hasSelection={selectedIds.length > 0}
            onDelete={() => {
                const id = selectedIds[0]
                if (!id || !project) return
                const isWall = (project.walls || []).some(w => w.id === id)
                if (isWall) {
                    useGeometryStore.getState().deleteWall(id)
                } else {
                    useGeometryStore.getState().deleteOpening(id)
                }
            }}
        />

        <CanvasControls 
            scale={viewSettings.scale}
            onZoomIn={() => setViewSettings(p => ({ ...p, scale: Math.min(500, p.scale * 1.1) }))}
            onZoomOut={() => setViewSettings(p => ({ ...p, scale: Math.max(1, p.scale * 0.9) }))}
            onFitScreen={() => {
                 setViewSettings(p => ({ ...p, scale: 50, offsetX: p.width / 2, offsetY: p.height / 2 }))
            }}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(p => !p)}
            snapEnabled={snapEnabled}
            onToggleSnap={() => setSnapEnabled(p => !p)}
            isPanelOpen={selectedIds.length > 0}
        />

        <StatusBar 
            activeTool={activeTool}
            mousePos={mouseWorldPos}
            wallsCount={project?.walls.length || 0}
            roomsCount={project?.rooms?.length || 0}
            projectArea={projectArea}
            estimatedCost={0} 
            currencySymbol={project?.meta?.currencySymbol || '$'}
        />

    </div>
  )
}
