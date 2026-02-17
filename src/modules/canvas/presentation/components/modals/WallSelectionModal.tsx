import React from 'react'
import { WallTemplate } from '../../hooks/useWallTemplates'
import { X } from 'lucide-react'

interface WallSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: WallTemplate) => void
  templates: WallTemplate[]
  loading: boolean
}

export const WallSelectionModal: React.FC<WallSelectionModalProps> = ({
  isOpen, onClose, onSelect, templates, loading
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[600px] bg-white rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Select Wall Type</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
             <div className="text-center py-10 text-gray-500">Loading templates...</div>
          ) : (
            templates.map(template => (
              <div 
                key={template.id}
                onClick={() => onSelect(template)}
                className="group flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
              >
                {/* Preview Box */}
                <div 
                  className="w-16 h-16 rounded border shadow-sm flex-shrink-0"
                  style={{ 
                    backgroundColor: template.fillColor,
                    // Simple CSS pattern simulation for preview
                    backgroundImage: template.hatchPattern === 'DIAGONAL' 
                      ? 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent)' 
                      : template.hatchPattern === 'CROSSHATCH'
                      ? 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1)), linear-gradient(135deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1))'
                      : 'none',
                    backgroundSize: '10px 10px'
                  }}
                />
                
                {/* Text */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">{template.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{template.description}</p>
                </div>

                {/* Badge */}
                {template.isSystem && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">System</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
