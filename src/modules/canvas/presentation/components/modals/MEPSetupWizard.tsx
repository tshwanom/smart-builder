import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useCanvasStore } from '../../../application/store'

interface MEPSetupWizardProps {
  onClose: () => void
  initialTab?: 'electrical' | 'plumbing'
}

export const MEPSetupWizard: React.FC<MEPSetupWizardProps> = ({ onClose, initialTab = 'electrical' }) => {
  const { mepConfig, updateMEPConfig, setMEPWizardCompleted } = useCanvasStore()
  const [activeTab, setActiveTab] = useState<'electrical' | 'plumbing'>(initialTab)

  // Local state for wizard steps
  const [step, setStep] = useState<1 | 2>(1)

  const handleElectricalSave = (e: React.FormEvent) => {
    e.preventDefault()
    // Validation logic if needed
    // Move to step 2: Place DB
    setStep(2)
  }

  const handleStartPlacement = () => {
    // IMPORTANT: Set flag so we don't show wizard again immediately
    setMEPWizardCompleted(true)
    
    // Set tool to "Place DB" or appropriate start
    // We haven't implemented specific "place_db" tool yet, so we will handle this in Toolbar
    // For now, just close and let parent handle tool switching
    
    onClose()
  }

  if (step === 2) {
      return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px] border border-blue-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                    {activeTab === 'electrical' ? 'Place Distribution Board' : 'Connect Supply'}
                </h2>
                <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <p className="text-sm text-blue-800 leading-relaxed">
                        To calculate cable lengths intelligently, we need a reference point.
                        <br/><br/>
                        <strong>Please click on a wall</strong> to place the 
                        {activeTab === 'electrical' ? ' Main Distribution Board (DB)' : ' Main Water Connection'}.
                    </p>
                </div>
                
                <div className="flex justify-end gap-3">
                     <button 
                        onClick={() => setStep(1)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleStartPlacement}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm"
                    >
                        Start Placing
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-0 w-[600px] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">MEP Configuration</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
            <button 
                className={`flex-1 py-3 font-medium text-sm ${activeTab === 'electrical' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => setActiveTab('electrical')}
            >
                ⚡ Electrical
            </button>
            <button 
                className={`flex-1 py-3 font-medium text-sm ${activeTab === 'plumbing' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => setActiveTab('plumbing')}
            >
                💧 Plumbing
            </button>
        </div>

        {/* Content */}
        <div className="p-6">
            {activeTab === 'electrical' ? (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Routing Mode</label>
                            <div className="grid grid-cols-1 gap-2">
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mepConfig.electrical.routingMode === 'ceiling' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="routing" 
                                        className="sr-only"
                                        checked={mepConfig.electrical.routingMode === 'ceiling'}
                                        onChange={() => updateMEPConfig({ electrical: { ...mepConfig.electrical, routingMode: 'ceiling' } })}
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-900">Ceiling Routing</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Cables run in ceiling void & drop down</div>
                                    </div>
                                </label>

                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mepConfig.electrical.routingMode === 'floor' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="routing" 
                                        className="sr-only"
                                        checked={mepConfig.electrical.routingMode === 'floor'}
                                        onChange={() => updateMEPConfig({ electrical: { ...mepConfig.electrical, routingMode: 'floor' } })}
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-900">Floor/Slab Routing</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Cables run in floor slab & rise up</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Standard Voltage</label>
                                <select 
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                    value={mepConfig.electrical.voltage}
                                    onChange={(e) => updateMEPConfig({ electrical: { ...mepConfig.electrical, voltage: Number(e.target.value) } })}
                                >
                                    <option value={230}>230V (RSA Standard)</option>
                                    <option value={110}>110V</option>
                                </select>
                            </div>
                            
                             <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Conduit Type</label>
                                <select 
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                    value={mepConfig.electrical.conduitType}
                                    onChange={(e) => updateMEPConfig({ electrical: { ...mepConfig.electrical, conduitType: e.target.value as 'pvc' | 'bosal' } })}
                                >
                                    <option value="pvc">PVC (Standard)</option>
                                    <option value="bosal">Bosal (Steel)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                     <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm">
                        Plumbing configuration is simplified for this version.
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Supply Source</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-md text-sm"
                            value={mepConfig.plumbing.supplyType}
                            onChange={(e) => updateMEPConfig({ plumbing: { ...mepConfig.plumbing, supplyType: e.target.value as 'municipal' | 'tank' } })}
                        >
                            <option value="municipal">Municipal Connection</option>
                            <option value="tank">Septic Tank / Rainwater</option>
                        </select>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end">
            <button 
                onClick={handleElectricalSave}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
            >
                Next Step →
            </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
