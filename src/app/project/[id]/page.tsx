
'use client'

import React, { useState, useEffect } from 'react'
import { CanvasStage } from "@/modules/canvas/presentation/components"
import { BOQHeaderButton } from "@/modules/boq/presentation/components/BOQHeaderButton"
import { PropertiesPanel } from "@/modules/canvas/presentation/components/ui/PropertiesPanel"
import { Menu, X, ArrowLeft, Loader2, CheckCircle, AlertCircle, Save } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCanvasStore } from '@/modules/canvas/application/store'
import { useShallow } from 'zustand/react/shallow'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAutoSave } from '@/modules/project/application/useAutoSave'

export default function ProjectEditorPage() {
  const { data: session } = useSession()
  const params = useParams()
  const projectId = params.id as string

  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Removed activeTab state
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const { loadProject } = useCanvasStore(useShallow(state => ({
    loadProject: state.loadProject
  })))
  
  // Only enable auto-save after initial load is complete
  const { status, lastSaved, triggerSave } = useAutoSave(isLoading ? null : projectId)

  // Load project data on mount
  useEffect(() => {
    if (!projectId) return

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/project/${projectId}`)
            if (!res.ok) {
                if (res.status === 403) throw new Error('You do not have permission to view this project.')
                if (res.status === 404) throw new Error('Project not found.')
                throw new Error('Failed to load project.')
            }
            
            const data = await res.json()
            
            if (data.project && data.project.geometry) {
                // Parse geometry if it's stored as a string
                const geometry = typeof data.project.geometry === 'string' 
                    ? JSON.parse(data.project.geometry) 
                    : data.project.geometry
                
                // Only load if geometry is not empty/default
                if (Object.keys(geometry).length > 0) {
                    loadProject(geometry)
                }
            }
        } catch (err) {
            console.error(err)
            setLoadError(err instanceof Error ? err.message : 'An unknown error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    fetchProject()
  }, [projectId, loadProject])

  if (isLoading) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-slate-50 flex-col gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-slate-500 font-medium">Loading project...</p>
          </div>
      )
  }

  if (loadError) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50 flex-col gap-4">
            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center max-w-md">
                <AlertCircle className="mx-auto mb-4" size={48} />
                <h2 className="text-xl font-bold mb-2">Error Loading Project</h2>
                <p className="mb-6">{loadError}</p>
                <Link href="/dashboard" className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-semibold">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    )
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-10 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <h1 className="text-lg font-bold text-slate-900">BuildSmart AI</h1>
          <span className="text-xs text-slate-500 hidden md:block">
            Project Editor {projectId ? `(ID: ${projectId.substring(0,8)}...)` : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
           {/* BOQ Header Button */}
           <BOQHeaderButton projectId={projectId} />
           {/* Manual Save Button */}
           <button 
             onClick={triggerSave}
             disabled={status === 'saving'}
             className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
           >
              <Save size={14} />
              Save
           </button>

           {/* Auto-save status */}
           <div className="flex items-center gap-2 text-xs font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                {status === 'saving' && (
                    <>
                        <Loader2 size={14} className="animate-spin text-blue-500" />
                        <span className="text-blue-600">Saving...</span>
                    </>
                )}
                {status === 'saved' && (
                    <>
                        <CheckCircle size={14} className="text-green-500" />
                        <span className="text-slate-500">Saved {lastSaved && `at ${lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}</span>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <AlertCircle size={14} className="text-red-500" />
                        <span className="text-red-600">Save Failed</span>
                    </>
                )}
                {status === 'unsaved' && (
                    <>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-slate-500">Unsaved changes...</span>
                    </>
                )}
           </div>

          <div className="text-sm font-medium text-slate-700 flex items-center gap-2 border-l border-slate-200 pl-6">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
               {session?.user?.name?.[0] || 'U'}
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors ml-2"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 pt-10">
        {/* Canvas Area */}
        <div className="flex-1 relative bg-white">
          <CanvasStage className="w-full h-full" />
        </div>

        {/* Right Sidebar with Tabs */}
        {sidebarOpen && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col z-40 shadow-xl h-full">
            <PropertiesPanel />
          </div>
        )}
      </div>
    </div>
  )
}
