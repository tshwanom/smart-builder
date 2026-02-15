import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useCanvasStore } from '../../../application/store'
import { ArrowLeft, ArrowRight, ArrowLeftRight, X } from 'lucide-react'

export const InteractiveDimensionInput: React.FC = () => {
  const { activeDimension, setActiveDimension, resizeWall } = useCanvasStore()
  // Initialize in Millimeters (no decimals usually, maybe 1)
  const [value, setValue] = useState(activeDimension ? Math.round(activeDimension.currentLength * 1000).toString() : '')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSubmit = useCallback((side: 'start' | 'end' | 'center') => {
      // Allow comma as decimal separator if user types it
      const normalizedValue = value.replace(',', '.')
      const valMM = parseFloat(normalizedValue)
      
      if (!isNaN(valMM) && valMM > 0 && activeDimension) {
          const valMeters = valMM / 1000

          if (activeDimension.referenceWallId && activeDimension.wallId) {
             // RELATIVE MOVE LOGIC
             const store = useCanvasStore.getState()
             const selectedWall = store.walls.find(w => w.id === activeDimension.wallId)
             const refWall = store.walls.find(w => w.id === activeDimension.referenceWallId)
             
             if (selectedWall && refWall) {
                 // 1. Calculate Delta (Change in length)
                 // activeDimension.currentLength is the OLD length of refWall
                 const deltaLen = valMeters - activeDimension.currentLength
                 
                 // 2. Determine Direction
                 // We need to move selectedWall along the axis of refWall.
                 // Vector of RefWall:
                 const rv = { x: refWall.points[1].x - refWall.points[0].x, y: refWall.points[1].y - refWall.points[0].y }
                 const rLen = Math.sqrt(rv.x*rv.x + rv.y*rv.y)
                 const rDir = { x: rv.x/rLen, y: rv.y/rLen }
                 
                 // Which end of RefWall is connected to SelectedWall?
                 // We check distance
                 const sP1 = selectedWall.points[0]; const sP2 = selectedWall.points[1]
                 const rP1 = refWall.points[0]; const rP2 = refWall.points[1]
                 const EPS = 0.2
                 
                 // d2 helper
                 const d2 = (a: {x: number, y: number}, b: {x: number, y: number}) => (a.x-b.x)**2 + (a.y-b.y)**2
                 
                 let moveSign = 1
                 
                 // If Selected Wall touches RefWall START -> Increasing length moves it Negative Direction (away from end)
                 if (d2(sP1, rP1) < EPS || d2(sP2, rP1) < EPS) {
                     moveSign = -1
                 }
                 // If touches P1: Increasing length moves P1 away from P0. So P1 moves in +Vec direction.
                 else if (d2(sP1, rP2) < EPS || d2(sP2, rP2) < EPS) {
                     moveSign = 1
                 }
                 
                 const moveVec = {
                     x: rDir.x * deltaLen * moveSign,
                     y: rDir.y * deltaLen * moveSign
                 }
                 
                 // Execute Move
                 store.moveWall(selectedWall.id, moveVec)
                 setActiveDimension(null)
                 return
             }
          }

          if (activeDimension.type === 'gap' && activeDimension.referenceWallId && activeDimension.direction) {
              // Gap Logic
              const currentGap = activeDimension.currentLength
              const delta = currentGap - valMeters
              
              const store = useCanvasStore.getState()
              const wall = store.walls.find(w => w.id === activeDimension.wallId)
              
              if (wall) {
                   const moveVec = {
                       x: activeDimension.direction.x * delta,
                       y: activeDimension.direction.y * delta
                   }
                   store.moveWall(wall.id, moveVec)
                   setActiveDimension(null)
              }
              
          } else {
              // Standard Length Resize (valMeters)
              resizeWall(activeDimension.wallId, valMeters, side)
          }
      }
      // setActiveDimension(null) 
  }, [value, activeDimension, setActiveDimension, resizeWall])

  useEffect(() => {
    // Auto-focus logic: Only when the dimension identity changes
    if (activeDimension?.wallId) {
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [activeDimension?.wallId, activeDimension?.referenceWallId, activeDimension?.type])

  useEffect(() => {
    // Click Outside Logic
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Check if click is outside ref
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          // Commit changes (regarded as enter)
          handleSubmit('center')
          // Force close (if handleSubmit didn't already, e.g. invalid value or no change but still close)
          setActiveDimension(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleSubmit, setActiveDimension]) 

  if (!activeDimension) return null

  const sx = activeDimension.screenPosition.x
  const sy = activeDimension.screenPosition.y
  


  return (
    <div 
      ref={containerRef}
      className="absolute z-50 flex items-center gap-1 bg-white p-1 rounded shadow-lg border border-slate-200"
      style={{
          left: sx,
          top: sy,
          transform: 'translate(-50%, -50%)' // Center on point
      }}
    >
        <input
            ref={inputRef}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit('center')
                if (e.key === 'Escape') setActiveDimension(null)
            }}
            className="w-24 px-1 py-0.5 text-sm border border-slate-300 rounded"
        />
        <div className="flex gap-0.5">
            <button 
                onClick={() => handleSubmit('start')}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Extend Start"
            >
                <ArrowLeft size={14} />
            </button>
            <button 
                onClick={() => handleSubmit('center')}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Resize Center"
            >
                <ArrowLeftRight size={14} />
            </button>
            <button 
                onClick={() => handleSubmit('end')}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Extend End"
            >
                <ArrowRight size={14} />
            </button>
        </div>
        <button 
            onClick={() => setActiveDimension(null)}
            className="ml-1 p-1 hover:bg-red-50 text-red-500 rounded"
        >
            <X size={14} />
        </button>
    </div>
  )
}
