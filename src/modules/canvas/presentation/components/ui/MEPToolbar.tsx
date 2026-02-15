import React from 'react'
import { useCanvasStore } from '../../../application/store'
import { Zap, Droplets, Plug, Lightbulb, ToggleLeft, Box, CheckSquare } from 'lucide-react'

export const MEPToolbar: React.FC = () => {
  const { 
    currentTool, 
    setTool, 
    mepConfig, 
  } = useCanvasStore()

  // Helper to check if we are in an MEP mode
  const isElectrical = ['socket', 'switch', 'light', 'db'].includes(currentTool)
  const isPlumbing = ['basin', 'sink', 'shower', 'toilet', 'source'].includes(currentTool)

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex gap-2 border border-slate-100">
      {/* Mode Switcher */}
       <div className="flex bg-slate-100 rounded-md p-1 gap-1">
            <button
                onClick={() => setTool('select')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!isElectrical && !isPlumbing ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Box size={16} />
                Build
            </button>
             <button
                onClick={() => {
                   if (!mepConfig.hasCompletedWizard) {
                       // This will effectively trigger the wizard in the parent
                       setTool('db') 
                   } else {
                       setTool('socket')
                   }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isElectrical ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Zap size={16} />
                Electrical
            </button>
             <button
                onClick={() => setTool('sink')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isPlumbing ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Droplets size={16} />
                Plumbing
            </button>
       </div>

       {/* Electrical Tools */}
       {isElectrical && (
           <>
               <div className="w-px h-8 bg-slate-200 mx-1 self-center"></div>
               <button
                  onClick={() => setTool('db')}
                  className={`p-2 rounded-md transition-colors ${currentTool === 'db' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Distribution Board"
               >
                  <Box size={20} strokeWidth={2.5} />
               </button>
               <button
                  onClick={() => setTool('socket')}
                  className={`p-2 rounded-md transition-colors ${currentTool === 'socket' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Socket Outlet"
               >
                  <Plug size={20} />
               </button>
                <button
                  onClick={() => setTool('light')}
                  className={`p-2 rounded-md transition-colors ${currentTool === 'light' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Lighting Point"
               >
                  <Lightbulb size={20} />
               </button>
                <button
                  onClick={() => setTool('switch')}
                  className={`p-2 rounded-md transition-colors ${currentTool === 'switch' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Switch"
               >
                  <ToggleLeft size={20} />
               </button>
           </>
       )}

       {/* Plumbing Tools */}
       {isPlumbing && (
           <>
              <div className="w-px h-8 bg-slate-200 mx-1 self-center"></div>
               <button
                  onClick={() => setTool('source')}
                  className={`p-2 rounded-md transition-colors ${currentTool === 'source' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Main Connection / Source"
               >
                  <CheckSquare size={20} />
               </button>
               <button
                  onClick={() => setTool('sink')}
                  className={`p-2 rounded-md transition-colors ${currentTool === 'sink' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Kitchen Sink"
               >
                  <Droplets size={20} />
               </button>
               <button
                  onClick={() => setTool('basin')}
                  className={`p-2 rounded-md transition-colors ${currentTool === 'basin' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Basin"
               >
                  <span className="font-bold text-xs">B</span>
               </button>
               <button
                  onClick={() => setTool('shower')}
                  className={`p-2 rounded-md transition-colors ${currentTool === 'shower' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Shower"
               >
                  <span className="font-bold text-xs">S</span>
               </button>
               <button
                  onClick={() => setTool('toilet')}
                  className={`p-2 rounded-md transition-colors ${currentTool === 'toilet' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Toilet"
               >
                  <span className="font-bold text-xs">WC</span>
               </button>
               <button
                  onClick={() => setTool('bath')}
                  className={`p-2 rounded-md transition-colors ${currentTool === 'bath' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Bath"
               >
                  <span className="font-bold text-xs">Bath</span>
               </button>
           </>
       )}
    </div>
  )
}
