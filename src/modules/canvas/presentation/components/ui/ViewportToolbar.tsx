'use client'

import React from 'react'
import { useCanvasStore } from '../../../application/store'
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Magnet, Ruler } from 'lucide-react'

export const ViewportToolbar: React.FC = () => {
  const {
    viewport,
    gridSettings,
    zoomIn,
    zoomOut,
    resetView,
    toggleGrid,
    toggleSnap,
    toggleDimensions,
    showDimensions
  } = useCanvasStore()

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className="flex flex-col gap-1 border-b border-gray-200 pb-2">
        <button
          onClick={zoomIn}
          className="p-2 hover:bg-blue-50 rounded transition-colors"
          title="Zoom In (Scroll Up)"
        >
          <ZoomIn size={20} className="text-gray-700" />
        </button>
        
        <div className="text-xs text-center text-gray-600 font-mono">
          {Math.round(viewport.scale * 100)}%
        </div>
        
        <button
          onClick={zoomOut}
          className="p-2 hover:bg-blue-50 rounded transition-colors"
          title="Zoom Out (Scroll Down)"
        >
          <ZoomOut size={20} className="text-gray-700" />
        </button>
        
        <button
          onClick={resetView}
          className="p-2 hover:bg-blue-50 rounded transition-colors"
          title="Reset View (100%)"
        >
          <Maximize2 size={20} className="text-gray-700" />
        </button>
      </div>
      
      {/* Grid & Snap Controls */}
      <div className="flex flex-col gap-1">
        <button
          onClick={toggleGrid}
          className={`p-2 rounded transition-colors ${
            gridSettings.showGrid 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Toggle Grid (100mm)"
        >
          <Grid3x3 size={20} />
        </button>
        
        <button
          onClick={toggleSnap}
          className={`p-2 rounded transition-colors ${
            gridSettings.snapToGrid 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Toggle Snap to Grid"
        >
          <Magnet size={20} />
        </button>

        <button
          onClick={toggleDimensions}
          className={`p-2 rounded transition-colors ${
            showDimensions 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Toggle Auto Dimensions"
        >
           <Ruler size={20} />
        </button>
      </div>
    </div>
  )
}
