'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Group } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { twMerge } from 'tailwind-merge'
import { useCanvasStore } from '../../application/store'
import { Point, Wall, Opening } from '../../application/types'
import { WallRenderer } from './renderers/WallRenderer'
import { DrawingPreview } from './renderers/DrawingPreview'
import { OpeningRenderer } from './renderers/OpeningRenderer'
import { RoomRenderer } from './renderers/RoomRenderer'
import { ViewportToolbar } from './ui/ViewportToolbar'
import { OpeningLibraryModal } from './modals/OpeningLibraryModal'
import { FixtureLibraryModal } from './ui/FixtureLibraryModal'
import { TemporaryDimensions } from './renderers/TemporaryDimensions'
import { HistoryToolbar } from './ui/HistoryToolbar'
import { MEPToolbar } from './ui/MEPToolbar'
import { MEPSetupWizard } from './modals/MEPSetupWizard'
import { MEPRendererComponent } from './renderers/MEPRenderer'
import { InteractiveDimensionInput } from './ui/InteractiveDimensionInput'
import { GridRenderer } from './renderers/GridRenderer'
import { ToolPalette } from './ui/ToolPalette'
import { StatusBar } from './ui/StatusBar'
import { useSelectionHandler } from '../hooks/useSelectionHandler'
import { useBoxSelection } from '../hooks/useBoxSelection'
import { useCanvasCoordinates } from '../hooks/useCanvasCoordinates'
import { BoxSelectOverlay } from './logic/BoxSelectOverlay'
import { AutoDimensionRenderer } from './renderers/AutoDimensionRenderer'
import { useWallTemplates } from '../hooks/useWallTemplates'
import { StoryControlPanel } from './ui/StoryControlPanel'
import RoofRenderer from './renderers/RoofRenderer'
import { RoofFootprintEditor } from './renderers/RoofFootprintEditor'
import Roof3DPreview from './Roof3DPreview'


interface CanvasStageProps {
  className?: string
}

