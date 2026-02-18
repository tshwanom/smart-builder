'use client'

import React, { useState } from 'react'
import { CanvasStage } from "@/modules/canvas/presentation/components"
import { BOQPanel } from "@/modules/boq/presentation/components/BOQPanel"
import { BOQConfigPanel } from "@/modules/boq/presentation/components/BOQConfigPanel"
import { PropertiesPanel } from "@/modules/canvas/presentation/components/PropertiesPanel"
import { Menu, X, Settings, FileText, LogOut } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useGeometryStore } from '@/application/store/geometryStore'

export default function AppPage() {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'properties' | 'boq'>('properties')
  const { boqConfig, updateBoqConfig } = useGeometryStore(state => ({
    boqConfig: state.project.boqConfig,
    updateBoqConfig: state.updateBoqConfig
  }))

  return (
    <div className="flex h-screen w-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-xl font-bold text-slate-900">BuildSmart AI</h1>
          <span className="text-sm text-slate-500 hidden md:block">Professional BOQ Calculator</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
               {session?.user?.name?.[0] || 'U'}
            </div>
            <span className="hidden md:inline">{session?.user?.name || session?.user?.email}</span>
          </div>
          <button 
             onClick={() => signOut({ callbackUrl: '/' })}
             className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
             title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16">
        {/* Canvas Area */}
        <div className="flex-1 relative bg-white">
          <CanvasStage className="w-full h-full" />
          
          {/* Instructions Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
            <h3 className="font-semibold text-blue-900 mb-2">🎯 Quick Start</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Use toolbar to draw walls, add windows/doors</li>
              <li>2. Close the shape to create a room</li>
              <li>3. Switch to BOQ tab to configure and generate</li>
            </ol>
          </div>
        </div>

        {/* Right Sidebar with Tabs */}
        {sidebarOpen && (
          <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
            {/* Tab Headers */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('properties')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${
                  activeTab === 'properties'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Settings size={18} className="inline mr-2" />
                Properties
              </button>
              <button
                onClick={() => setActiveTab('boq')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${
                  activeTab === 'boq'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText size={18} className="inline mr-2" />
                BOQ
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'properties' ? (
                <PropertiesPanel />
              ) : (
                <div className="p-4 space-y-4">
                  <BOQConfigPanel 
                    config={boqConfig}
                    onChange={updateBoqConfig}
                  />
                  <BOQPanel />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
