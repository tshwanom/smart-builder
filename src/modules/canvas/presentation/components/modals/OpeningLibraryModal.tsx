import React, { useState } from 'react'
import { X, Maximize2, ArrowRightLeft, Square } from 'lucide-react'
import { DOOR_LIBRARY, WINDOW_LIBRARY } from '../../../../../core/data/standardOpenings'
import { Opening } from '../../../application/types'

interface OpeningLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (opening: Partial<Opening>) => void
  type: 'window' | 'door'
}

export const OpeningLibraryModal: React.FC<OpeningLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  type
}) => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  if (!isOpen) return null

  const library = type === 'door' ? DOOR_LIBRARY : WINDOW_LIBRARY
  
  // Categorize items
  const categories = ['All', ...Array.from(new Set(Object.values(library).map(item => {
    if (item.subtype?.includes('garage')) return 'Garage'
    if (item.subtype === 'sliding') return 'Sliding'
    if (item.subtype === 'folding') return 'Folding'
    if (item.material === 'aluminium') return 'Aluminium'
    if (item.material === 'steel') return 'Steel'
    if (item.material === 'wood') return 'Wooden'
    return 'Other'
  })))]

  const filteredItems = Object.entries(library).filter(([name, item]) => {
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || (
      (selectedCategory === 'Garage' && item.subtype?.includes('garage')) ||
      (selectedCategory === 'Sliding' && item.subtype === 'sliding') ||
      (selectedCategory === 'Folding' && item.subtype === 'folding') ||
      (selectedCategory === 'Aluminium' && item.material === 'aluminium' && !['sliding', 'folding'].includes(item.subtype || '')) ||
      (selectedCategory === 'Steel' && item.material === 'steel' && !item.subtype?.includes('garage')) ||
      (selectedCategory === 'Wooden' && item.material === 'wood')
    )
    return matchesSearch && matchesCategory
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Select {type === 'door' ? 'Door' : 'Window'}
            </h2>
            <p className="text-gray-500 mt-1">Choose from standard sizes and types</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-4 border-b border-gray-200 flex gap-4 items-center bg-white sticky top-0 z-10">
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(([name, item]) => (
              <button
                key={name}
                onClick={() => onSelect(item)}
                className="group bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-500 hover:shadow-lg transition-all text-left flex flex-col h-full ring-2 ring-transparent focus:ring-blue-500 outline-none"
              >
                {/* Icon Placeholder - Could be replaced with real preview */}
                <div className="w-full h-32 bg-slate-100 mb-2 rounded-md flex items-center justify-center relative overflow-hidden bg-linear-to-tr from-slate-100 to-slate-200">
                  
                  {/* Schematic Representation */}
                  <div className="relative border-4 border-gray-400 bg-white" 
                       style={{ 
                         width: `${Math.min(item.width * 40, 80)}%`, 
                         height: `${Math.min(item.height * 30, 80)}%` 
                       }}>
                    
                    {/* Glass Glint */}
                    <div className="absolute top-0 right-0 w-full h-full bg-linear-to-tr from-transparent via-blue-100/30 to-transparent" />
                    
                    {/* Door/Window specifics */}
                    {item.subtype === 'sliding' && (
                       <div className="absolute inset-0 flex">
                         <div className="w-1/2 h-full border-r border-gray-300 transform translate-x-1" />
                         <ArrowRightLeft size={16} className="absolute inset-0 m-auto text-gray-400 opacity-50" />
                       </div>
                    )}
                    {item.subtype === 'folding' && (
                       <div className="absolute inset-0 flex divide-x divide-gray-300">
                         <div className="flex-1" />
                         <div className="flex-1" />
                         <div className="flex-1" />
                       </div>
                    )}
                    {item.subtype?.includes('garage') && (
                       <div className="absolute inset-0 flex flex-col divide-y divide-gray-300">
                         {[1,2,3,4].map(i => <div key={i} className="flex-1 bg-gray-50" />)}
                       </div>
                    )}
                  </div>
                  
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-gray-900/10 rounded text-xs font-mono font-medium text-gray-600">
                    {(item.width * 1000).toFixed(0)}w x {(item.height * 1000).toFixed(0)}h
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {name}
                    </h3>
                    {item.material === 'aluminium' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded">Alu</span>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <Maximize2 size={12} className="mr-1.5" />
                      <span>{item.width}m x {item.height}m</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Square size={12} className="mr-1.5" />
                      <span className="capitalize">{item.subtype?.replace('_', ' ') || 'Single'}</span>
                    </div>
                    {item.lintelType && (
                       <div className="flex items-center text-xs text-green-600 mt-2 bg-green-50 px-2 py-1 rounded w-fit">
                         <span className="mr-1">✓</span>
                         Includes {item.lintelType} lintel
                       </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
