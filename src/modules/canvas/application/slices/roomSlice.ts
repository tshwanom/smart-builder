import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { Room } from '../types'
import { RoomSlice } from './interfaces'

export const createRoomSlice: StateCreator<CanvasStore, [], [], RoomSlice> = (set, get) => ({
  rooms: [],

  detectRooms: () => {
    const { walls } = get()
    // Import room detection dynamically to avoid circular deps
    import('@/core/geometry/roomDetection').then(({ detectRooms }) => {
      // Group walls by story
      const wallsByStory: Record<string, typeof walls> = {}
      // Add 'undefined' key for legacy/unassigned walls
      wallsByStory['undefined'] = []

      walls.forEach(w => {
          const key = w.storyId || 'undefined'
          if (!wallsByStory[key]) wallsByStory[key] = []
          wallsByStory[key].push(w)
      })

      let allDetectedRooms: Room[] = []

      // Run detection for each story group
      Object.entries(wallsByStory).forEach(([storyIdKey, storyWalls]) => {
          if (storyWalls.length === 0) return

          const storyRooms = detectRooms(storyWalls)
          // Assign storyId to detected rooms
          const roomsWithStory = storyRooms.map(r => ({
              ...r,
              storyId: storyIdKey === 'undefined' ? undefined : storyIdKey
          }))
          allDetectedRooms = [...allDetectedRooms, ...roomsWithStory]
      })

      set({ rooms: allDetectedRooms })
    })
  },

  selectRoom: (id) => set((state) => {
    const room = state.rooms.find(r => r.id === id)
    return room ? { 
        selectedElement: { type: 'room', data: room },
        selection: [{ type: 'room', data: room }] 
    } : {}
  }),

  updateRoom: (id, updates) => set((state) => {
    const updatedRooms = state.rooms.map(r => 
      r.id === id ? { ...r, ...updates } : r
    )
    const isSelected = state.selectedElement?.type === 'room' && (state.selectedElement?.data as Room)?.id === id
    const updatedElementData = isSelected ? updatedRooms.find(r => r.id === id) : undefined

    const updatedSelection = isSelected && updatedElementData
      ? { type: 'room' as const, data: updatedElementData }
      : state.selectedElement
    
    return { 
      rooms: updatedRooms,
      selectedElement: updatedSelection
    }
  }),
})
