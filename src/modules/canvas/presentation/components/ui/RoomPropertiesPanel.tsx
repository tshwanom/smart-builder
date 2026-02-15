'use client'

import React from 'react'
import { useCanvasStore } from '../../../application/store'
import { Room } from '../../../application/types'
import { Home, Layers, Plus } from 'lucide-react'

interface RoomPropertiesPanelProps {
  room: Room
}

export const RoomPropertiesPanel: React.FC<RoomPropertiesPanelProps> = ({ room }) => {
  const { updateRoom, createRoofPanel, roofPanels } = useCanvasStore()
  
  // Check if room already has a roof
  const hasRoof = roofPanels.some(panel => panel.roomId === room.id)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <Home size={20} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            {room.name || 'Room'} Properties
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          {room.area.toFixed(2)} m²
        </div>
      </div>

      {/* Room Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Room Name
        </label>
        <input
          type="text"
          value={room.name || ''}
          onChange={(e) => updateRoom(room.id, { name: e.target.value })}
          placeholder="e.g., Kitchen, Bedroom"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Floor Finish */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Floor Finish
        </label>
        <select
          value={room.floorFinish || 'tiles'}
          onChange={(e) => updateRoom(room.id, { floorFinish: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="tiles">Ceramic Tiles</option>
          <option value="vinyl">Vinyl Flooring</option>
          <option value="screed">Cement Screed</option>
          <option value="timber">Timber Flooring</option>
          <option value="laminate">Laminate</option>
        </select>
      </div>

      {/* Wall Finish */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wall Finish
        </label>
        <select
          value={room.wallFinish || 'paint'}
          onChange={(e) => updateRoom(room.id, { wallFinish: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="paint">Paint on Plaster</option>
          <option value="tiles">Wall Tiles</option>
          <option value="wallpaper">Wallpaper</option>
          <option value="bare">Bare Plaster</option>
        </select>
      </div>

      {/* Ceiling Finish */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ceiling Finish
        </label>
        <select
          value={room.ceilingFinish || 'paint'}
          onChange={(e) => updateRoom(room.id, { ceilingFinish: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="paint">Painted Plasterboard</option>
          <option value="suspended">Suspended Ceiling</option>
          <option value="bare">Bare Concrete</option>
        </select>
      </div>

      {/* Roof Settings */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Home size={16} className="text-orange-600" />
          <h4 className="text-sm font-semibold text-gray-700">Auto-Roof Settings</h4>
        </div>
        
        <div className="space-y-3">
          {/* Has Roof Toggle */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <label className="text-sm font-medium text-gray-700">Generate Roof</label>
            <button
              onClick={() => updateRoom(room.id, { hasRoof: room.hasRoof === false ? undefined : false })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                room.hasRoof !== false ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  room.hasRoof !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {room.hasRoof !== false && (
            <>
              {/* Pitch Override */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Pitch Override (°)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  placeholder="Global pitch"
                  value={room.roofPitch ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined
                    updateRoom(room.id, { roofPitch: val })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
                <p className="text-xs text-gray-500">Leave empty for global pitch</p>
              </div>

              {/* Plate Height */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Plate Height (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="Story height"
                  value={room.roofPlateHeight ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined
                    updateRoom(room.id, { roofPlateHeight: val })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
                <p className="text-xs text-gray-500">Leave empty for story height</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Roof Button */}
      <div className="border-t border-gray-200 pt-4">
        {hasRoof ? (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Layers size={16} />
            <span>Roof configured for this room</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Add a roof to this room:</p>
            <div className="flex gap-2">
              <button
                onClick={() => createRoofPanel(room.id, 'pitched')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} />
                Pitched Roof
              </button>
              <button
                onClick={() => createRoofPanel(room.id, 'flat')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} />
                Flat Slab
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Room Info */}
      <div className="border-t border-gray-200 pt-3 text-sm text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>Area:</span>
          <span className="font-semibold text-gray-900">{room.area.toFixed(2)} m²</span>
        </div>
        <div className="flex justify-between">
          <span>Perimeter:</span>
          <span className="font-semibold text-gray-900">{room.perimeter.toFixed(2)} m</span>
        </div>
      </div>
    </div>
  )
}
