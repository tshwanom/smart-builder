import React, { useState, useRef, useEffect } from 'react'
import { MousePointer2, Trash2, GripVertical } from 'lucide-react'
import { ToolType } from '../../hooks/useCanvasInteraction'

interface UtilityBarProps {
    activeTool: ToolType
    onToolChange: (tool: ToolType) => void
    onDelete: () => void
    hasSelection: boolean
}

export const UtilityBar: React.FC<UtilityBarProps> = ({
    activeTool,
    onToolChange,
    onDelete,
    hasSelection
}) => {
    const [position, setPosition] = useState({ x: 20, y: 100 }) // Default top-left-ish
    const [isDragging, setIsDragging] = useState(false)
    const dragOffset = useRef({ x: 0, y: 0 })

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        }
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                })
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    const Btn = ({ tool, icon: Icon, title, onClick, active, disabled }: { tool?: ToolType, icon: any, title: string, onClick: () => void, active?: boolean, disabled?: boolean }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`p-3 rounded-xl transition-all flex items-center justify-center relative group ${
                active 
                ? 'bg-blue-600 text-white shadow-md' 
                : disabled
                    ? 'text-slate-300 cursor-not-allowed bg-transparent'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={title}
        >
            <Icon size={20} />
            {/* Tooltip */}
             <span className="absolute left-full ml-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {title}
            </span>
        </button>
    )

    return (
        <div 
            className="absolute z-50 flex flex-col gap-2 bg-white/90 backdrop-blur shadow-xl rounded-2xl p-1.5 border border-white/20 select-none"
            style={{ 
                left: position.x, 
                top: position.y,
                cursor: isDragging ? 'grabbing' : 'auto'
            }}
        >
            {/* Drag Handle */}
            <div 
                className="w-full flex justify-center py-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500"
                onMouseDown={handleMouseDown}
            >
                <GripVertical size={16} />
            </div>

            <Btn 
                tool="select" 
                icon={MousePointer2} 
                title="Select" 
                onClick={() => onToolChange('select')}
                active={activeTool === 'select'}
            />

            <div className="h-px bg-slate-200 w-full mx-auto" />

            <Btn 
                icon={Trash2} 
                title="Delete" 
                onClick={onDelete}
                disabled={!hasSelection}
            />

        </div>
    )
}
