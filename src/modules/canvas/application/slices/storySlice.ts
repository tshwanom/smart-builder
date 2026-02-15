import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { Story } from '../types'
import { StorySlice } from './interfaces'
import { generateId } from '../utils'

export const createStorySlice: StateCreator<CanvasStore, [], [], StorySlice> = (set) => ({
  stories: [],
  activeStoryId: null,

  addStory: (name, height) => set((state) => {
    // Determine the level and elevation
    const sortedStories = [...state.stories].sort((a, b) => a.level - b.level)
    const lastStory = sortedStories[sortedStories.length - 1]
    
    const level = lastStory ? lastStory.level + 1 : 0
    const elevation = lastStory ? lastStory.elevation + lastStory.height : 0
    
    const newStory: Story = {
      id: generateId(),
      name: name || `Level ${level}`,
      height: height || 2700, // Default 2.7m
      level,
      elevation
    }
    
    return {
      stories: [...state.stories, newStory],
      activeStoryId: newStory.id // Switch to new story? Maybe optional.
    }
  }),

  updateStory: (id, updates) => set((state) => ({
    stories: state.stories.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  deleteStory: (id) => set((state) => {
    // Prevent deleting the last remaining story? 
    // Or maybe just let it be empty and handle that?
    // Let's allow deletion but if active story is deleted, switch to another.
    
    const newStories = state.stories.filter(s => s.id !== id)
    let newActiveId = state.activeStoryId
    
    if (state.activeStoryId === id) {
        newActiveId = newStories.length > 0 ? newStories[0].id : null
    }

    return {
        stories: newStories,
        activeStoryId: newActiveId
    }
  }),

  setActiveStory: (id) => set({ activeStoryId: id })
})
