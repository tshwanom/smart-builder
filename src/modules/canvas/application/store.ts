import { create } from 'zustand'
import { temporal } from 'zundo'
import { persist } from 'zustand/middleware'
import { CanvasStore } from './storeTypes'

import { createViewSlice } from './slices/viewSlice'
import { createWallSlice } from './slices/wallSlice'
import { createRoomSlice } from './slices/roomSlice'
import { createConnectionSlice } from './slices/connectionSlice'
import { createRoofSlice } from './slices/roofSlice'
import { createMEPSlice } from './slices/mepSlice'
import { createBOQSlice } from './slices/boqSlice'
import { createProjectSlice } from './slices/projectSlice'
import { createStaircaseSlice } from './slices/staircaseSlice'
import { createStorySlice } from './slices/storySlice'

export const useCanvasStore = create<CanvasStore>()(
  persist(
    temporal(
      (...a) => ({
        ...createViewSlice(...a),
        ...createWallSlice(...a),
        ...createRoomSlice(...a),
        ...createConnectionSlice(...a),
        ...createRoofSlice(...a),
        ...createMEPSlice(...a),
        ...createBOQSlice(...a),
        ...createProjectSlice(...a),
        ...createStorySlice(...a),
        ...createStaircaseSlice(...a),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        temporal: {} as any,
      }),
      {
        limit: 50, // Limit history
        partialize: (state) => {
          const { 
            walls, rooms, openings, roofPanels, 
            electricalPoints, plumbingPoints, 
            mepConfig, boqConfig, stories, staircases
          } = state
          return { 
            walls, rooms, openings, roofPanels, 
            electricalPoints, plumbingPoints, 
            mepConfig, boqConfig, stories, staircases
          }
        },
        equality: (a, b) => JSON.stringify(a) === JSON.stringify(b) // Deep comparison for history
      }
    ),
    {
      name: 'construction-calculator-storage',
      version: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // migration from version 0 to 1
          // For now, just return the persisted state as compatible or reset if needed
          return persistedState
        }
        return persistedState as CanvasStore
      },
      partialize: (state) => ({
        walls: state.walls,
        rooms: state.rooms,
        openings: state.openings,
        roofPanels: state.roofPanels,
        roofPitch: state.roofPitch,
        roofOverhang: state.roofOverhang,
        showRoof: state.showRoof,
        showRoofSlopeArrows: state.showRoofSlopeArrows,
        roofArrowOffset: state.roofArrowOffset,
        electricalPoints: state.electricalPoints,
        plumbingPoints: state.plumbingPoints,
        mepConfig: state.mepConfig,
        boqConfig: state.boqConfig,
        viewport: state.viewport,
        gridSettings: state.gridSettings,
        stories: state.stories,
        activeStoryId: state.activeStoryId
      }),
    }
  )
)
