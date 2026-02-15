'use client'

import React, { useState } from 'react'
import { Settings } from 'lucide-react'

export interface BOQConfig {
  roofType: 'flat' | 'gable' | 'hip'
  roofPitch: number
  finishes: {
    floor: 'tiles' | 'screed' | 'vinyl'
    walls: 'paint' | 'plaster' | 'tiles'
    ceiling: 'paint' | 'suspended'
  }
}

interface BOQConfigPanelProps {
  config: BOQConfig
  onChange: (config: BOQConfig) => void
}

export const BOQConfigPanel: React.FC<BOQConfigPanelProps> = ({ config, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-slate-600" />
          <span className="font-semibold text-slate-800">BOQ Configuration</span>
        </div>
        <span className="text-slate-400">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-slate-200 space-y-4">
          {/* Roof Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Roof Type
            </label>
            <select
              value={config.roofType}
              onChange={(e) => onChange({ ...config, roofType: e.target.value as 'flat' | 'gable' | 'hip' })}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="flat">Flat Slab</option>
              <option value="gable">Gable Roof (Pitched)</option>
              <option value="hip">Hip Roof (Pitched)</option>
            </select>
          </div>

          {/* Roof Pitch (only for pitched roofs) */}
          {(config.roofType === 'gable' || config.roofType === 'hip') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Roof Pitch (degrees)
              </label>
              <input
                type="number"
                value={config.roofPitch}
                onChange={(e) => onChange({ ...config, roofPitch: parseFloat(e.target.value) })}
                min="15"
                max="45"
                step="5"
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Typical: 22.5° - 30°</p>
            </div>
          )}

          {/* Floor Finish */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Floor Finish
            </label>
            <select
              value={config.finishes.floor}
              onChange={(e) => onChange({ 
                ...config, 
                finishes: { ...config.finishes, floor: e.target.value as 'tiles' | 'screed' | 'vinyl' }
              })}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tiles">Ceramic Tiles</option>
              <option value="screed">Screed Only</option>
              <option value="vinyl">Vinyl Flooring</option>
            </select>
          </div>

          {/* Wall Finish */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Wall Finish
            </label>
            <select
              value={config.finishes.walls}
              onChange={(e) => onChange({ 
                ...config, 
                finishes: { ...config.finishes, walls: e.target.value as 'paint' | 'plaster' | 'tiles' }
              })}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="paint">Plaster & Paint</option>
              <option value="plaster">Plaster Only</option>
              <option value="tiles">Wall Tiles</option>
            </select>
          </div>

          {/* Ceiling Finish */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ceiling Finish
            </label>
            <select
              value={config.finishes.ceiling}
              onChange={(e) => onChange({ 
                ...config, 
                finishes: { ...config.finishes, ceiling: e.target.value as 'paint' | 'suspended' }
              })}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="paint">Plaster & Paint</option>
              <option value="suspended">Suspended Ceiling</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
