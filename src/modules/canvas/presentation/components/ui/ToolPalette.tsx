import React, { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { Scissors, Trash2, BrickWall, ArrowUpCircle } from 'lucide-react'
import { useCanvasStore } from '../../../application/store'
import { Wall, Opening, RoofPanel, Staircase } from '../../../application/types'
import { WallSelectionModal } from '../modals/WallSelectionModal'
import { useWallTemplates, WallTemplate } from '../../hooks/useWallTemplates'

export const ToolPalette: React.FC = () => {
    const { 
        currentTool, 
        setTool, 
        isDrawing, 
        completeWall, 
        selectedElement,
        deleteWall,
        deleteOpening,
        deleteRoofPanel,
        removeStaircase,
        clearSelection,
        setActiveTemplate,
        openLibrary
    } = useCanvasStore()

    const [isWallModalOpen, setIsWallModalOpen] = useState(false)
    
    // TODO: Get actual project ID from store or context
    const projectId = null 
    const { templates, loading } = useWallTemplates(projectId)

    const handleWallClick = () => {
        setIsWallModalOpen(true)
    }

    const handleTemplateSelect = (template: WallTemplate) => {
        setActiveTemplate(template)
        setTool('wall')
        setIsWallModalOpen(false)
    }

    const handleDelete = () => {
        if (!selectedElement) return
        
        switch(selectedElement.type) {
            case 'wall':
                deleteWall((selectedElement.data as Wall).id)
                break
            case 'opening':
                deleteOpening((selectedElement.data as Opening).id)
                break
            case 'roof':
                deleteRoofPanel((selectedElement.data as RoofPanel).id)
                break
            case 'staircase':
                removeStaircase((selectedElement.data as Staircase).id)
                break
        }
        clearSelection()
    }

    return (
        <>
            <WallSelectionModal 
                isOpen={isWallModalOpen}
                onClose={() => setIsWallModalOpen(false)}
                onSelect={handleTemplateSelect}
                templates={templates}
                loading={loading}
            />
            
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 flex gap-2 flex-col pointer-events-auto">
                <div className="flex gap-2">
                    <button
                        onClick={() => setTool('select')}
                        className={twMerge(
                            "p-2 rounded font-medium transition-colors",
                            currentTool === 'select' ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                        )}
                        title="Select"
                    >
                        <span className="text-xs">Select</span>
                    </button>
                    <button
                        onClick={handleWallClick}
                        className={twMerge(
                            "p-2 rounded font-medium transition-colors flex items-center gap-1",
                            currentTool === 'wall' ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                        )}
                        title="Wall Tool"
                    >
                        <BrickWall size={16} />
                        <span className="text-xs">Wall</span>
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setTool('window')
                            openLibrary('window')
                        }}
                        className={twMerge(
                            "p-2 rounded font-medium transition-colors",
                            currentTool === 'window' ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                        )}
                        title="Window"
                    >
                        <span className="text-xs">Win</span>
                    </button>
                    <button
                        onClick={() => {
                            setTool('door')
                            openLibrary('door')
                        }}
                        className={twMerge(
                            "p-2 rounded font-medium transition-colors",
                            currentTool === 'door' ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                        )}
                        title="Door"
                    >
                        <span className="text-xs">Door</span>
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setTool('staircase')}
                        className={twMerge(
                            "p-2 rounded font-medium transition-colors w-full flex justify-center items-center gap-1",
                            currentTool === 'staircase' ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                        )}
                        title="Staircase"
                    >
                        <ArrowUpCircle size={16} />
                        <span className="text-xs">Stairs</span>
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setTool('break')}
                        className={twMerge(
                            "p-2 rounded font-medium transition-colors w-full flex justify-center",
                            currentTool === 'break' ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                        )}
                        title="Break Wall Tool"
                    >
                        <Scissors size={18} />
                    </button>
                </div>
                
                {isDrawing && (
                    <button
                        onClick={completeWall}
                        className="px-2 py-1 rounded font-medium bg-green-500 text-white hover:bg-green-600 text-xs mt-2"
                    >
                        Finish
                    </button>
                )}

                <div className="h-px w-full bg-gray-200 my-1"></div>

                <button
                    onClick={handleDelete}
                    disabled={!selectedElement}
                    className={twMerge(
                        "p-2 rounded font-medium transition-colors flex justify-center",
                        selectedElement 
                            ? "bg-red-50 text-red-600 hover:bg-red-100" 
                            : "text-gray-300 cursor-not-allowed"
                    )}
                    title="Delete"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </>
    )
}
