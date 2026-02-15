import React from 'react'
import { useCanvasStore } from '../../../application/store'

export const StatusBar: React.FC = () => {
    const { currentTool, walls, rooms, isDrawing } = useCanvasStore()

    return (
        <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-4 border border-slate-200 pointer-events-none select-none">
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tool</span>
                <span className="text-xs font-bold text-slate-700 capitalize">{currentTool}</span>
            </div>
            <div className="w-px h-3 bg-slate-200"></div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Walls</span>
                <span className="text-xs font-bold text-slate-700">{walls.length}</span>
            </div>
            <div className="w-px h-3 bg-slate-200"></div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rooms</span>
                <span className="text-xs font-bold text-green-600">{rooms.length}</span>
            </div>
            {isDrawing && (
                <>
                    <div className="w-px h-3 bg-slate-200"></div>
                    <span className="text-xs font-bold text-blue-600 animate-pulse">Drawing...</span>
                    {currentTool === 'wall' && (
                        <>
                             <div className="w-px h-3 bg-slate-200"></div>
                             <div className="flex flex-col leading-tight">
                                <span className="text-[10px] text-slate-500 font-medium">Angle Snap: 15°</span>
                                <span className="text-[10px] text-slate-400">Hold Ctrl to Free</span>
                             </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}
