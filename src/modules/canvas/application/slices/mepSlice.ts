import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { ElectricalPoint, PlumbingPoint, HVACPoint, MEPConfig } from '../types'
import { MEPSlice } from './interfaces'
import { generateId } from '../utils'

export const createMEPSlice: StateCreator<CanvasStore, [], [], MEPSlice> = (set, get) => ({
  electricalPoints: [],
  plumbingPoints: [],
  hvacPoints: [],
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

  addElectricalPoint: (point: Omit<ElectricalPoint, 'id'>) => set((state) => ({
    electricalPoints: [...state.electricalPoints, { ...point, id: generateId() }]
  })),

  updateElectricalPoint: (id, updates) => set((state) => ({
    electricalPoints: state.electricalPoints.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  deleteElectricalPoint: (id) => set((state) => ({
    electricalPoints: state.electricalPoints.filter(p => p.id !== id)
  })),

  addPlumbingPoint: (point: Omit<PlumbingPoint, 'id'>) => set((state) => ({
    plumbingPoints: [...state.plumbingPoints, { ...point, id: generateId() }]
  })),

  updatePlumbingPoint: (id, updates) => set((state) => ({
    plumbingPoints: state.plumbingPoints.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  deletePlumbingPoint: (id) => set((state) => ({
    plumbingPoints: state.plumbingPoints.filter(p => p.id !== id)
  })),

  addHVACPoint: (point: Omit<HVACPoint, 'id'>) => set((state) => ({
    hvacPoints: [...state.hvacPoints, { ...point, id: generateId() }]
  })),

  updateHVACPoint: (id: string, updates: Partial<HVACPoint>) => set((state) => ({
    hvacPoints: state.hvacPoints.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  deleteHVACPoint: (id: string) => set((state) => ({
    hvacPoints: state.hvacPoints.filter(p => p.id !== id)
  })),

  updateMEPConfig: (config: any) => set((state) => {
    // Handle deep merge for nested config objects
    const newConfig = { ...state.mepConfig }
    
    if ('electrical' in config) {
        newConfig.electrical = { ...newConfig.electrical, ...config.electrical }
    } else if ('plumbing' in config) {
        newConfig.plumbing = { ...newConfig.plumbing, ...config.plumbing }
    } else if ('hvac' in config) {
        newConfig.hvac = { ...newConfig.hvac, ...config.hvac }
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
