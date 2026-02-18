import { create } from 'zustand'
import { ProjectGeometry, Point3D, WallSegment } from '../../domain/types'

interface GeometryState {
  project: ProjectGeometry
  addWall: (wall: WallSegment) => void
  updateWall: (id: string, updates: Partial<WallSegment>) => void
  setProject: (project: ProjectGeometry) => void
}

export const useGeometryStore = create<GeometryState>((set) => ({
  project: {
    layers: [],
    walls: [],
    roofs: [],
    openings: []
  },
  
  addWall: (wall) => set((state) => ({
    project: {
      ...state.project,
      walls: [...state.project.walls, wall]
    }
  })),

  updateWall: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      walls: state.project.walls.map(w => w.id === id ? { ...w, ...updates } : w)
    }
  })),

  setProject: (project) => set({ project })
}))
