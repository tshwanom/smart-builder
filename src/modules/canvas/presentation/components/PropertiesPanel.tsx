'use client'

import React, { useState } from 'react'
import { useGeometryStore } from '../../../../application/store/geometryStore'
import { WallSegment, Opening3D } from '../../../../domain/types'
import { Settings, X, Ruler, Home, Scissors, Trash2, ShieldCheck } from 'lucide-react'
import { EngineerModal } from './modals/EngineerModal'
import { BOQConfigPanel } from '@/modules/boq/presentation/components/BOQConfigPanel'
import { useShallow } from 'zustand/react/shallow'
import { WallCalculator } from '@/core/engine/boq-calculators/WallCalculator'

// We might re-enable this later when we have templates working fully with new store
// import { WallLayerEditor } from './ui/WallLayerEditor'
// import { useWallTemplates } from './hooks/useWallTemplates'

export const PropertiesPanel: React.FC = () => {
  // const [isEditingLayers, setIsEditingLayers] = useState(false)
  // const projectId = null 
  // const { templates } = useWallTemplates(projectId)

  const [isEngineerModalOpen, setIsEngineerModalOpen] = useState(false)

  const { 
    selectedIds, 
    project, 
    updateWall, 
    updateOpening,
    deleteWall,
    deleteOpening,
    deselect,
    updateBoqConfig,
    updateMepConfig
    // clearSelection, // available if needed
  } = useGeometryStore(useShallow(state => ({
    selectedIds: state.selectedIds,
    project: state.project,
    updateWall: state.updateWall,
    updateOpening: state.updateOpening,
    deleteWall: state.deleteWall,
    deleteOpening: state.deleteOpening,
    deselect: state.deselect,
    updateBoqConfig: state.updateBoqConfig,
    updateMepConfig: state.updateMepConfig,
    // clearSelection: state.clearSelection
  })))

  const selectedElementId = selectedIds.length > 0 ? selectedIds[0] : null
  
  // Derive selected element from ID
  let selectedElement: { type: 'wall', data: WallSegment } | { type: 'opening', data: Opening3D } | null = null
  
  if (selectedElementId) {
      const wall = project.walls.find(w => w.id === selectedElementId)
      if (wall) {
          selectedElement = { type: 'wall', data: wall }
      } else {
          const opening = project.openings.find(o => o.id === selectedElementId)
          if (opening) {
              selectedElement = { type: 'opening', data: opening }
          }
      }
  }

  const handleClose = () => {
      // setIsEditingLayers(false)
      if (selectedElementId) deselect(selectedElementId)
  }

  if (!selectedElement) {
    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
           <h3 className="font-semibold text-slate-900 flex items-center gap-2">
             <Settings size={18} className="text-slate-500" />
             Project Settings
           </h3>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto">
           {/* BOQ Configuration */}
           <BOQConfigPanel 
             config={project.boqConfig}
             onChange={updateBoqConfig}
           />

           {/* Empty Selection State */}
           <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-center">
             <Ruler size={32} className="mb-2 opacity-50" />
             <p className="text-sm">Select a wall or opening to edit properties</p>
           </div>
        </div>
      </div>
    )
  }

  // Wall Properties
  if (selectedElement.type === 'wall') {
    const wall = selectedElement.data
    // const wallTemplate = wall.templateId ? templates.find(t => t.id === wall.templateId) : null
    
    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Ruler size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-900">Wall Properties</h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Properties */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Length (Read-only) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Length</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
               {(() => {
                   const dx = wall.end.x - wall.start.x
                   const dy = wall.end.y - wall.start.y
                   return Math.sqrt(dx * dx + dy * dy).toFixed(2)
               })()} m
            </div>
          </div>

          {/* Angle (Read-only) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Angle</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
               {(() => {
                   const dx = wall.end.x - wall.start.x
                   const dy = wall.end.y - wall.start.y
                   let degrees = Math.atan2(dy, dx) * (180 / Math.PI)
                   if (degrees < 0) degrees += 360
                   return `${Math.round(degrees)}°`
               })()}
            </div>
          </div>


          {/* Height Control with Anti-Collision Logic */}
          {(() => {
              // 1. Get current wall's story
              const currentStory = project.stories?.find(s => s.id === wall.storyId)
              
              // 2. Check for story directly above
              // Logic: Find story with level = currentLevel + 1
              const storyAbove = currentStory 
                  ? project.stories?.find(s => s.level === (currentStory.level + 1))
                  : null

              // 3. Determine Mode
              // If story above exists -> FORCE 'default'
              const isLockedByStory = !!storyAbove
              const effectiveMode = isLockedByStory ? 'default' : (wall.heightMode || 'default')
              
              // 4. Determine Height Display
              // If default, use story height (or wall height if synced)
              // If we are locked but wall height differs, we should probably sync it?
              // Ideally the store updates this, but for UI we show what going on.
              
              const isCustom = effectiveMode === 'custom'

              return (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Height</label>
                        {!isLockedByStory && (
                            <button
                                onClick={() => updateWall(wall.id, { heightMode: isCustom ? 'default' : 'custom' })}
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                    isCustom 
                                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}
                            >
                                {isCustom ? 'Custom' : 'Default'}
                            </button>
                        )}
                        {isLockedByStory && (
                             <span className="text-[10px] text-orange-600 font-medium flex items-center gap-1">
                                <ShieldCheck size={10} />
                                Linked to Story Above
                             </span>
                        )}
                    </div>
                    
                    <div className="relative">
                        <input
                        type="number"
                        step="0.1"
                        value={wall.height || 2.7}
                        disabled={!isCustom}
                        onChange={(e) => updateWall(wall.id, { height: parseFloat(e.target.value) })}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                            !isCustom ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                        }`}
                        />
                         {!isCustom && (
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <span className="text-xs text-slate-400">Auto</span>
                            </div>
                        )}
                    </div>
                    
                    {isLockedByStory ? (
                        <p className="text-xs text-slate-400">
                            Height controlled by {storyAbove?.name || 'Level Above'}.
                        </p>
                    ) : (
                        <p className="text-xs text-slate-500">
                            {isCustom ? 'Custom override enabled.' : 'Syncs with room height.'}
                        </p>
                    )}
                  </div>
              )
          })()}


          {/* Wall Type / Thickness */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Wall Type</label>
            <select
                value={wall.wallType || 'load-bearing'}
                onChange={(e) => updateWall(wall.id, { wallType: e.target.value as 'load-bearing' | 'partition' })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
                <option value="load-bearing">Load-Bearing (220mm)</option>
                <option value="partition">Partition (110mm)</option>
            </select>
            </div>

            <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Thickness (mm)</label>
            <div className="flex flex-col gap-1">
                <input
                  type="number"
                  value={((wall.thickness || 0.22) * 1000).toFixed(0)}
                  onChange={(e) => updateWall(wall.id, { thickness: parseFloat(e.target.value) / 1000 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {wall.structure && (
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                        <span className="font-semibold">True Thickness:</span>
                        <span>{WallCalculator.calculateThickness(wall.structure)}mm</span>
                        <span className="text-slate-400">({WallCalculator.getDescription(wall.structure)})</span>
                    </div>
                )}
            </div>
          </div>

          {/* Roof Settings */}
          <div className="pt-4 mt-2 border-t border-slate-200">
             <div className="flex items-center gap-2 mb-3">
               <Home size={16} className="text-orange-600" />
               <h4 className="text-sm font-semibold text-slate-700">Roof Generation</h4>
             </div>
             
             <div className="space-y-3">
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Edge Type</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => updateWall(wall.id, { roofBehavior: 'hip' })}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                                (wall.roofBehavior || 'hip') === 'hip' 
                                ? 'bg-white text-orange-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Hip
                        </button>
                        <button
                            onClick={() => updateWall(wall.id, { roofBehavior: 'gable' })}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                                wall.roofBehavior === 'gable' 
                                ? 'bg-white text-orange-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Gable
                        </button>
                        <button
                            onClick={() => updateWall(wall.id, { roofBehavior: 'none' })}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                                wall.roofBehavior === 'none' 
                                ? 'bg-white text-slate-800 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            None
                        </button>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Pitch Override</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            max="60"
                            placeholder="Global"
                            value={wall.roofPitch ?? ''}
                            onChange={(e) => {
                                const val = e.target.value ? parseFloat(e.target.value) : undefined
                                updateWall(wall.id, { roofPitch: val })
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                        />
                        <button 
                            onClick={() => updateWall(wall.id, { roofPitch: undefined })}
                            className="p-2 text-slate-400 hover:text-red-500"
                            title="Reset to Global"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500">Leave empty for global pitch</p>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Overhang Override (mm)</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            max="2000"
                            placeholder="Global"
                            value={wall.roofOverhang ?? ''}
                            onChange={(e) => {
                                const val = e.target.value ? parseFloat(e.target.value) : undefined
                                updateWall(wall.id, { roofOverhang: val })
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                        />
                        <button 
                            onClick={() => updateWall(wall.id, { roofOverhang: undefined })}
                            className="p-2 text-slate-400 hover:text-red-500"
                            title="Reset to Global"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500">Leave empty for global overhang</p>
                 </div>
             </div>
          </div>

          {/* Delete Wall */}
          <div className="pt-4 mt-2 border-t border-slate-200">
             <button
              onClick={() => {
                deleteWall(wall.id)
                deselect(wall.id)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold"
            >
              <Trash2 size={16} />
              Delete Wall
            </button>
          </div>
          
          {/* Engineering Section */}
          <div className="pt-4 mt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-blue-600" />
              <h4 className="text-sm font-semibold text-slate-700">Engineering</h4>
            </div>
            
            <button
              onClick={() => setIsEngineerModalOpen(true)}
              className="w-full py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} />
              Open Engineer Mode
            </button>
          </div>
        </div>

        {/* Engineer Modal */}
        <EngineerModal
            isOpen={isEngineerModalOpen}
            onClose={() => setIsEngineerModalOpen(false)}
            title="Foundation Engineering"
            wall={wall}
            onUpdate={(updates) => updateWall(wall.id, updates)}
        />
      </div>
    )
  }

  // Opening Properties (Doors & Windows)
  if (selectedElement.type === 'opening') {
    const opening = selectedElement.data

    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${opening.type === 'door' ? 'bg-orange-600' : 'bg-blue-600'}`}></div>
            <h3 className="font-semibold text-slate-900">
              {opening.type === 'door' ? 'Door' : 'Window'} Properties
            </h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Properties */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Width (m)</label>
              <input
                type="number"
                step="0.01"
                value={opening.width}
                onChange={(e) => updateOpening(opening.id, { width: parseFloat(e.target.value) || 0.9 })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Height (m)</label>
              <input
                type="number"
                step="0.01"
                value={opening.height}
                onChange={(e) => updateOpening(opening.id, { height: parseFloat(e.target.value) || 2.1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
            </div>
             <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Sill Height (m)</label>
              <input
                type="number"
                step="0.01"
                value={opening.sillHeight}
                onChange={(e) => updateOpening(opening.id, { sillHeight: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Delete Opening */}
          <div className="pt-4 mt-2 border-t border-slate-200">
             <button
              onClick={() => {
                deleteOpening(opening.id)
                deselect(opening.id)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold"
            >
              <Trash2 size={16} />
              Delete {opening.type}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
