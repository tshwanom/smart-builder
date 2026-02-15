'use client'

import React, { useEffect, useState } from 'react'
import { useCanvasStore } from '../../../application/store'
import { Undo2, Redo2 } from 'lucide-react'

export const HistoryToolbar: React.FC = () => {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    const unsub = useCanvasStore.temporal.subscribe((state) => {
      setCanUndo(state.pastStates.length > 0)
      setCanRedo(state.futureStates.length > 0)
    })
    return unsub
  }, [])

  const handleUndo = () => {
    useCanvasStore.temporal.getState().undo()
  }

  const handleRedo = () => {
    useCanvasStore.temporal.getState().redo()
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1 flex gap-1 border border-slate-200">
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className={`p-2 rounded transition-colors ${
          canUndo 
            ? 'hover:bg-blue-50 text-slate-700' 
            : 'text-slate-300 cursor-not-allowed'
        }`}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={20} />
      </button>
      
      <div className="w-px bg-slate-200 my-1"></div>
      
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className={`p-2 rounded transition-colors ${
          canRedo 
            ? 'hover:bg-blue-50 text-slate-700' 
            : 'text-slate-300 cursor-not-allowed'
        }`}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={20} />
      </button>
    </div>
  )
}
