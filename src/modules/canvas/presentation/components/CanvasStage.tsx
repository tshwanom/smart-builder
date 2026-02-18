import React, { useState, useEffect } from 'react'
import { SvgCanvas } from './SvgCanvas'
import { EngineerModal } from './modals/EngineerModal'

interface CanvasStageProps {
  className?: string 
}

export const CanvasStage: React.FC<CanvasStageProps> = ({ className }) => { 
  const [isEngineerModalOpen, setIsEngineerModalOpen] = useState(false)
  const [initialTab, setInitialTab] = useState<any>(undefined)

  // Listen for Palette Settings Events
  useEffect(() => {
      const handleOpenSettings = (e: CustomEvent) => {
          setInitialTab(e.detail.tab)
          setIsEngineerModalOpen(true)
      }
      window.addEventListener('open-engineer-modal', handleOpenSettings as any)
      return () => window.removeEventListener('open-engineer-modal', handleOpenSettings as any)
  }, [])

  return (
    <div className="w-full h-full relative">
      <SvgCanvas />
      
      {/* Modals */}
      <EngineerModal 
        isOpen={isEngineerModalOpen}
        onClose={() => setIsEngineerModalOpen(false)}
        title="Project Engineering"
        initialTab={initialTab}
        wall={undefined} // Global settings
        onUpdate={(updates) => {
             // Handle global updates if needed, e.g. update default wall config
             // For now, modal is mostly read-only or saves to store directly
        }}
      />
      {/* 
          TODO: Re-integrate toolbars here or create new ones for the SVG engine.
          The legacy implementation is preserved in CanvasStage.legacy.tsx
      */}
    </div>
  )
}
