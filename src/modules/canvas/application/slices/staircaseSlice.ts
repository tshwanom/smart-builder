import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { StaircaseSlice } from './interfaces'
import { generateId } from '../utils'

export const createStaircaseSlice: StateCreator<CanvasStore, [], [], StaircaseSlice> = (set) => ({
  staircases: [],

  addStaircase: (staircaseData) => {
    set((state) => ({
      staircases: [
        ...state.staircases,
        {
          ...staircaseData,
          id: generateId()
        }
      ]
    }))
  },

  updateStaircase: (id, updates) => {
    set((state) => ({
      staircases: state.staircases.map((s) => 
        s.id === id ? { ...s, ...updates } : s
      )
    }))
  },

  removeStaircase: (id) => {
    set((state) => ({
      staircases: state.staircases.filter((s) => s.id !== id)
    }))
  }
})
