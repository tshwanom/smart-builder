import React, { useState, useEffect } from 'react'
import { WallTemplate, WallLayer } from '../../../application/types'
import { Plus, Trash2, Save, Copy, ArrowUp, ArrowDown } from 'lucide-react'

// Simple ID generator to avoid external dependencies
const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15)
}

interface WallLayerEditorProps {
  template: WallTemplate
  onSave: (template: WallTemplate) => void
  onSaveAsNew: (template: WallTemplate) => void
  onCancel: () => void
}

export const WallLayerEditor: React.FC<WallLayerEditorProps> = ({
  template: initialTemplate,
  onSave,
  onSaveAsNew,
  onCancel
}) => {
  const [template, setTemplate] = useState<WallTemplate>(JSON.parse(JSON.stringify(initialTemplate)))
  const [isDirty, setIsDirty] = useState(false)

  // Update local state when prop changes
  useEffect(() => {
    setTemplate(JSON.parse(JSON.stringify(initialTemplate)))
    setIsDirty(false)
  }, [initialTemplate])

  const handleLayerChange = (index: number, field: keyof WallLayer, value: any) => {
    const newLayers = [...template.layers]
    newLayers[index] = { ...newLayers[index], [field]: value }
    setTemplate({ ...template, layers: newLayers })
    setIsDirty(true)
  }

  const addLayer = () => {
    const newLayer: WallLayer = {
      id: generateId(),
      type: 'MASONRY',
      thickness: 110,
      isStructural: true,
      materialId: null
    }
    setTemplate({ ...template, layers: [...template.layers, newLayer] })
    setIsDirty(true)
  }

  const removeLayer = (index: number) => {
    const newLayers = template.layers.filter((_, i) => i !== index)
    setTemplate({ ...template, layers: newLayers })
    setIsDirty(true)
  }

  const moveLayer = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === template.layers.length - 1) return

    const newLayers = [...template.layers]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newLayers[swapIndex]
    newLayers[swapIndex] = newLayers[index]
    newLayers[index] = temp
    
    setTemplate({ ...template, layers: newLayers })
    setIsDirty(true)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-4">Edit Wall Structure</h3>
        
        {/* Template Name */}
        <div className="space-y-1 mb-3">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Template Name</label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => {
                setTemplate({ ...template, name: e.target.value })
                setIsDirty(true)
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Visual Settings Row */}
        <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Hatch Pattern</label>
                <select
                    value={template.hatchPattern}
                    onChange={(e) => {
                        setTemplate({ ...template, hatchPattern: e.target.value })
                        setIsDirty(true)
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
                >
                    <option value="SOLID">Solid Fill</option>
                    <option value="DIAGONAL">Diagonal Lines</option>
                    <option value="CROSSHATCH">Crosshatch</option>
                    <option value="CONCRETE">Concrete</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Fill Color</label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={template.fillColor}
                        onChange={(e) => {
                            setTemplate({ ...template, fillColor: e.target.value })
                            setIsDirty(true)
                        }}
                        className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                    />
                    <span className="text-xs text-slate-500">{template.fillColor}</span>
                </div>
             </div>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <label className="text-xs font-medium text-slate-600 uppercase tracking-wide block mb-2">Layers (Outer to Inner)</label>
        
        {template.layers.map((layer, index) => (
            <div key={layer.id || index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg group">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1">
                        <span className="w-5 h-5 flex items-center justify-center bg-slate-200 text-slate-500 text-xs rounded-full font-mono">
                            {index + 1}
                        </span>
                        <select
                            value={layer.type}
                            onChange={(e) => handleLayerChange(index, 'type', e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-slate-900 focus:ring-0 p-0 cursor-pointer"
                        >
                            <option value="MASONRY">Masonry</option>
                            <option value="CAVITY">Cavity</option>
                            <option value="FINISH">Finish (Plaster)</option>
                            <option value="MEMBRANE">Membrane</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => moveLayer(index, 'up')} disabled={index === 0} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30">
                            <ArrowUp size={14} />
                         </button>
                         <button onClick={() => moveLayer(index, 'down')} disabled={index === template.layers.length - 1} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30">
                            <ArrowDown size={14} />
                         </button>
                         <button onClick={() => removeLayer(index)} className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-600">
                            <Trash2 size={14} />
                         </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2 py-1">
                        <span className="text-xs text-slate-500">Thick.</span>
                        <input
                            type="number"
                            value={layer.thickness}
                            onChange={(e) => handleLayerChange(index, 'thickness', parseFloat(e.target.value))}
                            className="w-full text-right text-sm outline-none"
                        />
                        <span className="text-xs text-slate-400">mm</span>
                    </div>
                    
                    <div className="flex items-center gap-2 px-2">
                        <input
                            type="checkbox"
                            checked={layer.isStructural}
                            onChange={(e) => handleLayerChange(index, 'isStructural', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                         <span className="text-xs text-slate-600">Structural</span>
                    </div>
                </div>
            </div>
        ))}

        <button 
            onClick={addLayer}
            className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
            <Plus size={16} />
            Add Layer
        </button>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
         {!template.isSystem && (
             <button
                onClick={() => onSave(template)}
                disabled={!isDirty}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Save size={16} />
                Save Changes
             </button>
         )}
         
         <button
            onClick={() => onSaveAsNew({ ...template, id: '', name: `${template.name} (Copy)` })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
         >
            <Copy size={16} />
            Save as New Template
         </button>
         
         <button
            onClick={onCancel}
            className="w-full text-xs text-slate-500 hover:text-slate-700 mt-2"
         >
            Cancel
         </button>
      </div>
    </div>
  )
}
