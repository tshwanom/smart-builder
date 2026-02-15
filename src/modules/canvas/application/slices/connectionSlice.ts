import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { Opening } from '../types'
import { ConnectionSlice } from './interfaces'
import { generateId } from '../utils'

export const createConnectionSlice: StateCreator<CanvasStore, [], [], ConnectionSlice> = (set) => ({
  openings: [],
  activeOpeningType: null,

  addOpening: (wallId, type, position, properties) => set((state) => {
    const targetWall = state.walls.find(w => w.id === wallId)
    const storyId = targetWall?.storyId

    const newOpening: Opening = {
      id: generateId(),
      wallId,
      storyId, // Inherit story from wall
      type,
      width: properties?.width || (type === 'door' ? 0.9 : 1.2), // Use active properties or default
      height: properties?.height || (type === 'door' ? 2.1 : 1.2),
      position,
      sillHeight: properties?.sillHeight || (type === 'window' ? 1.0 : 0),
      ...properties // Spread other properties like subtype, material etc.
    }
    return { openings: [...state.openings, newOpening] }
  }),
  
  deleteOpening: (id) => set((state) => ({
    openings: state.openings.filter(o => o.id !== id)
  })),
  
  setActiveOpeningType: (opening) => set({ activeOpeningType: opening }),
  
  updateOpening: (id, updates) => set((state) => {
    const updatedOpenings = state.openings.map(o => o.id === id ? { ...o, ...updates } : o)
    
    // Check if the selected item is this opening, if so update the selection reference
    const isSelected = state.selectedElement?.type === 'opening' && (state.selectedElement?.data as Opening)?.id === id
    const updatedElementData = isSelected ? updatedOpenings.find(o => o.id === id) : undefined

    const updatedSelection = isSelected && updatedElementData
        ? { type: 'opening' as const, data: updatedElementData }
        : state.selectedElement

    return {
        openings: updatedOpenings,
        selectedElement: updatedSelection
    }
  }),
})
