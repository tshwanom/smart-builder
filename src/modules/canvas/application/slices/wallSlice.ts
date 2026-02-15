import { StateCreator } from 'zustand'
import { CanvasStore } from '../storeTypes'
import { Point, Wall, Opening } from '../types'
import { WallSlice } from './interfaces'
import { generateId } from '../utils'

import { WallCalculator } from '../../domain/WallCalculator'

export const createWallSlice: StateCreator<CanvasStore, [], [], WallSlice> = (set, get) => ({
  walls: [],
  currentWall: [],
  activeDimension: null,
  activeTemplate: null, // Store active template object

  setActiveTemplate: (template) => set({ activeTemplate: template }),

  startWall: (point) => set((state) => ({ 
    isDrawing: true, 
    currentWall: [point] 
  })),

  addWallPoint: (point) => set((state) => {
    if (state.currentWall.length === 0) return {}

    const startPoint = state.currentWall[0]
    const endPoint = point

    // Skip zero length or very short segments
    if (Math.abs(startPoint.x - endPoint.x) < 0.001 && Math.abs(startPoint.y - endPoint.y) < 0.001) {
         return {}
    }

    const segmentLength = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2))

    // Determine thickness from active template or default
    let thickness = 0.23 // Default to 230mm if no template
    if (state.activeTemplate) {
        thickness = WallCalculator.getVisualThickness(state.activeTemplate)
    }

    const newWall: Wall = {
        id: generateId(),
        points: [startPoint, endPoint],
        thickness: thickness,
        completed: true,
        height: 2.7,
        wallType: 'load-bearing',
        length: segmentLength,
        templateId: state.activeTemplate?.id,
        storyId: state.activeStoryId || undefined // Use undefined if null
    }

    return { 
        walls: [...state.walls, newWall],
        currentWall: [endPoint] // Start next segment from here
    }
  }),

  addWall: (wallProps) => {
      set((state) => {
      if (!wallProps.points || wallProps.points.length !== 2) return {}
      
      const newWall: Wall = {
          id: generateId(),
          points: wallProps.points as Point[],
          thickness: wallProps.thickness || 0.23,
          completed: true,
          height: wallProps.height || 2.7,
          wallType: wallProps.wallType || 'load-bearing',
          length: wallProps.length || Math.sqrt(Math.pow(wallProps.points[1].x - wallProps.points[0].x, 2) + Math.pow(wallProps.points[1].y - wallProps.points[0].y, 2)),
          storyId: state.activeStoryId || undefined,
          ...wallProps
      }
      return { walls: [...state.walls, newWall] }
    })
    get().detectRooms()
  },

  completeWall: () => {
    set({
        isDrawing: false,
        currentWall: []
    })
    get().detectRooms()
  },

  cancelWall: () => set({ isDrawing: false, currentWall: [] }),

  deleteWall: (id) => {
    set((state) => {
        const isSelectedWall = state.selectedElement?.type === 'wall' && (state.selectedElement?.data as Wall)?.id === id
        const isSelectedOpeningOnWall = state.selectedElement?.type === 'opening' && (state.selectedElement?.data as Opening)?.wallId === id
        
        return {
            walls: state.walls.filter(w => w.id !== id),
            openings: state.openings.filter(o => o.wallId !== id),
            selectedElement: (isSelectedWall || isSelectedOpeningOnWall) ? null : state.selectedElement
        }
    })
    // Immediately trigger room detection
    get().detectRooms()
  },

  selectWall: (id) => set((state) => {
    const wall = state.walls.find(w => w.id === id)
    return wall ? { 
        selectedElement: { type: 'wall', data: wall },
        selection: [{ type: 'wall', data: wall }]
    } : {}
  }),

  updateWall: (id, updates) => {
    set((state) => {
    // 1. Find the wall being updated
    const wallToUpdate = state.walls.find(w => w.id === id)
    if (!wallToUpdate) return {}

    // 2. Prepare the updated wall object
    const updatedWall = { ...wallToUpdate, ...updates }
    
    // 3. If points are changing, check for connected walls (Drag Logic)
    let updatedWalls = state.walls.map(w => w.id === id ? updatedWall : w)

        if (updates.points && wallToUpdate) {
            const oldPoints = wallToUpdate.points
            const newPoints = updates.points

            // Helper to update connections for a specific point index
            const updateConnectedWalls = (pointIndex: 0 | 1, currentWalls: Wall[]) => {
                const oldPos = oldPoints[pointIndex]
                const newPos = newPoints[pointIndex]

                // If point didn't move, no need to update connections
                if (Math.abs(oldPos.x - newPos.x) < 0.001 && Math.abs(oldPos.y - newPos.y) < 0.001) {
                    return currentWalls
                }
                
                // console.log(`updateWall: Moving point ${pointIndex} from`, oldPos, 'to', newPos)

                return currentWalls.map(w => {
                    if (w.id === id) return w // Skip self (already updated in initial map)
                    
                    // Relaxed epsilon for connection check (1cm)
                    const EPS = 0.02 

                    // Check start point of other wall
                    if (Math.abs(w.points[0].x - oldPos.x) < EPS && Math.abs(w.points[0].y - oldPos.y) < EPS) {
                        // console.log(`  -> dragging start of neighbor ${w.id}`)
                        return { ...w, points: [newPos, w.points[1]] }
                    }
                    // Check end point of other wall
                    if (Math.abs(w.points[1].x - oldPos.x) < EPS && Math.abs(w.points[1].y - oldPos.y) < EPS) {
                        // console.log(`  -> dragging end of neighbor ${w.id}`)
                        return { ...w, points: [w.points[0], newPos] }
                    }
                    if (w.storyId !== wallToUpdate.storyId) return w // NEW CHECK

                    // Check connections
                    if (Math.abs(w.points[0].x - oldPos.x) < EPS && Math.abs(w.points[0].y - oldPos.y) < EPS) {
                         return { ...w, points: [newPos, w.points[1]] }
                    }
                    if (Math.abs(w.points[1].x - oldPos.x) < EPS && Math.abs(w.points[1].y - oldPos.y) < EPS) {
                         return { ...w, points: [w.points[0], newPos] }
                    }
                    return w
                })
            }

            // Update for start point (0)
            updatedWalls = updateConnectedWalls(0, updatedWalls)
            
            // Update for end point (1)
            updatedWalls = updateConnectedWalls(1, updatedWalls)
        }

    // Correctly handle selection update
    const isSelected = state.selectedElement?.type === 'wall' && (state.selectedElement?.data as Wall)?.id === id
    const updatedElementData = isSelected ? updatedWalls.find(w => w.id === id) : undefined
    
    const updatedSelection = isSelected && updatedElementData
      ? { type: 'wall' as const, data: updatedElementData }
      : state.selectedElement
    
    return { 
      walls: updatedWalls,
      selectedElement: updatedSelection
    }
  })
  
  // Trigger detection
  get().detectRooms()
  },


  breakWall: (id, breakPoint) => {
    set((state) => {
    const wallToBreak = state.walls.find(w => w.id === id)
    if (!wallToBreak) return {}
    
    const p1 = wallToBreak.points[0]
    const p2 = wallToBreak.points[1]

    // 1. Modify EXISTING wall to end at breakPoint (keeps ID, properties, and start connection)
    const updatedWallToBreak = {
        ...wallToBreak,
        points: [p1, breakPoint],
        length: Math.sqrt(Math.pow(breakPoint.x - p1.x, 2) + Math.pow(breakPoint.y - p1.y, 2))
    }

    // 2. Create ONE new wall from breakPoint to end (shares exact breakPoint object reference if possible, but minimal coord diff)
    const newWall: Wall = {
        ...wallToBreak,
        id: generateId(),
        points: [breakPoint, p2], // Share the exact breakPoint object
        length: Math.sqrt(Math.pow(p2.x - breakPoint.x, 2) + Math.pow(p2.y - breakPoint.y, 2)),
        storyId: wallToBreak.storyId, // Inherit storyId
        // Inherit detailed properties
        templateId: wallToBreak.templateId,
        templateOverrideId: wallToBreak.templateOverrideId,
        roofBehavior: wallToBreak.roofBehavior,
        roofPitch: wallToBreak.roofPitch,
        
        // Inherit visual properties if set on instance (legacy support)
        thickness: wallToBreak.thickness,
        wallType: wallToBreak.wallType,
        height: wallToBreak.height,
    }

    return {
        walls: state.walls.map(w => w.id === id ? updatedWallToBreak : w).concat(newWall),
        selectedElement: null
    }
  })
  get().detectRooms()
  },


  resizeWall: (id, newLength, side) => {
      set((state) => {
      const wall = state.walls.find(w => w.id === id)
      if (!wall) return {}

      const p1 = wall.points[0]
      const p2 = wall.points[1]
      const currentLen = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
      
      if (currentLen < 0.001) return {}

      const dir = { x: (p2.x - p1.x) / currentLen, y: (p2.y - p1.y) / currentLen }
      
      let newPoints = [...wall.points]

      // Calculate new positions based on side
      if (side === 'start') {
           const newP1 = {
               x: p2.x - dir.x * newLength,
               y: p2.y - dir.y * newLength
           }
           newPoints = [newP1, p2]
      } else if (side === 'end') {
          const newP2 = {
              x: p1.x + dir.x * newLength,
              y: p1.y + dir.y * newLength
          }
          newPoints = [p1, newP2]
      } else {
         const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
         const halfLen = newLength / 2
         const newP1 = { x: mid.x - dir.x * halfLen, y: mid.y - dir.y * halfLen }
         const newP2 = { x: mid.x + dir.x * halfLen, y: mid.y + dir.y * halfLen }
         newPoints = [newP1, newP2]
      }
      
      // Update Neighbors Logic
      let updatedWalls = state.walls.map(w => w.id === id ? { ...w, points: newPoints, length: newLength } : w)
      const oldPoints = wall.points

      const updateNeighbors = (pIndex: 0|1) => {
           const oldPos = oldPoints[pIndex]
           const newPos = newPoints[pIndex]
           // Use relaxed EPS to catch "basically connected" walls
           const EPS = 0.02

           if (Math.abs(oldPos.x - newPos.x) < 0.001 && Math.abs(oldPos.y - newPos.y) < 0.001) return
           
           updatedWalls = updatedWalls.map(w => {
               if (w.id === id) return w
               
               // Check connections
               if (Math.abs(w.points[0].x - oldPos.x) < EPS && Math.abs(w.points[0].y - oldPos.y) < EPS) {
                    return { ...w, points: [newPos, w.points[1]] }
               }
               if (Math.abs(w.points[1].x - oldPos.x) < EPS && Math.abs(w.points[1].y - oldPos.y) < EPS) {
                    return { ...w, points: [w.points[0], newPos] }
               }
               return w
           })
      }

      updateNeighbors(0)
      updateNeighbors(1)
      
      return {
          walls: updatedWalls,
          activeDimension: null // Close editor
      }
  })
  get().detectRooms()
  },


  moveWall: (id, delta) => set((state) => {
      const wall = state.walls.find(w => w.id === id)
      if (!wall) return {}
      
      const newPoints = [
          { x: wall.points[0].x + delta.x, y: wall.points[0].y + delta.y },
          { x: wall.points[1].x + delta.x, y: wall.points[1].y + delta.y }
      ]
      
      // updateWall handles the "Drag Neighbor" logic
      get().updateWall(id, { points: newPoints })
      
      return {} // updateWall triggers the state update
  }),

  setActiveDimension: (dim) => set({ activeDimension: dim }),
})
