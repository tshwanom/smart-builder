import React, { useState, useEffect } from 'react'
import { 
    MousePointer2, BrickWall, AppWindow, DoorOpen, Trash2, Home, 
    Zap, Droplet, Wind, Hammer, ArrowLeft, Settings, Database, Columns, RectangleHorizontal, LayoutDashboard,
    Box
} from 'lucide-react'
import { ToolType } from '../../hooks/useCanvasInteraction'
import { Tab } from '../modals/EngineerModal'

interface ToolPaletteProps {
    activeTool: ToolType
    onToolChange: (tool: ToolType) => void
    onDelete: () => void
    hasSelection: boolean
    onGenerateRoof: () => void
    onOpenSettings: (tab: Tab) => void
}

type MainCategory = 'build' | 'mep' | 'structure'
type MEPSubCategory = 'electrical' | 'plumbing' | 'hvac'

export const ToolPalette: React.FC<ToolPaletteProps> = ({
    activeTool,
    onToolChange,
    onDelete,
    hasSelection,
    onGenerateRoof,
    onOpenSettings
}) => {
    const [mainCategory, setMainCategory] = useState<MainCategory>('build')
    const [mepSubCategory, setMepSubCategory] = useState<MEPSubCategory>('electrical')

    // Auto-switch categories if external tool change occurs (optional, but good for UX)
    // For now, we prefer manual navigation unless strictly needed.

    const isSelected = (tool: ToolType) => activeTool === tool
    
    // Tiny Button for Tools
    const ToolBtn = ({ tool, icon: Icon, title }: { tool: ToolType, icon: any, title: string }) => (
        <button
            onClick={() => onToolChange(tool)}
            className={`p-2 rounded-lg transition-all flex items-center justify-center text-slate-600 hover:bg-slate-100 relative group ${
                isSelected(tool) 
                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-1' 
                : 'hover:text-slate-900'
            }`}
            title={title}
        >
            <Icon size={20} />
             {/* Tooltip */}
             <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {title}
            </span>
        </button>
    )

    // Category Tab Button
    const CatBtn = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon?: any, label: string }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                active 
                ? 'bg-white shadow-sm text-slate-800 ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
        >
            {Icon && <Icon size={14} />}
            {label}
        </button>
    )

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col gap-2 items-center">
            
            {/* MAIN BAR */}
            <div className="bg-slate-50/90 backdrop-blur-md p-1.5 rounded-xl shadow-xl border border-white/20 flex items-center gap-1 transition-all duration-300 ease-out">
                
                {/* Main Categories */}
                <div className="flex bg-slate-200/50 p-1 rounded-lg gap-0.5">
                    <CatBtn 
                        active={mainCategory === 'build'} 
                        onClick={() => setMainCategory('build')} 
                        icon={Box}
                        label="Build" 
                    />
                    <CatBtn 
                        active={mainCategory === 'mep'} 
                        onClick={() => setMainCategory('mep')} 
                        icon={Zap} // Generic MEP icon? Zap/Droplet combo?
                        label="MEP" 
                    />
                     <CatBtn 
                        active={mainCategory === 'structure'} 
                        onClick={() => setMainCategory('structure')} 
                        icon={Columns}
                        label="Structure" 
                    />
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Sub Categories (Only for MEP) */}
                {mainCategory === 'mep' && (
                    <>
                        <div className="flex bg-slate-200/50 p-1 rounded-lg gap-0.5 animate-in slide-in-from-left-2 fade-in duration-200">
                             <CatBtn 
                                active={mepSubCategory === 'electrical'} 
                                onClick={() => setMepSubCategory('electrical')} 
                                icon={Zap}
                                label="Electrical" 
                            />
                             <CatBtn 
                                active={mepSubCategory === 'plumbing'} 
                                onClick={() => setMepSubCategory('plumbing')} 
                                icon={Droplet}
                                label="Plumbing" 
                            />
                             <CatBtn 
                                active={mepSubCategory === 'hvac'} 
                                onClick={() => setMepSubCategory('hvac')} 
                                icon={Wind}
                                label="HVAC" 
                            />
                        </div>
                        <div className="w-px h-6 bg-slate-300 mx-1" />
                    </>
                )}

                {/* TOOLS AREA */}
                <div className="flex items-center gap-1 px-1">
                    
                    {mainCategory === 'build' && (
                        <>
                            <ToolBtn tool="wall" icon={BrickWall} title="Wall" />
                            <ToolBtn tool="door" icon={DoorOpen} title="Door" />
                            <ToolBtn tool="window" icon={AppWindow} title="Window" />
                            <ToolBtn tool="staircase" icon={LayoutDashboard} title="Stairs" />
                            <button
                                onClick={onGenerateRoof}
                                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-orange-600 transition-colors"
                                title="Generate Roof"
                            >
                                <Home size={20} />
                            </button>
                            
                            <div className="w-px h-6 bg-slate-300 mx-1" />
                            
                             <button 
                                onClick={() => onOpenSettings('structure')} 
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Structure Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </>
                    )}

                    {mainCategory === 'structure' && (
                         <>
                            <ToolBtn tool="structural_column" icon={Columns} title="Column" />
                            <ToolBtn tool="structural_beam" icon={RectangleHorizontal} title="Beam" />
                            <ToolBtn tool="structural_slab" icon={Database} title="Slab" />
                            
                             <div className="w-px h-6 bg-slate-300 mx-1" />
                            
                             <button 
                                onClick={() => onOpenSettings('structure')} 
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Structure Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </>
                    )}

                    {mainCategory === 'mep' && mepSubCategory === 'electrical' && (
                        <>
                            <ToolBtn tool="electrical_db" icon={Zap} title="DB Box" />
                            <ToolBtn tool="electrical_socket" icon={Zap} title="Socket" />
                            <ToolBtn tool="electrical_switch" icon={Zap} title="Switch" />
                            <ToolBtn tool="electrical_light" icon={Zap} title="Light" />
                             
                            <div className="w-px h-6 bg-slate-300 mx-1" />
                            
                             <button 
                                onClick={() => onOpenSettings('electrical')} 
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Electrical Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </>
                    )}

                     {mainCategory === 'mep' && mepSubCategory === 'plumbing' && (
                        <>
                            <ToolBtn tool="plumbing_source" icon={Droplet} title="Source" />
                            <ToolBtn tool="plumbing_sink" icon={Droplet} title="Sink" />
                            <ToolBtn tool="plumbing_toilet" icon={Droplet} title="Toilet" />
                            <ToolBtn tool="plumbing_shower" icon={Droplet} title="Shower" />
                            <ToolBtn tool="plumbing_bath" icon={Droplet} title="Bath" />

                             <div className="w-px h-6 bg-slate-300 mx-1" />
                            
                             <button 
                                onClick={() => onOpenSettings('plumbing')} 
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Plumbing Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </>
                    )}

                    {mainCategory === 'mep' && mepSubCategory === 'hvac' && (
                        <>
                            <ToolBtn tool="hvac_unit" icon={Wind} title="AC Unit" />
                            <ToolBtn tool="hvac_duct" icon={Wind} title="Duct" />

                            <div className="w-px h-6 bg-slate-300 mx-1" />
                            
                             <button 
                                onClick={() => onOpenSettings('hvac')} 
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="HVAC Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </>
                    )}

                </div>

            </div>
            
        </div>
    )
}
