import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { BOQConfig } from '../types'
import { BOQSlice } from './interfaces'

export const createBOQSlice: StateCreator<CanvasStore, [], [], BOQSlice> = (set, get) => ({
  boqConfig: {
    roofType: 'gable',
    roofPitch: 26,
    finishes: {
      floor: 'tiles',
      walls: 'plaster',
      ceiling: 'paint'
    }
  },

  updateBOQConfig: (config) => set((state) => ({
    boqConfig: { ...state.boqConfig, ...config }
  })),
})
