import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { RoofPanel, Point } from '../types'
import { RoofSlice } from './interfaces'
// import { Vec2 } from '../../domain/geometry/roof/Vec2' // Point is compatible/identical

export const createRoofSlice: StateCreator<CanvasStore, [], [], RoofSlice> = (set) => ({
  roofPanels: [],
  roofPitch: 25,
  roofOverhang: 600,
  showRoof: false,
  
  setRoofPitch: (pitch) => set({ roofPitch: pitch }),
  setRoofOverhang: (overhang) => set({ roofOverhang: overhang }),
  toggleRoof: (show) => set({ showRoof: show }),
  
  showRoofSlopeArrows: true,
  toggleRoofSlopeArrows: (show) => set({ showRoofSlopeArrows: show }),
  
  roofArrowOffset: 0.8,
  setRoofArrowOffset: (offset) => set({ roofArrowOffset: offset }),

  createRoofPanel: (roomId, storyId, type, footprint) => set((state) => {
    let usedFootprint: Point[] | undefined = footprint
    let area = 0

    if (!usedFootprint && roomId) {
        const room = state.rooms.find(r => r.id === roomId)
        if (room) {
             area = room.area
             // In future, we might copy room polygon to usedFootprint here to decouple
             // usedFootprint = [...room.polygon]
        }
    }

    const newPanel: RoofPanel = {
      id: `roof-${Date.now()}`,
      roomId: roomId,
      storyId: storyId,
      footprint: usedFootprint,
      type,
      selected: false,
      area: area,
      // Default configurations
      pitchedConfig: type === 'pitched' ? {
        style: 'gable',
        pitch: 30,
        trussType: 'timber',
        trussSpacing: 600,
        sheeting: 'IBR',
        insulation: false,
        ceiling: 'plasterboard'
      } : undefined,
      flatConfig: type === 'flat' ? {
        slabType: 'insitu',
        thickness: 150,
        reinforcement: 'Y12@200 B/W',
        finish: 'waterproofing',
        fall: '1:100'
      } : undefined,
      volume: type === 'flat' ? area * 0.15 : undefined // 150mm default
    }
    
    return { roofPanels: [...state.roofPanels, newPanel] }
  }),
  
  updateRoofPanel: (id, updates) => set((state) => {
    const updatedPanels = state.roofPanels.map(panel => 
      panel.id === id ? { ...panel, ...updates } : panel
    )

    const isSelected = state.selectedElement?.type === 'roof' && (state.selectedElement?.data as RoofPanel)?.id === id
    const updatedElementData = isSelected ? updatedPanels.find(p => p.id === id) : undefined

    const updatedSelection = isSelected && updatedElementData
        ? { type: 'roof' as const, data: updatedElementData }
        : state.selectedElement

    return {
        roofPanels: updatedPanels,
        selectedElement: updatedSelection
    }
  }),
  
  deleteRoofPanel: (id) => set((state) => ({
    roofPanels: state.roofPanels.filter(panel => panel.id !== id)
  })),
  
  selectRoofPanel: (id) => set((state) => {
    const panel = state.roofPanels.find(p => p.id === id)
    if (!panel) return state
    
    return {
      roofPanels: state.roofPanels.map(p => ({
        ...p,
        selected: p.id === id
      })),
      selectedElement: { type: 'roof' as const, data: panel }
    }
  }),

  editingRoofId: null,
  setEditingRoofId: (id) => set({ editingRoofId: id }),
})
