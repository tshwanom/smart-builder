'use client'

import React from 'react'
import { useCanvasStore } from '../../../application/store'
import { Wall, Room, Opening } from '../../../application/types'
import { Settings, X, Ruler, Home, Layers, Trash2, Scissors } from 'lucide-react'
import { BOQConfigPanel } from '@/modules/boq/presentation/components/BOQConfigPanel'
import { useShallow } from 'zustand/react/shallow'

import { WallLayerEditor } from './WallLayerEditor'
import { useWallTemplates } from '../../hooks/useWallTemplates'
import { useState } from 'react'

export const PropertiesPanel: React.FC = () => {
  const [isEditingLayers, setIsEditingLayers] = useState(false)
  const projectId = null // TODO: Get from store
  const { templates, createTemplate, updateTemplate } = useWallTemplates(projectId)

  const { 
    selectedElement, 
    updateWall, 
    updateRoom, 
    clearSelection, 
    boqConfig, 
    updateBOQConfig,
    setActiveTemplate,
    roofPitch,
    roofOverhang,
    showRoof,
    setRoofPitch,
    setRoofOverhang,
    toggleRoof,
    showRoofSlopeArrows,
    toggleRoofSlopeArrows,
    roofArrowOffset,
    setRoofArrowOffset
  } = useCanvasStore(useShallow(state => ({
    selectedElement: state.selectedElement,
    updateWall: state.updateWall,
    updateRoom: state.updateRoom,
    clearSelection: state.clearSelection,
    boqConfig: state.boqConfig,
    updateBOQConfig: state.updateBOQConfig,
    setActiveTemplate: state.setActiveTemplate,
    // Roof Global State
    roofPitch: state.roofPitch,
    roofOverhang: state.roofOverhang,
    showRoof: state.showRoof,
    setRoofPitch: state.setRoofPitch,
    setRoofOverhang: state.setRoofOverhang,
    toggleRoof: state.toggleRoof,
    showRoofSlopeArrows: state.showRoofSlopeArrows,
    toggleRoofSlopeArrows: state.toggleRoofSlopeArrows,
    roofArrowOffset: state.roofArrowOffset,
    setRoofArrowOffset: state.setRoofArrowOffset,
  })))

  if (!selectedElement) {
    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col">
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
             config={boqConfig}
             onChange={updateBOQConfig}
           />

           <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Home size={16} className="text-orange-600" />
                    <h4 className="font-semibold text-sm text-slate-800">Auto-Roof</h4>
                </div>
                {/* Toggle Show/Hide */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showRoof} 
                    className="sr-only peer"
                    onChange={(e) => toggleRoof(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
             </div>

             <div className={`space-y-3 transition-opacity ${showRoof ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                 <div className="space-y-1">
                     <label className="text-xs font-medium text-slate-500 uppercase">Pitch (°)</label>
                     <div className="flex items-center gap-2">
                         <input 
                             type="range" min="0" max="60" step="1" 
                             value={roofPitch}
                             onChange={(e) => setRoofPitch(parseInt(e.target.value))}
                             className="flex-1 accent-orange-600"
                         />
                         <span className="text-sm font-mono w-8 text-right">{roofPitch}°</span>
                     </div>
                 </div>

                 <div className="space-y-1">
                     <label className="text-xs font-medium text-slate-500 uppercase">Overhang (mm)</label>
                     <div className="flex items-center gap-2">
                         <input 
                             type="range" min="0" max="1500" step="50" 
                             value={roofOverhang}
                             onChange={(e) => setRoofOverhang(parseInt(e.target.value))}
                             className="flex-1 accent-orange-600"
                         />
                         <span className="text-sm font-mono w-10 text-right">{roofOverhang}</span>
                     </div>
                 </div>
             </div>
             
             <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                   <span className="text-xs font-medium text-slate-500 uppercase">Show Slope Arrows</span>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showRoofSlopeArrows} 
                        onChange={(e) => toggleRoofSlopeArrows(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                   </label>
             </div>
             
             {/* Arrow Offset Slider - Only show if arrows are enabled */}
             {showRoofSlopeArrows && (
                  <div className="space-y-1 mt-2 pt-2 border-t border-slate-100">
                      <label className="text-xs font-medium text-slate-500 uppercase">Arrow Position (Ridge %)</label>
                      <div className="flex items-center gap-2">
                          <input 
                              type="range" min="10" max="90" step="5" 
                              value={roofArrowOffset * 100}
                              onChange={(e) => setRoofArrowOffset(parseInt(e.target.value) / 100)}
                              className="flex-1 accent-orange-600"
                          />
                          <span className="text-sm font-mono w-10 text-right">{Math.round(roofArrowOffset * 100)}%</span>
                      </div>
                  </div>
             )}
           </div>

           {/* Empty Selection State */}
           <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-center">
             <Ruler size={32} className="mb-2 opacity-50" />
             <p className="text-sm">Select a wall or room to edit specific properties</p>
           </div>
        </div>
      </div>
    )
  }

  const handleClose = () => {
      setIsEditingLayers(false)
      clearSelection()
  }

  // Wall Properties
  if (selectedElement.type === 'wall') {
    const wall = selectedElement.data as Wall
    // Find the actual template for this wall
    const wallTemplate = wall.templateId ? templates.find(t => t.id === wall.templateId) : null
    
    // If editing layers
    if (isEditingLayers && wallTemplate) {
        return (
            <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col">
                <WallLayerEditor 
                    key={wallTemplate.id}
                    template={wallTemplate} 
                    onSave={async (updatedTemplate) => {
                        await updateTemplate(updatedTemplate.id, updatedTemplate)
                        // Verify if we need to refresh or if hook handles it
                        setIsEditingLayers(false)
                    }}
                    onSaveAsNew={async (newTemplate) => {
                        // Create new template
                        const created = await createTemplate(newTemplate)
                        setActiveTemplate(created)
                        // Update the wall to use this new template
                        updateWall(wall.id, { templateId: created.id })
                        setIsEditingLayers(false)
                    }}
                    onCancel={() => setIsEditingLayers(false)}
                />
            </div>
        )
    }

    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col">
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
          
          {/* Active Template Info */}
           <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-700 uppercase">Current Template</span>
                  {wallTemplate?.isSystem && <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">SYSTEM</span>}
              </div>
              <p className="text-sm font-medium text-slate-900 mb-2">{wallTemplate?.name || 'Custom / None'}</p>
              
              <button
                 onClick={() => {
                     if (wallTemplate) setIsEditingLayers(true)
                 }}
                 disabled={!wallTemplate}
                 className="w-full py-1.5 bg-white border border-blue-200 text-blue-600 text-xs font-medium rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                 Edit Structure & Visuals
              </button>
           </div>

          {/* Length (Read-only) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Length</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
              {wall.length?.toFixed(2) || 'N/A'} m
            </div>
          </div>

          {/* Angle (Read-only) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Angle</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
               {(() => {
                   if (wall.points.length < 2) return 'N/A'
                   const p1 = wall.points[0]
                   const p2 = wall.points[wall.points.length - 1]
                   const dx = p2.x - p1.x
                   const dy = p2.y - p1.y
                   let degrees = Math.atan2(dy, dx) * (180 / Math.PI)
                   if (degrees < 0) degrees += 360
                   return `${Math.round(degrees)}°`
               })()}
            </div>
          </div>

          {/* Height */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Height</label>
            <input
              type="number"
              step="0.1"
              value={wall.height || 2.7}
              onChange={(e) => updateWall(wall.id, { height: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-xs text-slate-500">Standard: 2.7m</p>
          </div>

          {/* Wall Type (Legacy - keep for now or link to template?) */}
          {/* ... keeping legacy controls for fallback ... */}

          {/* ... existing properties ... */}


          {/* Wall Type / Thickness */}
          {wallTemplate ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Thickness</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
                  {wall.thickness} mm
                </div>
              </div>
          ) : (
              <>
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
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Thickness</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
                      {wall.wallType === 'partition' ? '110' : '220'} mm
                    </div>
                  </div>
              </>
          )}

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

          {/* Break Wall (Split) */}
          <div className="pt-4 mt-2 border-t border-slate-200">
             <button
               onClick={() => {
                   const p1 = wall.points[0]
                   const p2 = wall.points[wall.points.length - 1]
                   const midpoint = {
                       x: (p1.x + p2.x) / 2,
                       y: (p1.y + p2.y) / 2
                   }
                   useCanvasStore.getState().breakWall(wall.id, midpoint)
               }}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-semibold mb-2"
             >
               <Scissors size={16} />
               Break Wall (Split)
             </button>

             <button
              onClick={() => {
                updateWall(wall.id, {  }) 
                useCanvasStore.getState().deleteWall(wall.id)
                clearSelection()
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold"
            >
              <Trash2 size={16} />
              Delete Wall
            </button>
          </div>


        </div>
      </div>
    )
  }

  // Room Properties
  if (selectedElement.type === 'room') {
    const room = selectedElement.data as Room

    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Home size={18} className="text-green-600" />
            <h3 className="font-semibold text-slate-900">Room Properties</h3>
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
          
          {/* Room Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Room Name</label>
            <input
              type="text"
              value={room.name || 'Unnamed Room'}
              onChange={(e) => updateRoom(room.id, { name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Living Room"
            />
          </div>

          {/* Area (Read-only) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Floor Area</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
              {room.area?.toFixed(2) || 'N/A'} m²
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={16} className="text-slate-500" />
              <h4 className="text-sm font-semibold text-slate-700">Finishes</h4>
            </div>
          </div>

          {/* Floor Finish */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Floor Finish</label>
            <select
              value={room.floorFinish || 'tiles'}
              onChange={(e) => updateRoom(room.id, { floorFinish: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="tiles">Ceramic Tiles</option>
              <option value="screed">Screed Only</option>
              <option value="vinyl">Vinyl</option>
              <option value="timber">Timber</option>
            </select>
          </div>

          {/* Wall Finish */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Wall Finish</label>
            <select
              value={room.wallFinish || 'painted'}
              onChange={(e) => updateRoom(room.id, { wallFinish: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="painted">Painted Plaster</option>
              <option value="tiles">Wall Tiles</option>
              <option value="bare">Bare Brick</option>
            </select>
          </div>

          {/* Ceiling Finish */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Ceiling Finish</label>
            <select
              value={room.ceilingFinish || 'painted'}
              onChange={(e) => updateRoom(room.id, { ceilingFinish: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="painted">Painted Plaster</option>
              <option value="suspended">Suspended Ceiling</option>
              <option value="bare">Bare Concrete</option>
            </select>
          </div>

          {/* Add Roof Section */}
          <AddRoofSection roomId={room.id} />

        </div>
      </div>
    )
  }

  // Opening Properties (Doors & Windows) - PARAMETRIC
  if (selectedElement.type === 'opening') {
    const opening = selectedElement.data as Opening
    const updateOpening = useCanvasStore.getState().updateOpening

    return (
      <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col">
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
          
          {/* Type & Subtype */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Type</label>
            <select
              value={opening.subtype || 'single'}
              onChange={(e) => updateOpening(opening.id, { subtype: e.target.value as 'single' | 'double' | 'sliding' | 'folding' | 'pivot' | 'garage_single' | 'garage_double' | 'top_hung' | 'side_hung' })}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {opening.type === 'door' && (
                <>
                  <option value="single">Single Swing</option>
                  <option value="double">Double Swing</option>
                  <option value="sliding">Sliding</option>
                  <option value="folding">Folding/Accordion</option>
                  <option value="pivot">Pivot</option>
                  <option value="garage_single">Single Garage</option>
                  <option value="garage_double">Double Garage</option>
                </>
              )}
              {opening.type === 'window' && (
                <>
                  <option value="single">Fixed Window</option>
                  <option value="double">Double Fixed</option>
                  <option value="sliding">Sliding Window</option>
                  <option value="top_hung">Top Hung</option>
                  <option value="side_hung">Side Hung</option>
                </>
              )}
            </select>
          </div>

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
          </div>

          {/* Parametric Controls Section */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Parametric Controls</h4>

            {/* Panel Count (for sliding & folding) */}
            {(opening.subtype === 'sliding' || opening.subtype === 'folding') && (
              <div className="space-y-1 mb-3">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Panel Count ({opening.panels ?? (opening.subtype === 'folding' ? 4 : 2)})
                </label>
                <input
                  type="range"
                  min={opening.subtype === 'folding' ? 2 : 1}
                  max={10}
                  value={opening.panels ?? (opening.subtype === 'folding' ? 4 : 2)}
                  onChange={(e) => updateOpening(opening.id, { panels: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  {opening.panels ?? (opening.subtype === 'folding' ? 4 : 2)} panel{(opening.panels ?? 2) > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Open Percentage Slider */}
            <div className="space-y-1 mb-3">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Open Percentage ({opening.openPercentage ?? 0}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={opening.openPercentage ?? 0}
                onChange={(e) => updateOpening(opening.id, { openPercentage: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-slate-500">Display the opening at {opening.openPercentage ?? 0}% open</p>
            </div>

            {/* Flip Side (for swing, folding) */}
            {(opening.subtype === 'single' || opening.subtype === 'folding') && (
              <div className="space-y-1 mb-3">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Flip Side</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateOpening(opening.id, { flipSide: 'left' })}
                    className={`flex-1 py-2 px-3 border rounded text-xs transition-colors ${
                      (opening.flipSide ?? 'left') === 'left'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => updateOpening(opening.id, { flipSide: 'right' })}
                    className={`flex-1 py-2 px-3 border rounded text-xs transition-colors ${
                      (opening.flipSide ?? 'left') === 'right'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Right
                  </button>
                </div>
              </div>
            )}

            {/* Opening Angle (for swing doors) */}
            {(opening.subtype === 'single' || opening.subtype === 'double') && (
              <div className="space-y-1 mb-3">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Opening Angle ({opening.openingAngle ?? 90}°)
                </label>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="15"
                  value={opening.openingAngle ?? 90}
                  onChange={(e) => updateOpening(opening.id, { openingAngle: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Door swings up to {opening.openingAngle ?? 90} degrees
                </p>
              </div>
            )}

            {/* Frame Thickness */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Frame Thickness ({((opening.frameThickness ?? 0.05) * 1000).toFixed(0)}mm)
              </label>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={(opening.frameThickness ?? 0.05) * 1000}
                onChange={(e) => updateOpening(opening.id, { frameThickness: parseInt(e.target.value) / 1000 })}
                className="w-full"
              />
            </div>
          </div>

          {/* Material & Glazing */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Materials</h4>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Material</label>
              <select
                value={opening.material || 'aluminium'}
                onChange={(e) => updateOpening(opening.id, { material: e.target.value as 'aluminium' | 'steel' | 'wood' | 'frameless' })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              >
                <option value="aluminium">Aluminium</option>
                <option value="steel">Steel</option>
                <option value="wood">Timber/Wood</option>
                <option value="frameless">Frameless</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Glazing</label>
              <select
                value={opening.glazing || 'single'}
                onChange={(e) => updateOpening(opening.id, { glazing: e.target.value as 'single' | 'double' | 'safety' })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              >
                <option value="single">Single Glazing</option>
                <option value="double">Double Glazing</option>
                <option value="safety">Safety Glass</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Hinge Type</label>
              <select
                value={opening.hingeType || 'standard'}
                onChange={(e) => updateOpening(opening.id, { hingeType: e.target.value as 'standard' | 'pivot' | 'soft-close' | 'concealed' })}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              >
                <option value="standard">Standard</option>
                <option value="pivot">Pivot</option>
                <option value="soft-close">Soft-Close</option>
                <option value="concealed">Concealed</option>
              </select>
            </div>
          </div>

          {/* BOQ Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
            <p className="font-semibold text-slate-700">BOQ Preview:</p>
            <p className="text-slate-600">
              Panels: {opening.panels ?? (opening.subtype === 'folding' ? 4 : opening.subtype === 'sliding' ? 2 : 1)}
            </p>
            <p className="text-slate-600">
              Glass Area: {((opening.width * opening.height) * 0.8).toFixed(2)} m²
            </p>
            {(opening.subtype === 'sliding' || opening.subtype === 'folding') && (
              <p className="text-slate-600">Track: {opening.width.toFixed(2)}m</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Plumbing Properties
  if (selectedElement.type === 'plumbingPoint') {
      const livePoint = useCanvasStore.getState().plumbingPoints.find(p => p.id === (selectedElement.data as PlumbingPoint).id)

      if (!livePoint) return null

      return (
        <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-600 rounded-sm"></div>
                    <h3 className="font-semibold text-slate-900">Plumbing Fixture</h3>
                </div>
                <button 
                    onClick={handleClose}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <PlumbingProperties 
                    point={livePoint} 
                    update={useCanvasStore.getState().updatePlumbingPoint} 
                />
            </div>
        </div>
      )
  }

  return null
}

// Plumbing Properties Helpers
import { PlumbingPoint } from '../../../application/types'
import { PLUMBING_VARIANTS } from '../renderers/MEPRenderer/PlumbingShapes'
import { FixtureLibraryModal } from './FixtureLibraryModal'
import { BookOpen } from 'lucide-react'

const PlumbingProperties: React.FC<{ point: PlumbingPoint, update: (id: string, data: Partial<PlumbingPoint>) => void }> = ({ point, update }) => {
    const [isLibraryOpen, setIsLibraryOpen] = useState(false)

    // Get available variants for this type
    const variants = PLUMBING_VARIANTS[point.type] || []
    const currentVariantId = point.subtype || (variants.length > 0 ? variants[0].id : '')
    const currentVariantLabel = variants.find(v => v.id === currentVariantId)?.label || 'Standard'

    // Default dimensions based on variance
    const getDefaultDimensions = (type: string, subtype?: string) => {
         const typeVariants = PLUMBING_VARIANTS[type]
         if (typeVariants) {
             const v = typeVariants.find(v => v.id === subtype) || typeVariants[0]
             if (v) return { w: v.defaultWidth, l: v.defaultLength }
         }
        // Fallback
        switch(type) {
            case 'bath': return { w: 1700, l: 700 }
            case 'basin': return { w: 500, l: 400 }
            case 'sink': return { w: 900, l: 500 }
            case 'toilet': return { w: 400, l: 700 }
            case 'shower': return { w: 900, l: 900 }
            default: return { w: 500, l: 500 }
        }
    }

    const currentWidth = point.width ?? getDefaultDimensions(point.type, point.subtype).w
    const currentLength = point.length ?? getDefaultDimensions(point.type, point.subtype).l

    return (
        <div className="space-y-4">
             {/* Library Modal */}
             <FixtureLibraryModal 
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                activeType={point.type}
                currentVariantId={currentVariantId}
                onSelect={(variantId, w, l) => {
                    update(point.id, { 
                        subtype: variantId,
                        width: w,
                        length: l
                    })
                    setIsLibraryOpen(false)
                }}
             />

             {/* Style Selector */}
             <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                 <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Selected Style</span>
                     <span className="text-[10px] px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded border border-cyan-100 font-medium">
                         {currentVariantLabel}
                     </span>
                 </div>
                 
                 <button
                    onClick={() => setIsLibraryOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-colors text-sm font-medium group"
                 >
                     <BookOpen size={16} className="text-slate-400 group-hover:text-cyan-600 transition-colors" />
                     Browse Library
                 </button>
             </div>

             <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Rotation ({point.rotation || 0}°)</label>
                <div className="flex gap-2">
                    <button 
                        onClick={() => update(point.id, { rotation: (point.rotation || 0) - 90 })}
                        className="flex-1 py-1 px-2 border border-slate-300 rounded text-xs hover:bg-slate-50 transition-colors"
                    >
                        -90°
                    </button>
                    <button 
                        onClick={() => update(point.id, { rotation: (point.rotation || 0) + 90 })}
                        className="flex-1 py-1 px-2 border border-slate-300 rounded text-xs hover:bg-slate-50 transition-colors"
                    >
                        +90°
                    </button>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Width (mm)</label>
                    <input
                        type="number"
                        value={currentWidth}
                        onChange={(e) => update(point.id, { width: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Length (mm)</label>
                    <input
                        type="number"
                        value={currentLength}
                        onChange={(e) => update(point.id, { length: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm"
                    />
                </div>
             </div>

             <div className="p-3 bg-cyan-50 text-cyan-800 text-xs rounded border border-cyan-100 flex flex-col gap-1">
                 <span className="font-bold uppercase tracking-wide">{point.type} {point.subtype ? `• ${point.subtype}` : ''}</span>
                 <span>Dimensions: {currentWidth}mm x {currentLength}mm</span>
             </div>
        </div>
    )
}

// Add Roof Section Component
const AddRoofSection: React.FC<{ roomId: string }> = ({ roomId }) => {
  const { createRoofPanel, roofPanels } = useCanvasStore()
  const hasRoof = roofPanels.some(panel => panel.roomId === roomId)

  return (
    <div className="border-t border-slate-200 pt-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={16} className="text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-700">Roof</h4>
      </div>

          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
             <label className="text-xs font-medium text-slate-700">Include in Auto-Roof</label>
             <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useCanvasStore.getState().rooms.find(r => r.id === roomId)?.hasRoof ?? true}
                  onChange={(e) => useCanvasStore.getState().updateRoom(roomId, { hasRoof: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
             </label>
          </div>

      {hasRoof ? (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded">
          <Layers size={16} />
          <span>Roof configured for this room</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-600">Add a separate roof panel (optional):</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => createRoofPanel(roomId, 'pitched')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              <Home size={14} />
              Pitched
            </button>
            <button
              onClick={() => createRoofPanel(roomId, 'flat')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-600 text-white text-sm rounded hover:bg-slate-700 transition-colors"
            >
              <Layers size={14} />
              Flat Slab
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
