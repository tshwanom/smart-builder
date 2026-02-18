
import { StateCreator } from 'zustand'
import { RoomFinishDomain } from '@/modules/finishes/domain/FinishTypes'
import { CanvasStore } from '../storeTypes'

export interface FinishSlice {
  finishSchedules: RoomFinishDomain[]
  finishProducts: any[] // We'll infer this properly in a real app, but 'any' avoids circular deps for now
  
  // Actions
  setFinishProducts: (products: any[]) => void
  updateRoomFinish: (roomId: string, updates: Partial<RoomFinishDomain>) => void
  getRoomFinish: (roomId: string) => RoomFinishDomain | undefined
}

export const createFinishSlice: StateCreator<
  CanvasStore,
  [],
  [],
  FinishSlice
> = (set, get) => ({
  finishSchedules: [],
  finishProducts: [],

  setFinishProducts: (products) => set({ finishProducts: products }),

  updateRoomFinish: (roomId, updates) =>
    set((state) => {
      const existing = state.finishSchedules.find((s) => s.roomId === roomId);
      
      if (existing) {
        return {
          finishSchedules: state.finishSchedules.map((s) =>
            s.roomId === roomId ? { ...s, ...updates } : s
          ),
        };
      } else {
        // Create new
        const newSchedule: RoomFinishDomain = {
          id: `fs-${Date.now()}`,
          roomId,
          projectId: 'current', // Logic to get real project ID needed later
          floor: {},
          walls: {},
          ceiling: {},
          ...updates
        };
        return {
          finishSchedules: [...state.finishSchedules, newSchedule]
        };
      }
    }),

  getRoomFinish: (roomId) => {
    return get().finishSchedules.find((s) => s.roomId === roomId)
  }
})
