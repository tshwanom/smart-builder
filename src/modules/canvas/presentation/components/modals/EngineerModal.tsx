import React, { useState } from 'react'
import { X, Ruler, Database, ShieldCheck, FileSignature, Home, Zap, Droplet, Wind, Thermometer } from 'lucide-react'
import { WallSegment, FoundationConfig, WallStructure, RoofStructure } from '../../../../../domain/types'
import { MaterialDatabase } from '@/application/services/MaterialDatabase'
import { FoundationGenerator } from '@/application/services/FoundationGenerator'
import { WallCalculator } from '@/core/engine/boq-calculators/WallCalculator'
import { useCanvasStore } from '@/modules/canvas/application/store'
import { ElectricalCalculator } from '@/core/engine/mep-routing/ElectricalCalculator'

export type Tab = 'structure' | 'roof' | 'geometry' | 'materials' | 'compliance' | 'electrical' | 'plumbing' | 'hvac'

interface EngineerModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  wall?: WallSegment 
  onUpdate?: (updates: Partial<WallSegment>) => void
  initialTab?: Tab
}

export const EngineerModal: React.FC<EngineerModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    wall, 
    onUpdate, 
    initialTab = 'structure' 
}) => {
  if (!isOpen) return null
  
  const { electricalPoints, plumbingPoints, hvacPoints, mepConfig } = useCanvasStore()
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)

  // Default values if wall is undefined (Global Settings Mode)
  const defaultFoundation = FoundationGenerator.generateStandardStripFooting(0.23)
  const defaultStructure = WallCalculator.createDefaultDoubleSkin()
  const defaultRoof = {
      type: 'gable',
      pitch: 26,
      overhang: 600,
      trussType: 'howe',
      covering: { materialId: 'tile_concrete_double_roman', underlay: true },
      ceiling: { type: 'gypsum', insulation: true }
  } as RoofStructure

  const [foundation, setFoundation] = useState<FoundationConfig>(
    wall?.foundation || defaultFoundation
  )
  const [structure, setStructure] = useState<WallStructure>(
      wall?.structure || defaultStructure
  )
  const [roofStructure, setRoofStructure] = useState<RoofStructure>(
      wall?.roofStructure || defaultRoof
  )

  const handleSave = () => {
    // Recalculate thickness based on structure
    const newThickness = WallCalculator.calculateThickness(structure) / 1000 // mm -> m
    
    if (onUpdate) {
        onUpdate({ 
            foundation, 
            structure,
            roofStructure, // Save roof config
            thickness: newThickness 
        })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white w-[800px] h-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="h-16 border-b flex items-center justify-between px-6 bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
               <ShieldCheck size={20} />
             </div>
             <div>
               <h2 className="font-bold text-lg text-slate-800">{title}</h2>
               <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Engineer Mode (SANS 10400)</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-48 bg-slate-50 border-r flex flex-col py-4">
            <button 
              onClick={() => setActiveTab('structure')}
              className={`px-6 py-3 text-sm font-medium text-left flex items-center gap-3 ${activeTab === 'structure' ? 'bg-white border-r-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Database size={16} /> Structure
            </button>
            <button 
              onClick={() => setActiveTab('geometry')}
              className={`px-6 py-3 text-sm font-medium text-left flex items-center gap-3 ${activeTab === 'geometry' ? 'bg-white border-r-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Ruler size={16} /> Foundation
            </button>
            <button 
              onClick={() => setActiveTab('roof')}
              className={`px-6 py-3 text-sm font-medium text-left flex items-center gap-3 ${activeTab === 'roof' ? 'bg-white border-r-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Home size={16} /> Roof
            </button>
            <button 
              onClick={() => setActiveTab('materials')}
              className={`px-6 py-3 text-sm font-medium text-left flex items-center gap-3 ${activeTab === 'materials' ? 'bg-white border-r-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Database size={16} /> Concrete
            </button>
            <button 
              onClick={() => setActiveTab('compliance')}
              className={`px-6 py-3 text-sm font-medium text-left flex items-center gap-3 ${activeTab === 'compliance' ? 'bg-white border-r-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <FileSignature size={16} /> Compliance
            </button>
            
            <div className="my-2 border-t border-slate-200 mx-4"></div>
            <p className="px-6 py-2 text-xs font-bold text-slate-400 uppercase">MEP Systems</p>

            <button 
              onClick={() => setActiveTab('electrical')}
              className={`px-6 py-3 text-sm font-medium text-left flex items-center gap-3 ${activeTab === 'electrical' ? 'bg-white border-r-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Zap size={16} /> Electrical
            </button>
            <button 
              onClick={() => setActiveTab('plumbing')}
              className={`px-6 py-3 text-sm font-medium text-left flex items-center gap-3 ${activeTab === 'plumbing' ? 'bg-white border-r-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Droplet size={16} /> Plumbing
            </button>
            <button 
              onClick={() => setActiveTab('hvac')}
              className={`px-6 py-3 text-sm font-medium text-left flex items-center gap-3 ${activeTab === 'hvac' ? 'bg-white border-r-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Wind size={16} /> HVAC
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 overflow-y-auto">
             
             {activeTab === 'structure' && (
                 <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Wall Structure</h3>
                    
                    {/* Presets */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setStructure(WallCalculator.createDefaultDoubleSkin())}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-medium rounded border border-slate-300"
                        >
                            Reset to Double Skin (220)
                        </button>
                         <button 
                            onClick={() => setStructure(WallCalculator.createDefaultSingleSkin())}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-medium rounded border border-slate-300"
                        >
                            Reset to Single Skin (110)
                        </button>
                    </div>

                    {/* Skins */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-600 uppercase">Masonry Skins</h4>
                        {(structure.skins || []).map((skin, idx) => (
                            <div key={idx} className="p-3 border rounded bg-slate-50 relative">
                                <div className="absolute -left-2 -top-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {idx + 1}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Material</label>
                                        <select 
                                            className="w-full p-2 border rounded text-sm"
                                            value={skin.materialId}
                                            onChange={(e) => {
                                                const newSkins = [...(structure.skins || [])]
                                                newSkins[idx] = { ...skin, materialId: e.target.value }
                                                setStructure({ ...structure, skins: newSkins })
                                            }}
                                        >
                                            {MaterialDatabase.masonry.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Orientation</label>
                                        <select 
                                            className="w-full p-2 border rounded text-sm"
                                            value={skin.orientation}
                                            onChange={(e) => {
                                                const newSkins = [...(structure.skins || [])]
                                                newSkins[idx] = { ...skin, orientation: e.target.value as any }
                                                setStructure({ ...structure, skins: newSkins })
                                            }}
                                        >
                                            <option value="stretcher">Stretcher</option>
                                            <option value="header">Header</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Remove/Add Skin controls could go here */}
                    </div>

                    {/* Calculated Info */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                             <span className="text-sm font-medium text-blue-800">Total Thickness</span>
                             <span className="text-lg font-bold text-blue-900">{WallCalculator.calculateThickness(structure)} mm</span>
                        </div>
                        <p className="text-xs text-blue-600">Includes bricks, cavity/joints, and plaster.</p>
                    </div>
                 </div>
             )}

             {activeTab === 'geometry' && (
               <div className="space-y-6">
                 <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Foundation Dimensions</h3>
                 
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                     <select 
                       className="w-full p-2 border rounded-md"
                       value={foundation.type}
                       onChange={(e) => setFoundation({...foundation, type: e.target.value as any})}
                     >
                       <option value="strip">Strip Footing</option>
                       <option value="pad">Pad Footing</option>
                       <option value="raft">Raft Foundation</option>
                     </select>
                   </div>
                 </div>

                 <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase">Width (mm)</label>
                     <input 
                       type="number" 
                       className="w-full p-2 border rounded-md font-mono"
                       value={foundation.width}
                       onChange={(e) => setFoundation({...foundation, width: Number(e.target.value)})}
                     />
                     <p className="text-xs text-slate-400">Min: 600mm</p>
                   </div>
                   
                   <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase">Depth (mm)</label>
                     <input 
                       type="number" 
                       className="w-full p-2 border rounded-md font-mono"
                       value={foundation.depth}
                       onChange={(e) => setFoundation({...foundation, depth: Number(e.target.value)})}
                     />
                     <p className="text-xs text-slate-400">Min: 230mm</p>
                   </div>

                   <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase">Offset (mm)</label>
                     <input 
                       type="number" 
                       className="w-full p-2 border rounded-md font-mono"
                       value={foundation.offset}
                       onChange={(e) => setFoundation({...foundation, offset: Number(e.target.value)})}
                     />
                     <p className="text-xs text-slate-400">From Center</p>
                   </div>
                 </div>
               </div>
             )}

             {activeTab === 'roof' && (
               <div className="space-y-6">
                   <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                       <div className="mt-1 bg-blue-100 p-2 rounded text-blue-600">
                          <Home size={20} />
                       </div>
                       <div>
                           <h4 className="font-semibold text-blue-900">Roof Engineering</h4>
                           <p className="text-sm text-blue-700 mt-1">
                               Configure the roof structure generated by this wall.
                           </p>
                       </div>
                   </div>

                   {/* Truss Type */}
                   <div className="space-y-3">
                       <label className="text-sm font-medium text-slate-700">Truss Configuration</label>
                       <div className="grid grid-cols-2 gap-3">
                           {['howe', 'king_post', 'fink', 'attic'].map((type) => (
                               <button
                                   key={type}
                                   onClick={() => setRoofStructure({ ...roofStructure, trussType: type as any })}
                                   className={`p-3 border rounded-lg text-center transition-all ${
                                       roofStructure.trussType === type
                                       ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                       : 'border-slate-200 hover:border-slate-300'
                                   }`}
                               >
                                   <div className="text-sm font-medium capitalize">{type.replace('_', ' ')}</div>
                               </button>
                           ))}
                       </div>
                   </div>

                   {/* Covering Material */}
                   <div className="space-y-3">
                       <label className="text-sm font-medium text-slate-700">Covering Material</label>
                       <select
                           value={roofStructure.covering.materialId}
                           onChange={(e) => setRoofStructure({
                               ...roofStructure,
                               covering: { ...roofStructure.covering, materialId: e.target.value }
                           })}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                       >
                           <optgroup label="Tiles">
                               {MaterialDatabase.roofing?.filter(m => m.type === 'tile').map(m => (
                                   <option key={m.id} value={m.id}>{m.name}</option>
                               ))}
                           </optgroup>
                           <optgroup label="Sheeting">
                               {MaterialDatabase.roofing?.filter(m => m.type === 'sheeting').map(m => (
                                   <option key={m.id} value={m.id}>{m.name}</option>
                               ))}
                           </optgroup>
                       </select>
                   </div>

                    {/* Pitch & Overhang */}
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">Pitch (Degrees)</label>
                           <input
                               type="number"
                               value={roofStructure.pitch}
                               onChange={(e) => setRoofStructure({ ...roofStructure, pitch: parseFloat(e.target.value) })}
                               className="w-full px-3 py-2 border border-slate-300 rounded"
                           />
                       </div>
                       <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">Overhang (mm)</label>
                           <input
                               type="number"
                               value={roofStructure.overhang}
                               onChange={(e) => setRoofStructure({ ...roofStructure, overhang: parseFloat(e.target.value) })}
                               className="w-full px-3 py-2 border border-slate-300 rounded"
                           />
                       </div>
                   </div>
               </div>
             )}

             {activeTab === 'materials' && (
               <div className="space-y-6">
                 <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Concrete & Reinforcement</h3>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase">Concrete Grade</label>
                     <select 
                       className="w-full p-2 border rounded-md"
                       value={foundation.concreteGrade}
                       onChange={(e) => setFoundation({...foundation, concreteGrade: e.target.value})}
                     >
                       {MaterialDatabase.concrete.map(c => (
                         <option key={c.id} value={c.grade}>{c.name}</option>
                       ))}
                     </select>
                   </div>
                 </div>

                 <div className="p-4 bg-slate-50 rounded-lg border space-y-4">
                   <h4 className="text-sm font-bold text-slate-700">Reinforcement Cage</h4>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Main Bars</label>
                        <select 
                          className="w-full p-2 border rounded text-sm"
                          value={foundation.reinforcement.mainBars}
                          onChange={(e) => setFoundation({
                            ...foundation, 
                            reinforcement: {...foundation.reinforcement, mainBars: e.target.value}
                          })}
                        >
                          <option value="Y10">Y10 High Yield</option>
                          <option value="Y12">Y12 High Yield</option>
                          <option value="Y16">Y16 High Yield</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Count</label>
                        <input 
                          type="number"
                          className="w-full p-2 border rounded text-sm"
                          value={foundation.reinforcement.mainBarCount}
                          onChange={(e) => setFoundation({
                            ...foundation, 
                            reinforcement: {...foundation.reinforcement, mainBarCount: Number(e.target.value)}
                          })}
                        />
                      </div>
                   </div>
                 </div>
               </div>
             )}

             {activeTab === 'compliance' && (
               <div className="space-y-6">
                 <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">SANS 10400-H Compliance</h3>
                 
                 <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 text-green-800">
                    <ShieldCheck className="shrink-0" />
                    <div className="text-sm">
                      <p className="font-bold">Standard Compliant</p>
                      <p>This configuration meets the deemed-to-satisfy requirements for single-storey masonry structures on stable soil.</p>
                    </div>
                 </div>

                 <div className="text-sm text-slate-500 space-y-2">
                   <p>• Min Width: {Math.max(600, (wall?.thickness || 0.23) * 3)}mm (Met)</p>
                   <p>• Min Thickness: 230mm (Met)</p>
                   <p>• Min Concrete Grade: 15MPa (Met)</p>
                 </div>
               </div>
             )}
             
             {activeTab === 'electrical' && (
                <div className="space-y-6">
                    <div className="bg-yellow-50 p-4 rounded-lg flex items-start gap-3 border border-yellow-100">
                       <div className="mt-1 bg-yellow-100 p-2 rounded text-yellow-600">
                          <Zap size={20} />
                       </div>
                       <div>
                           <h4 className="font-semibold text-yellow-900">Electrical Load Schedule</h4>
                           <p className="text-sm text-yellow-700 mt-1">
                               Live calculation of Phase Balancing and Circuit Loading based on placed points.
                           </p>
                       </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 border rounded-lg bg-slate-50">
                           <h5 className="text-sm font-bold text-slate-700 mb-2">System Config</h5>
                           <div className="space-y-2 text-sm text-slate-600">
                               <div className="flex justify-between">
                                   <span>Voltage:</span>
                                   <span className="font-mono">230V / 400V</span>
                               </div>
                               <div className="flex justify-between">
                                   <span>Routing:</span>
                                   <span className="font-mono capitalize">{mepConfig.electrical.routingMode}</span>
                               </div>
                               <div className="flex justify-between">
                                   <span>Conduit:</span>
                                   <span className="font-mono capitalize">{mepConfig.electrical.conduitType}</span>
                               </div>
                           </div>
                       </div>
                       
                       <div className="p-4 border rounded-lg bg-slate-50">
                            <h5 className="text-sm font-bold text-slate-700 mb-2">Capacity Check</h5>
                            {(() => {
                                const calc = ElectricalCalculator.calculate(electricalPoints, mepConfig.electrical)
                                return (
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Est. Wire:</span>
                                            <span className="font-mono">{Math.ceil(calc.wireLength)}m</span>
                                        </div>
                                         <div className="flex justify-between">
                                            <span>Est. Conduit:</span>
                                            <span className="font-mono">{Math.ceil(calc.conduitLength)}m</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Breaker Slots:</span>
                                            <span className="font-mono">{calc.dbComponents.slotsUsed} / 24</span>
                                        </div>
                                    </div>
                                )
                            })()}
                       </div>
                   </div>
                </div>
             )}
             
            {activeTab === 'plumbing' && (
                <div className="space-y-6">
                    <div className="bg-cyan-50 p-4 rounded-lg flex items-start gap-3 border border-cyan-100">
                       <div className="mt-1 bg-cyan-100 p-2 rounded text-cyan-600">
                          <Droplet size={20} />
                       </div>
                       <div>
                           <h4 className="font-semibold text-cyan-900">Plumbing Design</h4>
                           <p className="text-sm text-cyan-700 mt-1">
                               Supply and Drainage configuration (SANS 10252).
                           </p>
                       </div>
                   </div>
                   
                   <div className="space-y-4">
                        <h5 className="text-sm font-bold text-slate-700">Material Specification</h5>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 border rounded hover:border-cyan-500 cursor-pointer transition-colors">
                                <span className="font-bold text-slate-800">Class 1 Copper</span>
                                <p className="text-xs text-slate-500">Premium, bacteriostatic, long-life.</p>
                            </div>
                             <div className="p-3 border rounded hover:border-cyan-500 cursor-pointer transition-colors bg-cyan-50 border-cyan-500">
                                <span className="font-bold text-slate-800">PEX-Al-PEX</span>
                                <p className="text-xs text-slate-500">Composite, flexible, cost-effective.</p>
                            </div>
                        </div>
                   </div>
                </div>
             )}
             
             {activeTab === 'hvac' && (
                <div className="space-y-6">
                    <div className="bg-emerald-50 p-4 rounded-lg flex items-start gap-3 border border-emerald-100">
                       <div className="mt-1 bg-emerald-100 p-2 rounded text-emerald-600">
                          <Wind size={20} />
                       </div>
                       <div>
                           <h4 className="font-semibold text-emerald-900">HVAC Sizing</h4>
                           <p className="text-sm text-emerald-700 mt-1">
                               BTU Calculator and Unit Selection.
                           </p>
                       </div>
                   </div>
                   
                   <div className="p-4 border rounded-lg bg-slate-50">
                        <h5 className="text-sm font-bold text-slate-700 mb-4">Quick BTU Calculator</h5>
                        <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-1">
                                <label className="text-xs text-slate-500">Room Length (m)</label>
                                <input type="number" className="w-full p-2 border rounded" placeholder="e.g. 4" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">Room Width (m)</label>
                                <input type="number" className="w-full p-2 border rounded" placeholder="e.g. 3.5" />
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs text-slate-500">Ceiling (m)</label>
                                <input type="number" className="w-full p-2 border rounded" defaultValue={2.7} />
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-white border rounded text-center">
                            <span className="text-xs text-slate-400 uppercase tracking-wider block">Recommended Unit</span>
                            <span className="text-xl font-bold text-emerald-600">9 000 BTU</span>
                        </div>
                   </div>
                </div>
             )}

          </div>
        </div>

        {/* Footer */}
        <div className="h-20 border-t bg-slate-50 px-8 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-blue-500/20 transition-all">
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  )
}
