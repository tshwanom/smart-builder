import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { ProjectData } from '../types'
import { ProjectSlice } from './interfaces'
import { generateId } from '../utils'
import { Story } from '../types'

export const createProjectSlice: StateCreator<CanvasStore, [], [], ProjectSlice> = (set) => ({
  loadProject: (data: Partial<ProjectData>) => set((state) => {
    console.log('[ProjectSlice] loadProject called with data:', {
      wallCount: data.walls?.length || 0,
      roomCount: data.rooms?.length || 0,
      openingCount: data.openings?.length || 0,
      storyCount: data.stories?.length || 0,
      hasViewport: !!data.viewport
    });

    // Legacy migration: Ensure at least one story exists
    let stories = data.stories || []
    let activeStoryId = state.activeStoryId

    if (stories.length === 0) {
        const defaultStory: Story = {
            id: generateId(),
            name: 'Ground Floor',
            height: 2700,
            level: 0,
            elevation: 0
        }
        stories = [defaultStory]
        activeStoryId = defaultStory.id
    } else {
        // If loading a project with stories, set active to the first one (Ground Floor usually)
        activeStoryId = stories[0].id
    }

    // Assign default story ID to walls/rooms that don't have one
    // Ensure activeStoryId is a string (it's guaranteed to be set by this point)
    const storyIdToAssign: string = activeStoryId!
    
    const wallsWithStory = (data.walls || []).map(w => ({
        ...w,
        storyId: w.storyId ?? storyIdToAssign
    }))
    
    const roomsWithStory = (data.rooms || []).map(r => ({
        ...r,
        storyId: r.storyId ?? storyIdToAssign
    }))
    
    const openingsWithStory = (data.openings || []).map(o => ({
        ...o,
        storyId: o.storyId ?? storyIdToAssign
    }))

    const newState = {
    walls: wallsWithStory,
    rooms: roomsWithStory,
    openings: openingsWithStory,
    roofPanels: data.roofPanels || [],
    electricalPoints: data.electricalPoints || [],
    plumbingPoints: data.plumbingPoints || [],
    mepConfig: data.mepConfig ? { ...state.mepConfig, ...data.mepConfig } : state.mepConfig,
    boqConfig: data.boqConfig ? { ...state.boqConfig, ...data.boqConfig } : state.boqConfig,
    viewport: data.viewport || state.viewport,
    
    // Global Roof Settings (Restore or Default)
    roofPitch: data.roofPitch ?? 20,
    roofOverhang: data.roofOverhang ?? 300,
    showRoof: data.showRoof ?? true,
    showRoofSlopeArrows: data.showRoofSlopeArrows ?? true,
    roofArrowOffset: data.roofArrowOffset ?? 0.8,
    
    
    // Story Data
    stories: stories,
    activeStoryId: activeStoryId,

    // Reset transient state
    isDrawing: false,
    currentWall: [],
    selectedElement: null,
    mousePosition: null
  };

    console.log('[ProjectSlice] loadProject setting new state:', {
      wallCount: newState.walls.length,
      roomCount: newState.rooms.length,
      activeStoryId: newState.activeStoryId,
      wallStoryIds: newState.walls.map(w => w.storyId),
      roomStoryIds: newState.rooms.map(r => r.storyId)
    });

    return newState;
  }),
})
