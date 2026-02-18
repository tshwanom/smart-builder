
import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { StructureSlice } from './interfaces'
import { StructureElementDomain } from '@/modules/structure/domain/StructureTypes'

export const createStructureSlice: StateCreator<
  CanvasStore,
  [], 
  [], 
  StructureSlice
> = (set) => ({
  structureElements: [],
  
  addStructureElement: (element) => set((state) => ({ 
    structureElements: [...state.structureElements, element] 
  })),

  updateStructureElement: (id, updates) => set((state) => ({
    structureElements: state.structureElements.map((el) => 
      el.id === id ? { ...el, ...updates } : el
    )
  })),

  removeStructureElement: (id) => set((state) => ({
    structureElements: state.structureElements.filter((el) => el.id !== id)
  })),

  setStructureElements: (elements) => set({ structureElements: elements })
})
