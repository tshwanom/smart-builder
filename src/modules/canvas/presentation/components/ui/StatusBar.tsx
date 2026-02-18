import React from 'react'
import { ToolType } from '../../hooks/useCanvasInteraction'

interface StatusBarProps {
    activeTool: ToolType
    mousePos: { x: number, y: number } | null
    wallsCount: number
    roomsCount: number
    projectArea: number // m²
    estimatedCost: number // Currency
    currencySymbol: string
}

export const StatusBar: React.FC<StatusBarProps> = ({
    activeTool,
    mousePos,
    wallsCount,
    roomsCount,
    projectArea,
    estimatedCost,
    currencySymbol
}) => {
    
    // Helper for formatting currency
    const formatCurrency = (amount: number) => {
        // We manually format because Intl might not match the symbol exactly if we just use 'USD' etc.
        // Actually, let's just use the symbol provided.
        return `${currencySymbol} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`
    }

    // Helper for tool name display
    const getToolName = (tool: string) => {
        return tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-200 px-6 py-2 flex items-center gap-6 text-xs font-medium text-slate-600 select-none pointer-events-none">
            
            {/* Active Tool */}
            <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Tool</span>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {getToolName(activeTool)}
                </span>
            </div>

            <div className="w-px h-4 bg-slate-300" />

            {/* Counts */}
            <div className="flex gap-4">
                <span title="Total Walls">Walls: <strong className="text-slate-800">{wallsCount}</strong></span>
                <span title="Total Rooms">Rooms: <strong className="text-slate-800">{roomsCount}</strong></span>
            </div>

             <div className="w-px h-4 bg-slate-300" />

            {/* Project Stats (Featured) */}
            <div className="flex gap-4 items-center">
                <div className="flex flex-col leading-none">
                     <span className="text-[10px] text-slate-400 uppercase">Total Area</span>
                     <span className="text-slate-800 font-bold">{projectArea.toFixed(1)} m²</span>
                </div>
                 <div className="flex flex-col leading-none">
                     <span className="text-[10px] text-slate-400 uppercase">Est. Cost</span>
                     <span className="text-emerald-600 font-bold">{formatCurrency(estimatedCost)}</span>
                </div>
            </div>

            <div className="w-px h-4 bg-slate-300" />

            {/* Coordinates */}
             <div className="font-mono text-slate-400 w-[120px] text-right">
                {mousePos ? `X: ${mousePos.x.toFixed(2)}  Y: ${mousePos.y.toFixed(2)}` : '--'}
            </div>

        </div>
    )
}
