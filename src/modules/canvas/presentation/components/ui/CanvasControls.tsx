import React, { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, Maximize, Grid, Magnet, GripVertical } from 'lucide-react'

interface CanvasControlsProps {
    scale: number
    onZoomIn: () => void
    onZoomOut: () => void
    onFitScreen: () => void
    showGrid: boolean
    onToggleGrid: () => void
    snapEnabled: boolean
    onToggleSnap: () => void
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
    scale,
    onZoomIn,
    onZoomOut,
    onFitScreen,
    showGrid,
    onToggleGrid,
    snapEnabled,
    onToggleSnap
}) => {
    // Initial position: Right Side (Fixed relative to window width initially)
    const [position, setPosition] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 70 : 1000, y: 100 }) 
    const [isDragging, setIsDragging] = useState(false)
    const dragOffset = useRef({ x: 0, y: 0 })

    // Ensure it stays on screen on resize (basic)
    useEffect(() => {
        const handleResize = () => {
             setPosition(p => ({
                 x: Math.min(p.x, window.innerWidth - 60),
                 y: Math.min(p.y, window.innerHeight - 200)
             }))
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])


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

    const CtrlBtn = ({ icon: Icon, title, onClick, active }: { icon: any, title: string, onClick: () => void, active?: boolean }) => (
        <button
            onClick={onClick}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center relative group ${
                active 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={title}
        >
            <Icon size={18} />
             {/* Tooltip (Left side) */}
             <span className="absolute right-full mr-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {title}
            </span>
        </button>
    )

    return (
        <div 
            className="absolute z-50 flex flex-col gap-1.5 bg-white/90 backdrop-blur shadow-xl rounded-2xl p-1.5 border border-white/20 select-none"
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

            <CtrlBtn icon={ZoomIn} title="Zoom In" onClick={onZoomIn} />
            
            <div className="text-[10px] font-bold text-slate-400 text-center py-1 select-none pointer-events-none">
                {Math.round(scale)}%
            </div>

            <CtrlBtn icon={ZoomOut} title="Zoom Out" onClick={onZoomOut} />
            
            <div className="h-px bg-slate-200 w-3/4 mx-auto my-1" />

            <CtrlBtn icon={Maximize} title="Fit to Screen" onClick={onFitScreen} />
            
            <div className="h-px bg-slate-200 w-3/4 mx-auto my-1" />

            <CtrlBtn icon={Grid} title={`Grid: ${showGrid ? 'On' : 'Off'}`} onClick={onToggleGrid} active={showGrid} />
            <CtrlBtn icon={Magnet} title={`Snap: ${snapEnabled ? 'On' : 'Off'}`} onClick={onToggleSnap} active={snapEnabled} />

        </div>
    )
}
