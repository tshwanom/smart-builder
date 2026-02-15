import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { ElectricalPoint, PlumbingPoint, MEPConfig } from '../types'
import { MEPSlice } from './interfaces'
import { generateId } from '../utils'

export const createMEPSlice: StateCreator<CanvasStore, [], [], MEPSlice> = (set, get) => ({
  electricalPoints: [],
  plumbingPoints: [],
  mepConfig: {
    hasCompletedWizard: false,
    electrical: {
      routingMode: 'floor', // default
      ceilingHeight: 2700,
      voltage: 230,
      conduitType: 'pvc',
      wireType: 'house_wire'
    },
    plumbing: {
      supplyType: 'municipal',
      pipeType: 'copper'
    }
  },

  addElectricalPoint: (point) => set((state) => ({
    electricalPoints: [...state.electricalPoints, { ...point, id: generateId() }]
  })),

  updateElectricalPoint: (id, updates) => set((state) => ({
    electricalPoints: state.electricalPoints.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  deleteElectricalPoint: (id) => set((state) => ({
    electricalPoints: state.electricalPoints.filter(p => p.id !== id)
  })),

  addPlumbingPoint: (point) => set((state) => ({
    plumbingPoints: [...state.plumbingPoints, { ...point, id: generateId() }]
  })),

  updatePlumbingPoint: (id, updates) => set((state) => ({
    plumbingPoints: state.plumbingPoints.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  deletePlumbingPoint: (id) => set((state) => ({
    plumbingPoints: state.plumbingPoints.filter(p => p.id !== id)
  })),

  updateMEPConfig: (config) => set((state) => {
    // Handle deep merge for nested config objects
    const newConfig = { ...state.mepConfig }
    
    if ('electrical' in config) {
        newConfig.electrical = { ...newConfig.electrical, ...config.electrical }
    } else if ('plumbing' in config) {
        newConfig.plumbing = { ...newConfig.plumbing, ...config.plumbing }
    } else {
         // shallow merge for top level props (like hasCompletedWizard)
         Object.assign(newConfig, config)
    }
    
    return { mepConfig: newConfig }
  }),

  setMEPWizardCompleted: (completed) => set((state) => ({
    mepConfig: { ...state.mepConfig, hasCompletedWizard: completed }
  })),
})
