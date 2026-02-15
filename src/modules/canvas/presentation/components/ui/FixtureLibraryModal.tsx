
import React from 'react'
import { X, Check } from 'lucide-react' // Icons
import { Stage, Layer, Group } from 'react-konva' // For rendering previews
import { PLUMBING_VARIANTS } from '../renderers/MEPRenderer/PlumbingShapes'

interface FixtureLibraryModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (variantId: string, width: number, length: number) => void
    activeType: string // 'bath', 'shower', etc.
    currentVariantId?: string
}

export const FixtureLibraryModal: React.FC<FixtureLibraryModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    activeType,
    currentVariantId 
}) => {
    if (!isOpen) return null

    const variants = PLUMBING_VARIANTS[activeType] || []

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 capitalize">{activeType} Library</h2>
                        <p className="text-sm text-slate-500">Select a style for your fixture</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {variants.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 italic">
                            No variants available for this type yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {variants.map(variant => {
                                const isSelected = currentVariantId === variant.id
                                return (
                                    <button
                                        key={variant.id}
                                        onClick={() => onSelect(variant.id, variant.defaultWidth, variant.defaultLength)}
                                        className={`group relative flex flex-col items-center bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden hover:shadow-md text-left
                                            ${isSelected 
                                                ? 'border-blue-600 ring-4 ring-blue-50' 
                                                : 'border-slate-200 hover:border-blue-300'
                                            }
                                        `}
                                    >
                                        {/* Tag */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full z-10">
                                                <Check size={14} />
                                            </div>
                                        )}

                                        {/* Preview Area */}
                                        <div className="w-full aspect-4/3 bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
                                           {/* 
                                                We can use Konva Stage here for a true preview, 
                                                or just SVG if we extract the render logic to be React-Node compatible 
                                                (which it is, but Konva nodes need a Stage/Layer).
                                                
                                                Since we are inside an HTML div, we need to wrap Konva nodes in Stage.
                                                However, creating many Stages might be heavy.
                                                Alternative: Simple SVG icons or a single shared canvas? 
                                                
                                                Actually, the `render` function returns Konva Nodes (<Group>, etc).
                                                We MUST wrap them in <Stage><Layer>...
                                           */}
                                           <div className="w-full h-full flex items-center justify-center">
                                                {/* 
                                                    Canvas scaling:
                                                    Container is approx 200x150 (client side).
                                                    Fixture is eg. 1700x700.
                                                    We need to scale it down to fit ~120x80 to leave margin.
                                                */}
                                                <Stage width={200} height={150}>
                                                    <Layer>
                                                        {(() => {
                                                            const padding = 40
                                                            const containerW = 200 - padding
                                                            const containerH = 150 - padding
                                                            
                                                            // Determine fit scale
                                                            const scaleW = containerW / variant.defaultWidth
                                                            const scaleH = containerH / variant.defaultLength
                                                            const scale = Math.min(scaleW, scaleH)
                                                            
                                                            return (
                                                                <Group 
                                                                    x={100} 
                                                                    y={75} 
                                                                    scaleX={scale} 
                                                                    scaleY={scale}
                                                                >
                                                                    {variant.render(variant.defaultWidth, variant.defaultLength)}
                                                                </Group>
                                                            )
                                                        })()}
                                                    </Layer>
                                                </Stage>
                                           </div>
                                           
                                           {/* Hover Overlay */}
                                           <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors" />
                                        </div>

                                        {/* Footer */}
                                        <div className="w-full p-4 border-t border-slate-100 bg-white group-hover:bg-blue-50/30 transition-colors">
                                            <h3 className={`font-bold text-sm mb-1 ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                                                {variant.label}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                    W: {variant.defaultWidth}
                                                </span>
                                                <span className="text-slate-300">×</span>
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                    L: {variant.defaultLength}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