export const CanvasStage: React.FC<CanvasStageProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  const projectId = null // TODO: Get specific project ID
  const { templates } = useWallTemplates(projectId)

  // Memoize template map for fast lookup
  const templateMap = React.useMemo(() => {
      return new Map(templates.map(t => [t.id, t]))
  }, [templates])

  const { 
    currentTool, 
    isDrawing, 
    currentWall, 
    walls,
    rooms,
    openings,
    viewport,

    startWall,
    addWallPoint,
    completeWall,
    setTool,
    detectRooms,
    selectWall,
    selectRoom,
    selectedElement,
    addOpening,
    updateOpening,
    setOrthogonalLock,
    panBy,
    activeOpeningType,
    setActiveOpeningType,
    setMousePosition,
    mousePosition,
    mepConfig,
    addElectricalPoint,
    addPlumbingPoint,
    activeDimension,
    showDimensions,
    stories,
    activeStoryId,
    referenceSettings,
    addStaircase,
    activeLibraryModal,
    closeLibrary
  } = useCanvasStore()
  
  // --- Story Management Logic ---
  const activeStory = stories.find(s => s.id === activeStoryId)
  
  // Determine reference stories
  const storyBelow = referenceSettings.showBelow && activeStory 
    ? stories.find(s => s.level === activeStory.level - 1) 
    : null
    
  const storyAbove = referenceSettings.showAbove && activeStory 
    ? stories.find(s => s.level === activeStory.level + 1) 
    : null

  // Filter Entities for Active Story
  // If activeStoryId is missing (legacy), we show all that have NO storyId or match default
  // But strictly we should just filter by ID if it exists.
  // For legacy support: if wall.storyId is undefined, treat it as "Ground Floor" (level 0) or just show it if activeStory is level 0.
  // Ideally projectSlice.loadProject fixed this, but for robustness:
  const filterByStory = (item: { storyId?: string }) => {
      if (!activeStory) return true // Show all if no story system active
      return item.storyId === activeStoryId || (!item.storyId && activeStory.level === 0)
  }

  const activeWalls = walls.filter(filterByStory)
  const activeRooms = rooms.filter(filterByStory)
  const activeOpenings = openings.filter(filterByStory)
  
  // DEBUG: Log filtering results
  console.log('[CanvasStage] Story Filtering:', {
    totalWalls: walls.length,
    activeWalls: activeWalls.length,
    totalRooms: rooms.length,
    activeRooms: activeRooms.length,
    activeStoryId,
    activeStoryLevel: activeStory?.level,
    wallStoryIds: walls.map(w => w.storyId),
    roomStoryIds: rooms.map(r => r.storyId)
  });
  
  // Filter for Ghosts
  const belowWalls = storyBelow ? walls.filter(w => w.storyId === storyBelow.id) : []
  const belowRooms = storyBelow ? rooms.filter(r => r.storyId === storyBelow.id) : []
  const belowOpenings = storyBelow ? openings.filter(o => o.storyId === storyBelow.id) : []
  
  const aboveWalls = storyAbove ? walls.filter(w => w.storyId === storyAbove.id) : []
  const aboveRooms = storyAbove ? rooms.filter(r => r.storyId === storyAbove.id) : []
  const aboveOpenings = storyAbove ? openings.filter(o => o.storyId === storyAbove.id) : []
  
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<Point | null>(null)
  const [ghostOpening, setGhostOpening] = useState<Opening | null>(null) // Preview state

  // Plumbing Library State
  const [showPlumbingLibrary, setShowPlumbingLibrary] = useState(false)
  const [activePlumbingVariant, setActivePlumbingVariant] = useState<{ id: string, width: number, length: number } | null>(null)
  
  // Ghost State
  const [ghostPlumbing, setGhostPlumbing] = useState<{
      id: string
      type: 'basin' | 'sink' | 'shower' | 'toilet' | 'bath' | 'washing_machine' | 'source'
      subtype?: string
      position: Point
      rotation: number
      isSource: boolean
      width?: number
      length?: number
      wallId?: string
  } | null>(null)

  // Logic moved to ToolPalette explicit call for Openings.
  // Restore Plumbing Auto-Open Logic
  useEffect(() => {
    if (['basin', 'sink', 'shower', 'toilet', 'bath', 'washing_machine'].includes(currentTool)) {
        setShowPlumbingLibrary(true)
    }
  }, [currentTool])
  
  const handleOpeningSelect = (opening: Record<string, unknown>) => {
    setActiveOpeningType(opening as Partial<Opening>)
    closeLibrary()
  }

  const handlePlumbingSelect = (variantId: string, width: number, length: number) => {
      setActivePlumbingVariant({ id: variantId, width, length })
      setShowPlumbingLibrary(false)
  }

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Keyboard handlers for Shift key (orthogonal lock)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setOrthogonalLock(true)
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setOrthogonalLock(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setOrthogonalLock])

  // Mouse wheel zoom — centered on cursor position
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const scaleBy = 1.1
    const stage = e.target.getStage()
    if (!stage) return
    
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    
    const oldScale = viewport.scale
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
    const clampedScale = Math.max(10, Math.min(500, newScale))
    
    // Zoom centered on mouse: keep the world point under cursor fixed
    // worldPoint = (screenPoint - offset) / scale
    // After zoom: offset' = screenPoint - worldPoint * newScale
    const mouseWorldX = (pointer.x - viewport.offset.x) / oldScale
    const mouseWorldY = (pointer.y - viewport.offset.y) / oldScale
    
    const newOffsetX = pointer.x - mouseWorldX * clampedScale
    const newOffsetY = pointer.y - mouseWorldY * clampedScale
    
    useCanvasStore.getState().setViewport({
      scale: clampedScale,
      offset: { x: newOffsetX, y: newOffsetY }
    })
    
    // Update mouse position for drawing preview
    setMousePosition(snapPoint({ x: mouseWorldX, y: mouseWorldY }))
  }
  
  // Coordinates Hook
  const { screenToWorld, snapPoint } = useCanvasCoordinates()

  // Selection Hooks
  const { handleStageClick: handleSelectionClick } = useSelectionHandler()
  const { 
    isBoxSelecting, 
    selectionStart, 
    selectionEnd, 
    handleMouseDown: handleBoxParam, 
    handleMouseMove: handleBoxMove, 
    handleMouseUp: handleBoxUp 
  } = useBoxSelection(screenToWorld)
  
  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    const pointerPosition = stage?.getPointerPosition()
    if (!pointerPosition) return
    
    // Convert to world coordinates and snap
    let point = screenToWorld({ x: pointerPosition.x, y: pointerPosition.y })
    point = snapPoint(point)
    
    // Handle window/door placement
    if (currentTool === 'window' || currentTool === 'door') {
      console.log('Attempting opening placement', { tool: currentTool, point })

      // If we have a valid ghost opening, use it directly (WYSIWYG)
      if (ghostOpening) {
        // Use ghostOpening properties but allow addOpening to generate ID
        addOpening(ghostOpening.wallId, currentTool, ghostOpening.position, {
            ...activeOpeningType,
            width: ghostOpening.width,
            height: ghostOpening.height,
            sillHeight: ghostOpening.sillHeight,
            subtype: ghostOpening.subtype
        })
        console.log('Placed opening using ghost')
        return
      }

      // Fallback to calculation if ghost is missing (e.g. click without move)
      // Find closest wall
      let closestWall = null
      let minDistance = Infinity
      let closestPosition = 0
      
      walls.forEach(wall => {
        if (wall.points.length < 2) return
        
        // Calculate total wall length first
        let totalLen = 0
        for (let i = 0; i < wall.points.length - 1; i++) {
            const s = wall.points[i]
            const e = wall.points[i+1]
            totalLen += Math.sqrt(Math.pow(e.x - s.x, 2) + Math.pow(e.y - s.y, 2))
        }
        if (totalLen === 0) return

        let currentLen = 0
        
        // Iterate segments
        for (let i = 0; i < wall.points.length - 1; i++) {
            const start = wall.points[i]
            const end = wall.points[i+1]
            const segLen = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
            
            if (segLen === 0) continue

            // Distance to segment
            const t = Math.max(0, Math.min(1, 
              ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / (segLen * segLen)
            ))
            
            const projX = start.x + t * (end.x - start.x)
            const projY = start.y + t * (end.y - start.y)
            const d = Math.sqrt(Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2))
            
            if (d < minDistance) {
                minDistance = d
                closestWall = wall
                // Map local segment t to global wall position
                closestPosition = (currentLen + t * segLen) / totalLen
            }
            currentLen += segLen
        }
      })
      
      if (closestWall && minDistance < 0.5) { // Threshold 0.5m
        console.log('Found wall for opening', { wallId: (closestWall as Wall).id, distance: minDistance, pos: closestPosition })
        addOpening((closestWall as Wall).id, currentTool, closestPosition, activeOpeningType || undefined)
      } else {
        console.log('No wall found nearby', { minDistance, closestWall: closestWall ? 'found' : 'null' })
      }
      return
    }
    
    // Handle Staircase Placement
    if (currentTool === 'staircase') {
        const defaultHeight = activeStory?.height || 2700
        addStaircase({
            type: 'straight',
            position: point,
            rotation: 0,
            storyId: activeStoryId || undefined,
            topStoryId: storyAbove?.id || undefined,
            width: 1000,
            treadDepth: 250,
            totalRise: defaultHeight,
            riserHeight: 175,
            direction: 'left', // Default
            material: 'concrete',
            hasRailing: true
        })
        setTool('select') // Switch back to select after placement
        return
    }

    // Handle wall drawing
    if (currentTool === 'wall') {
      if (!isDrawing) {
        startWall(point)
      } else {
         // Apply Angle Snap on Click (Same logic as MouseMove)
         let finalPoint = point
         if (currentWall.length > 0 && !(e.evt.ctrlKey || e.evt.metaKey)) {
            const startPoint = currentWall[currentWall.length - 1]
            const dx = point.x - startPoint.x
            const dy = point.y - startPoint.y
            const dist = Math.sqrt(dx*dx + dy*dy)
            
            if (dist > 0.1) {
                const currentAngle = Math.atan2(dy, dx)
                // Snap to 15-degree increments
                const snapInterval = Math.PI / 12
                const snappedAngle = Math.round(currentAngle / snapInterval) * snapInterval
                
                finalPoint = {
                    x: startPoint.x + Math.cos(snappedAngle) * dist,
                    y: startPoint.y + Math.sin(snappedAngle) * dist
                }
            }
         }
        addWallPoint(finalPoint)
      }
      return
    }

    // Handle Electrical Placement
    if (['socket', 'switch', 'light', 'db', 'isolator'].includes(currentTool)) {
        let finalPosition = point

        // Wall Snapping for Wall-Mounted Fixtures (DB, Socket, Switch, Isolator)
        if (['socket', 'switch', 'db', 'isolator'].includes(currentTool)) {
             let closestWall = null
             let minDistance = Infinity
             let closestProj = { x: 0, y: 0 }
             
             walls.forEach(wall => {
                if (wall.points.length < 2) return
                
                for (let i = 0; i < wall.points.length - 1; i++) {
                    const start = wall.points[i]
                    const end = wall.points[i+1]
                    const segLen = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
                    
                    if (segLen === 0) continue

                    // Project point onto segment
                    const t = Math.max(0, Math.min(1, 
                      ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / (segLen * segLen)
                    ))
                    
                    const projX = start.x + t * (end.x - start.x)
                    const projY = start.y + t * (end.y - start.y)
                    const d = Math.sqrt(Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2))
                    
                    if (d < minDistance) {
                        minDistance = d
                        closestWall = wall
                        closestProj = { x: projX, y: projY }
                    }
                }
             })

             // Snap if within 0.5m
             if (closestWall && minDistance < 0.5) {
                 // Calculate offset to edge
                 // Vector of wall segment
                 const dx = (closestWall as Wall).points[1].x - (closestWall as Wall).points[0].x
                 const dy = (closestWall as Wall).points[1].y - (closestWall as Wall).points[0].y
                 const len = Math.sqrt(dx * dx + dy * dy)
                 
                 // Unit normal vector (perpendicular)
                 const nx = -dy / len
                 const ny = dx / len
                 
                 // Vector from wall start to click point
                 const vx = point.x - (closestWall as Wall).points[0].x
                 const vy = point.y - (closestWall as Wall).points[0].y
                 
                 // Dot product with normal determines side
                 const side = (vx * nx + vy * ny) > 0 ? 1 : -1
                 
                 // Wall thickness (default 0.22m / 220mm if not set)
                 const thickness = (closestWall as Wall).thickness || 0.22
                 const offset = (thickness / 2) * side
                 
                 // Apply offset to projected point
                 finalPosition = {
                     x: closestProj.x + nx * offset,
                     y: closestProj.y + ny * offset,
                 }
             }
        }

        addElectricalPoint({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: currentTool as any,
            position: finalPosition,
            height: mepConfig.electrical.routingMode === 'ceiling' ? 300 : 300, // Default constraint
            roomId: undefined // TODO: detect room
        })
        return
    }

    // Handle Plumbing Placement
    if (['basin', 'sink', 'shower', 'toilet', 'bath', 'washing_machine', 'source'].includes(currentTool)) {
        if (ghostPlumbing) {
            addPlumbingPoint({
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: currentTool as any,
                subtype: ghostPlumbing.subtype,
                position: ghostPlumbing.position,
                rotation: ghostPlumbing.rotation,
                isSource: ghostPlumbing.isSource,
                width: ghostPlumbing.width,
                length: ghostPlumbing.length,
                wallId: ghostPlumbing.wallId
            })
        } else {
             addPlumbingPoint({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: currentTool as any,
                position: point,
                isSource: currentTool === 'source',
                // Use active variant if available even if no ghost
                subtype: activePlumbingVariant?.id,
                width: activePlumbingVariant?.width,
                length: activePlumbingVariant?.length
            })
        }
        return
    }



  }

  // Dead handleMouseMove removed — handleMouseMoveCanvas handles everything

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        completeWall()
        detectRooms() // Detect rooms after completing wall
      } else if (e.key === 'Enter' && isDrawing) {
        completeWall()
        detectRooms() // Detect rooms after completing wall
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isDrawing, completeWall, detectRooms])

  // Handle Delete and Undo/Redo Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Undo/Redo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            if (e.shiftKey) {
                useCanvasStore.temporal.getState().redo()
            } else {
                useCanvasStore.temporal.getState().undo()
            }
            e.preventDefault()
            return
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            useCanvasStore.temporal.getState().redo()
            e.preventDefault()
            return
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            const { deleteSelection } = useCanvasStore.getState()
            
            // Prevent backspace from navigating back
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            deleteSelection()
            e.preventDefault() // Good practice for delete key
        }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-detect rooms when walls change
  useEffect(() => {
    if (walls.length > 0) {
      detectRooms()
    }
  }, [walls, detectRooms])

  // Mouse move for panning
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // Middle mouse button to pan
    if (e.evt.button === 1) {  // Middle mouse button
      setIsPanning(true)
      const pos = e.target.getStage()?.getPointerPosition()
      if (pos) {
        setPanStart({ x: pos.x, y: pos.y })
      }
    }
  }
  
  const handleMouseMoveCanvas = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    const pointerPosition = stage?.getPointerPosition()
    if (!pointerPosition) return
    
    // Handle panning
    if (isPanning && panStart) {
      const dx = pointerPosition.x - panStart.x
      const dy = pointerPosition.y - panStart.y
      panBy({ x: dx, y: dy })
      setPanStart({ x: pointerPosition.x, y: pointerPosition.y })
      return
    }
    
    // Update mouse position for drawing preview
    const worldPos = screenToWorld({ x: pointerPosition.x, y: pointerPosition.y })
    // Standard Snap (Grid/Points)
    let snapped = snapPoint(worldPos)

    // --- Wall Drawing Angle Snap ---
    if (isDrawing && currentWall.length > 0 && !(e.evt.ctrlKey || e.evt.metaKey)) {
        const startPoint = currentWall[currentWall.length - 1]
        const dx = snapped.x - startPoint.x
        const dy = snapped.y - startPoint.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        
        if (dist > 0.1) {
            const currentAngle = Math.atan2(dy, dx)
            // Snap to 15-degree increments (0, 15, 30, 45, 60, 75, 90...)
            const snapInterval = Math.PI / 12
            const snappedAngle = Math.round(currentAngle / snapInterval) * snapInterval
            
            snapped = {
                x: startPoint.x + Math.cos(snappedAngle) * dist,
                y: startPoint.y + Math.sin(snappedAngle) * dist
            }
        }
    }
    // -------------------------------

    setMousePosition(snapped)

    // Calculate ghost opening for preview
     if (currentTool === 'window' || currentTool === 'door') {
       let closestWall = null
       let minDistance = Infinity
       let closestPosition = 0
       
       walls.forEach(wall => {
         if (wall.points.length < 2) return
         
         let totalLen = 0
         for (let i = 0; i < wall.points.length - 1; i++) {
             const s = wall.points[i]
             const e = wall.points[i+1]
             totalLen += Math.sqrt(Math.pow(e.x - s.x, 2) + Math.pow(e.y - s.y, 2))
         }
         if (totalLen === 0) return

         let currentLen = 0
         
         for (let i = 0; i < wall.points.length - 1; i++) {
             const start = wall.points[i]
             const end = wall.points[i+1]
             const segLen = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
             
             if (segLen === 0) continue

             // Use snapped position
             const t = Math.max(0, Math.min(1, 
               ((snapped.x - start.x) * (end.x - start.x) + (snapped.y - start.y) * (end.y - start.y)) / (segLen * segLen)
             ))
             
             const projX = start.x + t * (end.x - start.x)
             const projY = start.y + t * (end.y - start.y)
             const d = Math.sqrt(Math.pow(snapped.x - projX, 2) + Math.pow(snapped.y - projY, 2))
             
             if (d < minDistance) {
                 minDistance = d
                 closestWall = wall
                 closestPosition = (currentLen + t * segLen) / totalLen
             }
             currentLen += segLen
         }
       })

       if (closestWall && minDistance < 0.5) {
         setGhostOpening({
           id: 'ghost-preview',
           wallId: (closestWall as Wall).id,
           type: currentTool,
           position: closestPosition,
           width: activeOpeningType?.width || (currentTool === 'door' ? 0.9 : 1.2),
           height: activeOpeningType?.height || (currentTool === 'door' ? 2.1 : 1.5),
           sillHeight: activeOpeningType?.sillHeight || (currentTool === 'door' ? 0 : 0.9),
           subtype: activeOpeningType?.subtype
         } as Opening)
       } else {
         setGhostOpening(null)
       }
    } else if (['basin', 'sink', 'shower', 'toilet', 'bath', 'washing_machine', 'source'].includes(currentTool)) {
       // Handle Plumbing Ghost
       setGhostOpening(null)
       
       let finalPosition = snapped
       let finalRotation = 0
       let closestWallId: string | undefined = undefined

       // Wall Snapping & Auto-Rotation
       let closestWall: Wall | null = null
       let minDistance = Infinity
       let closestProj = { x: 0, y: 0 }
       
       walls.forEach(wall => {
           if (wall.points.length < 2) return
           
           for (let i = 0; i < wall.points.length - 1; i++) {
               const start = wall.points[i]
               const end = wall.points[i+1]
               const segLen = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
               
               if (segLen === 0) continue

               const t = Math.max(0, Math.min(1, 
                   ((snapped.x - start.x) * (end.x - start.x) + (snapped.y - start.y) * (end.y - start.y)) / (segLen * segLen)
               ))
               
               const projX = start.x + t * (end.x - start.x)
               const projY = start.y + t * (end.y - start.y)
               const d = Math.sqrt(Math.pow(snapped.x - projX, 2) + Math.pow(snapped.y - projY, 2))
               
               if (d < minDistance) {
                   minDistance = d
                   closestWall = wall
                   closestProj = { x: projX, y: projY }
               }
           }
       })

       if (closestWall && minDistance < 0.8) { 
            closestWallId = (closestWall as Wall).id
            
            // Standard Wall Snap Defaults
            const dx = (closestWall as Wall).points[1].x - (closestWall as Wall).points[0].x
            const dy = (closestWall as Wall).points[1].y - (closestWall as Wall).points[0].y
            const wallAngle = Math.atan2(dy, dx) * (180 / Math.PI)
            const len = Math.sqrt(dx*dx + dy*dy)
            const nx = -dy / len
            const ny = dx / len
            const start = (closestWall as Wall).points[0]
            const end = (closestWall as Wall).points[1] // Assuming simple line walls
            
            // --- CORNER DETECTION ---
            // Check if we are near Start or End of closest wall
            const distToStart = Math.sqrt(Math.pow(closestProj.x - start.x, 2) + Math.pow(closestProj.y - start.y, 2))
            const distToEnd = Math.sqrt(Math.pow(closestProj.x - end.x, 2) + Math.pow(closestProj.y - end.y, 2))
            const cornerThreshold = 0.4 // 40cm snap to corner

            let isCorner = false
            let vertex = { x: 0, y: 0 }
            let connectedWall: Wall | null = null
            
            if (distToStart < cornerThreshold) vertex = start
            else if (distToEnd < cornerThreshold) vertex = end
            
            if (distToStart < cornerThreshold || distToEnd < cornerThreshold) {
                // Find connected wall
                connectedWall = walls.find(w => 
                    w.id !== (closestWall as Wall).id && 
                    (
                        (Math.abs(w.points[0].x - vertex.x) < 0.01 && Math.abs(w.points[0].y - vertex.y) < 0.01) ||
                        (Math.abs(w.points[w.points.length-1].x - vertex.x) < 0.01 && Math.abs(w.points[w.points.length-1].y - vertex.y) < 0.01)
                    )
                ) || null

                if (connectedWall) isCorner = true
            }

            if (isCorner && connectedWall) {
                // --- CORNER SNAP LOGIC ---
                // We have two walls meeting at 'vertex'
                // Wall 1 Vector (Away from vertex)
                const isStart1 = (Math.abs(start.x - vertex.x) < 0.01 && Math.abs(start.y - vertex.y) < 0.01)
                const v1x = isStart1 ? dx : -dx // vector V -> Wall1 End
                const v1y = isStart1 ? dy : -dy
                
                // Wall 2 Vector (Away from vertex)
                // Simplify: assume 2 pts
                const w2s = connectedWall.points[0]
                const w2e = connectedWall.points[1]
                const isStart2 = (Math.abs(w2s.x - vertex.x) < 0.01 && Math.abs(w2s.y - vertex.y) < 0.01)
                const dx2 = w2e.x - w2s.x
                const dy2 = w2e.y - w2s.y
                const v2x = isStart2 ? dx2 : -dx2 // vector V -> Wall2 End
                const v2y = isStart2 ? dy2 : -dy2

                // Angles
                const a1 = Math.atan2(v1y, v1x) * (180 / Math.PI)
                const a2 = Math.atan2(v2y, v2x) * (180 / Math.PI)
                
                // Normalize 0-360? Or just find difference.
                // We want to align the fixture's Corner (Top-Left, -w/2, -l/2) to Vertex.
                // Fixture sides are Right (0deg) and Down (90deg) relative to fixture rotation R.
                // So rotated sides are R and R+90.
                // We want {R, R+90} to align with {a1, a2}.
                
                // Case 1: R aligns with a1, R+90 aligns with a2. => R = a1. Check if a2 approx a1+90 or a1-270.
                // Case 2: R aligns with a2, R+90 aligns with a1. => R = a2. Check if a1 approx a2+90...
                
                // Normalize angles to positive
                const norm = (a: number) => (a < 0 ? a + 360 : a) % 360
                const na1 = norm(a1)
                const na2 = norm(a2)
                
                const diff = Math.abs(na1 - na2)
                // expect approx 90 or 270 (which is -90)
                
                if (Math.abs(diff - 90) < 5 || Math.abs(diff - 270) < 5) {
                    // Valid Corner
                    
                    // Possible Rotations: na1 or na2?
                    // If R=na1, then adjacent side is na1+90. Is na2 == na1+90?
                    // Example: Wall1 Right (0), Wall2 Down (90). na1=0, na2=90.
                    // If R=0, sides are 0 and 90. Matches.
                    // What if Wall1 Down (90), Wall2 Left (180). na1=90, na2=180.
                    // If R=90, sides are 90 and 180. Matches.
                    // What if Wall1 Left (180), Wall2 Up (270). na1=180, na2=270.
                    // If R=180, sides 180 and 270. Matches.
                    // What if Wall1 Up (270), Wall2 Right (0). na1=270, na2=0.
                    // If R=270, sides 270 and 360(0). Matches.
                    
                    // So R should be the angle that, when +90, gives the other angle.
                    // Check if (na1 + 90) % 360 == na2 ? Then R = na1.
                    // Check if (na2 + 90) % 360 == na1 ? Then R = na2.
                    
                    let bestRot = 0
                    if (Math.abs(norm(na1 + 90) - na2) < 5) bestRot = na1
                    else if (Math.abs(norm(na2 + 90) - na1) < 5) bestRot = na2
                    else {
                        // Maybe order is swapped? 
                        // Actually, plumbing shapes define top-left corner.
                        // Standard rotation: Top Edge is 0 deg (Right). Left Edge is 90 deg (Down).
                        // Wait, my previous assumption:
                        // Top-Left corner (-w/2, -l/2).
                        // Top edge vector (from corner): Right (1,0). Angle 0.
                        // Left edge vector (from corner): Down (0,1). Angle 90.
                        // Yes.
                        // So if we rotate by R:
                        // Edge1 is R. Edge2 is R+90.
                        // We found that relationship above.
                        bestRot = na1 // Fallback
                    }
                    
                    finalRotation = bestRot
                    
                    // Calculate Center Offset
                    // Vector from Corner to Center is (+w/2, +l/2).
                    // Rotate this vector by R.
                    const rRad = finalRotation * (Math.PI / 180)
                    const wHalf = activePlumbingVariant?.width ? activePlumbingVariant.width / 2000 : 0.45 // mm to m / 2
                    const lHalf = activePlumbingVariant?.length ? activePlumbingVariant.length / 2000 : 0.45
                    
                    const offsetX = wHalf * Math.cos(rRad) - lHalf * Math.sin(rRad)
                    const offsetY = wHalf * Math.sin(rRad) + lHalf * Math.cos(rRad)
                    
                    // --- CORNER INSIDE OFFSET ---
                    // Vertex is the intersection of centerlines.
                    // We need to move "In" by thickness/2 for both walls.
                    // Move along the diagonals? Or just add offset vectors?
                    // Offset Vector 1: along Wall 1 Normal (towards Inside). Magnitude T1/2.
                    // Offset Vector 2: along Wall 2 Normal (towards Inside). Magnitude T2/2.
                    // Which Normal direction?
                    // "Inside" is where the mouse/fixture is.
                    // We can determine "Inside" Normal by checking vector from Vertex to Ghost Position (approx).
                    // Or use the edge vectors already computed.
                    // Fixture is being placed at Vertex + Offset.
                    // Fixture occupies space in Quadrant R to R+90.
                    // So we must shift Vertex in that direction.
                    // Shift Direction is exactly the same as (offsetX, offsetY) direction?
                    // No, (offsetX, offsetY) points to Center of fixture.
                    // We need to shift the "Corner" of the fixture to the "Inner Corner" of walls.
                    // Inner Corner is Vertex + Shift.
                    // If corner is 90 deg, Shift is (Thickness1/2) along Wall2 direction + (Thickness2/2) along Wall1 direction?
                    // Yes. We want to move AWAY from Wall 1 Centerline (perp) and AWAY from Wall 2 (perp).
                    // That is equivalent to moving along the other wall's vector?
                    // If walls are defaults (0.22):
                    const t1 = (closestWall as Wall).thickness || 0.22
                    const t2 = connectedWall.thickness || 0.22
                    
                    // We determined bestRot aligns with Wall 1 vector (v1).
                    // So Direction v1 aligns with Fixture Top Edge (Width).
                    // Direction v2 aligns with Fixture Left Edge (Height, or Depth).
                    // To stay "Inside", we must move PERPENDICULAR to v1 and PERPENDICULAR to v2.
                    // Direction Perpendicular to v1 is v2 (for 90 deg).
                    // Direction Perpendicular to v2 is v1 (for 90 deg).
                    // So we shift by T2/2 along v1 direction? 
                    // No, shift perpendicular to v1 is moving along v2?
                    // Yes. To clear Wall 1 thickness, we move along v2 direction by T1/2.
                    // To clear Wall 2 thickness, we move along v1 direction by T2/2.
                    
                    const v1Len = Math.sqrt(v1x*v1x + v1y*v1y)
                    const v2Len = Math.sqrt(v2x*v2x + v2y*v2y)
                    
                    // Normalized vectors
                    const nv1x = v1x / v1Len
                    const nv1y = v1y / v1Len
                    const nv2x = v2x / v2Len
                    const nv2y = v2y / v2Len
                    
                    // Shift
                    const cornerShiftX = (nv1x * (t2/2)) + (nv2x * (t1/2))
                    const cornerShiftY = (nv1y * (t2/2)) + (nv2y * (t1/2))
                    
                    finalPosition = {
                        x: vertex.x + cornerShiftX + offsetX,
                        y: vertex.y + cornerShiftY + offsetY
                    }
                    
                    // If shower, we might need extra nudge if it has a frame? Usually shapes are exact.
                } else {
                   // Corner not 90 degrees? Fallback to standard logic or bisect?
                   // For now, fallback to single wall snap logic
                   isCorner = false // Proceed to standard logic below
                }
            } 
            
            if (!isCorner) {
                 // --- STANDARD WALL SNAP (Existing Logic) ---
                 const vx = snapped.x - start.x
                 const vy = snapped.y - start.y
                 // Side determines which side of wall we are.
                 // Normal (-dy, dx).
                 const side = (vx * nx + vy * ny) > 0 ? 1 : -1
                 
                 // ROTATION FIX:
                 // Previous: wallAngle + (side === 1 ? -90 : 90) -> Perpendicular
                 // New: Align "Back" of fixture with Wall.
                 // If "Back" is Local Top (-Y?), and we want Back to face Wall.
                 // Wall Normal points Out. Side 1 means we are on "Positive Normal" side.
                 // So Wall is "Below" us (relative to Normal)? No, Normal points to us. Wall is "Behind" Normal.
                 // We want Back (Top) to point to Wall (Behind Normal).
                 // So Top points -Normal.
                 // If Normal is Angle N. Top is N + 180.
                 // Fixture Rotation R. Top is R - 90.
                 // R - 90 = N + 180 => R = N + 270 = N - 90.
                 // N is WallAngle - 90 (if side 1?).
                 // Let's stick to the 0/180 logic.
                 // If Side 1 (Normal Side). We want Back to face Wall. Back is Up (-90). Normal is Up (-90).
                 // Wait, normal is (-dy, dx).
                 // Simple logic check:
                 // If Side 1: Rotation = WallAngle. (Back aligns with wall).
                 // If Side -1: Rotation = WallAngle + 180.
                 
                 finalRotation = wallAngle + (side === 1 ? 0 : 180)
                 
                 const thickness = (closestWall as Wall).thickness || 0.22
                 const depth = (activePlumbingVariant?.length || 500) / 1000 
                 
                 // OFFSET FIX:
                 // Depth is Local Height (Length).
                 // If R=0 (WallAngle). Top is Back.
                 // Center is at 0,0?.
                 // We want Back (Top) to touch Wall Surface.
                 // Wall Surface is at Centerline + (Thickness/2 * Side).
                 // Fixture Center should be at Surface + (Depth/2 * Side).
                 // Total Offset from Centerline = (Thickness/2 + Depth/2) * Side.
                 // This matches existing logic.
                 const offsetDist = (thickness / 2) + (depth / 2)
                 
                 finalPosition = {
                     x: closestProj.x + nx * offsetDist * side,
                     y: closestProj.y + ny * offsetDist * side
                 }
            }
       } 

       setGhostPlumbing({
           id: 'ghost',
           type: currentTool as 'basin' | 'sink' | 'shower' | 'toilet' | 'bath' | 'washing_machine' | 'source',
           subtype: activePlumbingVariant?.id,
           position: finalPosition,
           rotation: finalRotation,
           isSource: currentTool === 'source',
           width: activePlumbingVariant?.width,
           length: activePlumbingVariant?.length,
           wallId: closestWallId
       })

    } else {
      setGhostOpening(null)
      setGhostPlumbing(null)
    }
  }
  
  const handleMouseUp = () => {
    setIsPanning(false)
    setPanStart(null)
  }
  


  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div ref={containerRef} className={twMerge("w-full h-full bg-slate-50 relative overflow-hidden", className)} />
    )
  }

  return (
    <div ref={containerRef} className={twMerge("w-full h-full bg-slate-50 relative overflow-hidden", className)}>
      <Stage 
        width={dimensions.width} 
        height={dimensions.height}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        x={viewport.offset.x}
        y={viewport.offset.y}
        onClick={(e) => {
            handleStageClick(e)
            handleSelectionClick(e)
        }}
        onMouseMove={(e) => {
            handleMouseMoveCanvas(e)
            handleBoxMove(e)
        }}
        onMouseDown={(e) => {
            handleMouseDown(e)
            handleBoxParam(e)
        }}
        onMouseUp={() => {
             handleMouseUp()
             handleBoxUp()
        }}
        onWheel={handleWheel}
      >
        <Layer>
          {/* Background */}
          <Rect name="grid-background" x={-viewport.offset.x / viewport.scale} y={-viewport.offset.y / viewport.scale} width={dimensions.width / viewport.scale} height={dimensions.height / viewport.scale} fill="#f8fafc" />
          


          {/* --- Ghost Layer (Below) --- */}
          {storyBelow && (
            <Group opacity={0.3} listening={false}>
                <RoomRenderer rooms={belowRooms} currentTool="select" />
                <WallRenderer 
                    walls={belowWalls} 
                    openings={belowOpenings} 
                    selection={[]} 
                    currentTool="select"
                    templateMap={templateMap}
                />
                <OpeningRenderer 
                    openings={belowOpenings} 
                    walls={belowWalls} 
                    selection={[]} 
                />
            </Group>
          )}

          {/* Rooms - Rendered FIRST (Bottom Layer) to avoid blocking interactions */}
          <RoomRenderer
            rooms={activeRooms}
            onRoomClick={selectRoom}
            selectedRoomId={selectedElement?.type === 'room' ? (selectedElement.data as Room)?.id : undefined}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentTool={currentTool as any}
          />

          {/* Grid */}
          <GridRenderer width={dimensions.width} height={dimensions.height} />
          
          
          {/* Completed Walls */}
          <WallRenderer 
            walls={activeWalls}
            openings={activeOpenings}
            onWallClick={selectWall}
            onWallUpdate={useCanvasStore.getState().updateWall}
            onBreak={useCanvasStore.getState().breakWall}
            selectedWallId={selectedElement?.type === 'wall' ? (selectedElement.data as Wall)?.id : undefined}
            selection={useCanvasStore.getState().selection}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentTool={currentTool as any}
            templateMap={templateMap} // Pass the map
          />

          {/* MEP Layover - Filter Points inside Render Component or pass filtered list? */}
          {/* For now, assuming MEP renderer handles its own store access. We might need to update it too. */}
          {/* MEP Layover - Filter Points inside Render Component or pass filtered list? */}
          {/* For now, assuming MEP renderer handles its own store access. We might need to update it too. */}
          <MEPRendererComponent ghostPoint={ghostPlumbing || undefined} />
          
          {/* Render Dimensions Helper */}
          <TemporaryDimensions />
          
          {/* Auto Exterior Dimensions */}
          {showDimensions && <AutoDimensionRenderer />}
          
          {/* Openings (Windows & Doors) - Rendered LAST (Top Layer) */}
          <OpeningRenderer 
            openings={activeOpenings}
            walls={activeWalls}
            onOpeningClick={(id) => {
              // Select/deselect opening
              if (selectedElement?.type === 'opening' && selectedElement.data.id === id) {
                useCanvasStore.getState().clearSelection()
              } else {
                const opening = openings.find(o => o.id === id)
                if (opening) {
                  useCanvasStore.getState().selectElement({ type: 'opening', data: opening })
                }
              }
            }}
            selectedOpeningId={selectedElement?.type === 'opening' ? (selectedElement.data as Opening)?.id : undefined}
            selection={useCanvasStore.getState().selection}
            onOpeningUpdate={(id, updates) => updateOpening(id, updates)}
            ghostOpening={ghostOpening}
          />

          {/* --- Ghost Layer (Above) --- */}
          {storyAbove && (
            <Group opacity={0.3} listening={false}>
                <RoomRenderer rooms={aboveRooms} currentTool="select" />
                <WallRenderer 
                    walls={aboveWalls} 
                    openings={aboveOpenings} 
                    selection={[]} 
                    currentTool="select"
                    templateMap={templateMap}
                />
                 <OpeningRenderer 
                    openings={aboveOpenings} 
                    walls={aboveWalls} 
                    selection={[]} 
                />
            </Group>
          )}

          
          {/* Drawing Preview */}
          {isDrawing && <DrawingPreview currentWall={currentWall} mousePosition={mousePosition} />}
          
          {/* Box Selection Overlay */}
          <BoxSelectOverlay 
              start={selectionStart} 
              end={selectionEnd} 
              visible={isBoxSelecting} 
          />
          <RoofRenderer />
          <RoofFootprintEditor />
        </Layer>
      </Stage>
      
      {/* Interactive Dimensions Overlay */}
      <InteractiveDimensionInput key={activeDimension?.wallId} />
      
      {/* Toolbar */}
      <div className="absolute top-4 left-4">
        {/* Helper for positioning context if needed, but components handle their own absolute */}
      </div>

       <MEPToolbar />
       
       {/* Setup Wizard */}
       {!mepConfig.hasCompletedWizard && (currentTool === 'db' || currentTool === 'sink' || currentTool === 'socket') && (
           <MEPSetupWizard 
                onClose={() => {
                    // Handle close
                }} 
                initialTab={['sink', 'source', 'toilet'].includes(currentTool) ? 'plumbing' : 'electrical'}
           />
       )}
      
       <ToolPalette />
      
      {/* Viewport Controls */}
      <HistoryToolbar />
      <ViewportToolbar />
      <OpeningLibraryModal 
        isOpen={activeLibraryModal === 'door' || activeLibraryModal === 'window'}
        onClose={() => {
           closeLibrary()
           // Optional: revert to select if cancelled? 
           // setTool('select') 
        }}
        onSelect={handleOpeningSelect}
        type={(activeLibraryModal === 'door' || activeLibraryModal === 'window') ? activeLibraryModal : 'door'}
      />
      
      <FixtureLibraryModal
        isOpen={showPlumbingLibrary}
        onClose={() => {
            setShowPlumbingLibrary(false)
            // If we closed without selecting and we just switched tools, maybe we should keep the tool active but just use default?
            // Or revert to select? User might just want to place default.
            // Let's keep tool active.
        }}
        onSelect={handlePlumbingSelect}
        activeType={currentTool}
        currentVariantId={activePlumbingVariant?.id}
      />
      
      {/* Story (Level) Manager */}
      <StoryControlPanel />

      {/* 3D Roof Preview */}
      <Roof3DPreview />

      {/* Info Display */}
      <StatusBar />
    </div>
  )
}
