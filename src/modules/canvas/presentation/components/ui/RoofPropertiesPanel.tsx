'use client'

import React from 'react'
import { useCanvasStore } from '../../../application/store'
import { RoofPanel } from '../../../application/types'
import { Home, Layers, Settings } from 'lucide-react'

interface RoofPropertiesPanelProps {
  panel: RoofPanel
}

export const RoofPropertiesPanel: React.FC<RoofPropertiesPanelProps> = ({ panel }) => {
  const { updateRoofPanel } = useCanvasStore()

  const handleTypeChange = (type: 'pitched' | 'flat') => {
    if (type === panel.type) return
    
    updateRoofPanel(panel.id, {
      type,
      pitchedConfig: type === 'pitched' ? {
        style: 'gable',
        pitch: 30,
        trussType: 'timber',
        trussSpacing: 600,
        sheeting: 'IBR',
        insulation: false,
        ceiling: 'plasterboard'
      } : undefined,
      flatConfig: type === 'flat' ? {
        slabType: 'insitu',
        thickness: 150,
        reinforcement: 'Y12@200 B/W',
        finish: 'waterproofing',
        fall: '1:100'
      } : undefined
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <Home size={20} className="text-blue-600" />
        <h3 className="font-semibold text-gray-900">Roof Properties</h3>
      </div>

      {/* Roof Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Roof Type
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleTypeChange('pitched')}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              panel.type === 'pitched'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <Home size={16} className="inline mr-2" />
            Pitched
          </button>
          <button
            onClick={() => handleTypeChange('flat')}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              panel.type === 'flat'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <Layers size={16} className="inline mr-2" />
            Flat Slab
          </button>
        </div>
      </div>

      {/* Pitched Roof Configuration */}
      {panel.type === 'pitched' && panel.pitchedConfig && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Settings size={16} />
            Pitched Roof Configuration
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateRoofPanel(panel.id, {
                  pitchedConfig: { ...panel.pitchedConfig!, style: 'gable' }
                })}
                className={`flex-1 px-3 py-2 text-sm rounded border ${
                  panel.pitchedConfig.style === 'gable'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                Gable
              </button>
              <button
                onClick={() => updateRoofPanel(panel.id, {
                  pitchedConfig: { ...panel.pitchedConfig!, style: 'hip' }
                })}
                className={`flex-1 px-3 py-2 text-sm rounded border ${
                  panel.pitchedConfig.style === 'hip'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                Hip
              </button>
            </div>
          </div>

          {/* Pitch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pitch: {panel.pitchedConfig.pitch}°
            </label>
            <input
              type="range"
              min="15"
              max="45"
              value={panel.pitchedConfig.pitch}
              onChange={(e) => updateRoofPanel(panel.id, {
                pitchedConfig: { ...panel.pitchedConfig!, pitch: parseInt(e.target.value) }
              })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>15°</span>
              <span>45°</span>
            </div>
          </div>

          {/* Sheeting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sheeting
            </label>
            <select
              value={panel.pitchedConfig.sheeting}
              onChange={(e) => updateRoofPanel(panel.id, {
                pitchedConfig: { ...panel.pitchedConfig!, sheeting: e.target.value as 'IBR' | 'corrugated' | 'tile' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="IBR">IBR Sheeting</option>
              <option value="corrugated">Corrugated Sheeting</option>
              <option value="tile">Concrete Tile</option>
            </select>
          </div>
        </div>
      )}

      {/* Flat Slab Configuration */}
      {panel.type === 'flat' && panel.flatConfig && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Settings size={16} />
            Flat Slab Configuration
          </div>

          {/* Slab Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Construction Method
            </label>
            <select
              value={panel.flatConfig.slabType}
              onChange={(e) => updateRoofPanel(panel.id, {
                flatConfig: { ...panel.flatConfig!, slabType: e.target.value as 'insitu' | 'rib-and-block' | 'prestressed' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="insitu">In-situ Concrete</option>
              <option value="rib-and-block">Rib & Block</option>
              <option value="prestressed">Prestressed Planks</option>
            </select>
          </div>

          {/* Thickness */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thickness
            </label>
            <select
              value={panel.flatConfig.thickness}
              onChange={(e) => updateRoofPanel(panel.id, {
                flatConfig: { ...panel.flatConfig!, thickness: parseInt(e.target.value) as 150 | 175 | 200 | 225 }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="150">150mm</option>
              <option value="175">175mm</option>
              <option value="200">200mm</option>
              <option value="225">225mm</option>
            </select>
          </div>

          {/* Finish */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Finish
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateRoofPanel(panel.id, {
                  flatConfig: { ...panel.flatConfig!, finish: 'screed' }
                })}
                className={`flex-1 px-3 py-2 text-sm rounded border ${
                  panel.flatConfig.finish === 'screed'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                Screed
              </button>
              <button
                onClick={() => updateRoofPanel(panel.id, {
                  flatConfig: { ...panel.flatConfig!, finish: 'waterproofing' }
                })}
                className={`flex-1 px-3 py-2 text-sm rounded border ${
                  panel.flatConfig.finish === 'waterproofing'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                Waterproofing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area Display */}
      <div className="border-t border-gray-200 pt-3">
        <div className="text-sm text-gray-600">
          Roof Area: <span className="font-semibold text-gray-900">{panel.area.toFixed(2)} m²</span>
        </div>
        {panel.volume && (
          <div className="text-sm text-gray-600 mt-1">
            Concrete Volume: <span className="font-semibold text-gray-900">{panel.volume.toFixed(2)} m³</span>
          </div>
        )}
      </div>

       {/* Footprint Edit Toggle */}
       <div className="border-t border-gray-200 pt-3">
        <button
            onClick={() => {
                const isEditing = useCanvasStore.getState().editingRoofId === panel.id
                useCanvasStore.getState().setEditingRoofId(isEditing ? null : panel.id)
            }}
            className={`w-full px-4 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                useCanvasStore(state => state.editingRoofId) === panel.id
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'bg-white border-gray-300 hover:border-blue-500 hover:text-blue-600'
            }`}
        >
            <Settings size={16} />
            {useCanvasStore(state => state.editingRoofId) === panel.id ? 'Done Editing Footprint' : 'Edit Roof Footprint'}
        </button>
      </div>
    </div>
  )
}
