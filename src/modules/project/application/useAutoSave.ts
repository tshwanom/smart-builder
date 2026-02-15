
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCanvasStore } from '@/modules/canvas/application/store'
import { debounce } from '@/lib/utils'
import { useShallow } from 'zustand/react/shallow'

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved'

export function useAutoSave(projectId: string | null) {
  const [status, setStatus] = useState<SaveStatus>('saved')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Select all state that needs saving using useShallow to prevent unnecessary re-renders
  const stateToSave = useCanvasStore(useShallow(state => ({
    walls: state.walls,
    rooms: state.rooms,
    openings: state.openings,
    roofPanels: state.roofPanels,
    roofPitch: state.roofPitch,
    roofOverhang: state.roofOverhang,
    showRoof: state.showRoof,
    showRoofSlopeArrows: state.showRoofSlopeArrows,
    roofArrowOffset: state.roofArrowOffset,
    boqConfig: state.boqConfig,
    viewport: state.viewport,
    stories: state.stories,
    activeStoryId: state.activeStoryId
  })))

  const saveProject = useCallback(async (data: typeof stateToSave) => {
    if (!projectId) return

    setStatus('saving')
    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geometry: data })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Auto-save failed:', response.status, errorText)
        throw new Error(`Failed to save: ${response.status} ${errorText}`)
      }

      setStatus('saved')
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save error exception:', error)
      setStatus('error')
    }
  }, [projectId])

  // Keep the latest save function in a ref to avoid stale closures in debounce
  const saveProjectRef = useRef(saveProject)

  useEffect(() => {
    saveProjectRef.current = saveProject
  }, [saveProject])

  // Debounced save function - created ONCE
  const debouncedSave = useRef(
    debounce((data: typeof stateToSave) => {
      saveProjectRef.current(data)
    }, 2000)
  ).current

  // Watch for changes
  useEffect(() => {
    if (!projectId) return
    
    setStatus('unsaved') // Visually indicate change immediately
    debouncedSave(stateToSave)
    
    // Cleanup
    return () => {
      debouncedSave.cancel()
    }
  }, [stateToSave, debouncedSave, projectId])

  // Manual save trigger
  const triggerSave = useCallback(() => {
    if (projectId) {
      debouncedSave.cancel() // Cancel pending auto-save
      saveProject(stateToSave) // Save immediately
    }
  }, [projectId, stateToSave, saveProject, debouncedSave])

  return { status, lastSaved, triggerSave }
}
