import { create } from 'zustand'
import { ProjectGeometry, Point3D, WallSegment, Opening3D, RoofPlane3D, BOQConfig } from '../../domain/types'
import { MEPConfig } from '../../modules/canvas/application/types'

interface GeometryState {
  project: ProjectGeometry
  selectedIds: string[]
  addWall: (wall: WallSegment) => void
  addOpening: (opening: Opening3D) => void
  updateWall: (id: string, updates: Partial<WallSegment>) => void
  setProject: (project: ProjectGeometry) => void
  setRoofs: (roofs: RoofPlane3D[]) => void
  updateFoundation: (wallId: string, foundation: Partial<import('../../domain/types').FoundationConfig> | undefined) => void
  updateWallStructure: (wallId: string, structure: import('../../domain/types').WallStructure) => void
  select: (id: string, multi?: boolean) => void
  deselect: (id: string) => void
  clearSelection: () => void
  updateBoqConfig: (config: Partial<BOQConfig>) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateMepConfig: (config: Partial<MEPConfig> | any) => void
  deleteWall: (id: string) => void
  updateOpening: (id: string, updates: Partial<Opening3D>) => void
  deleteOpening: (id: string) => void
}

export const useGeometryStore = create<GeometryState>((set) => ({
  project: {
    layers: [],
    stories: [],
    walls: [],
    roofs: [],
    openings: [],
    structureElements: [], // Initialize structureElements
    boqConfig: {
        roofType: 'gable',
        roofPitch: 30,
        finishes: {
            floor: 'screed',
            walls: 'plaster',
            ceiling: 'paint'
        }
    },
    mepConfig: {
        hasCompletedWizard: false,
        electrical: {
            routingMode: 'ceiling',
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
    meta: {
        name: 'Untitled Project',
        currency: 'USD',
        currencySymbol: '$'
    }
  },
  selectedIds: [],
  
  addWall: (wall) => set((state) => ({
    project: {
      ...state.project,
      walls: [...state.project.walls, wall]
    }
  })),

  addOpening: (opening) => set((state) => ({
    project: {
      ...state.project,
      openings: [...state.project.openings, opening]
    }
  })),

  updateWall: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      walls: state.project.walls.map(w => w.id === id ? { ...w, ...updates } : w)
    }
  })),

  setProject: (project) => set({ project }),

  setRoofs: (roofs) => set((state) => ({
    project: {
       ...state.project,
       roofs
    }
  })),

  updateFoundation: (wallId, foundation) => set((state) => ({
    project: {
        ...state.project,
        walls: state.project.walls.map(w => {
            if (w.id !== wallId) return w
            
            // If foundation is undefined, remove it
            if (foundation === undefined) {
                const { foundation: _, ...rest } = w
                return rest
            }

            // Merge existing foundation with updates
            return {
                ...w,
                foundation: {
                    ...(w.foundation || {
                        // Defaults if creating new
                        type: 'strip',
                        width: 600,
                        depth: 230,
                        offset: 0,
                        concreteGrade: '25MPa',
                        reinforcement: {
                            mainBars: 'Y12',
                            mainBarCount: 4,
                            stirrups: 'R8',
                            stirrupSpacing: 300
                        }
                    }),
                    ...foundation
                }
            }
        })
    }
  })),

  updateWallStructure: (wallId, structure) => set((state) => {
    // 1. Calculate new thickness based on structure
    // We need to import WallCalculator dynamically or just duplicate logic to avoid circular deps if any
    // For now, let's assume we can just import it.
    // Actually, we can just do a dynamic import in the component calling this, OR
    // we just update the structure here and let the component calculate thickness?
    // Better: The store should be the source of truth.
    
    return {
        project: {
            ...state.project,
            walls: state.project.walls.map(w => {
                if (w.id !== wallId) return w
                return {
                    ...w,
                    structure,
                    // We don't auto-update thickness here yet to avoid import cycle with WallCalculator
                    // The UI should trigger a thickness update separately or we move WallCalculator to a method that doesn't depend on store
                }
            })
        }
    }
  }),

  select: (id, multi = false) => set((state) => ({
    selectedIds: multi ? [...state.selectedIds, id] : [id]
  })),

  deselect: (id) => set((state) => ({
    selectedIds: state.selectedIds.filter(sid => sid !== id)
  })),

  updateBoqConfig: (config: Partial<BOQConfig>) => set((state) => ({
      project: {
          ...state.project,
          boqConfig: { ...state.project.boqConfig, ...config }
      }
  })),

  updateMepConfig: (config: Partial<MEPConfig>) => set((state) => {
      const currentMep = state.project.mepConfig || { 
          hasCompletedWizard: false, 
          electrical: { routingMode: 'ceiling', ceilingHeight: 2700, voltage: 230, conduitType: 'pvc', wireType: 'house_wire' },
          plumbing: { supplyType: 'municipal', pipeType: 'copper' }
      }

      return {
          project: {
              ...state.project,
              mepConfig: {
                  ...currentMep,
                  ...config,
                  electrical: { ...currentMep.electrical, ...(config.electrical || {}) },
                  plumbing: { ...currentMep.plumbing, ...(config.plumbing || {}) },
                  hvac: config.hvac ? { ...(currentMep.hvac || {}), ...config.hvac } : currentMep.hvac
              }
          }
      }
  }),

  deleteWall: (id) => set((state) => ({
    project: {
      ...state.project,
      walls: state.project.walls.filter(w => w.id !== id),
      // Also remove openings attached to this wall
      openings: state.project.openings.filter(o => o.wallId !== id)
    },
    selectedIds: state.selectedIds.filter(sid => sid !== id)
  })),

  updateOpening: (id, updates) => set((state) => ({
    project: {
       ...state.project,
       openings: state.project.openings.map(o => o.id === id ? { ...o, ...updates } : o)
    }
  })),

  deleteOpening: (id) => set((state) => ({
    project: {
      ...state.project,
      openings: state.project.openings.filter(o => o.id !== id)
    },
    selectedIds: state.selectedIds.filter(sid => sid !== id)
  })),

  clearSelection: () => set({ selectedIds: [] })
}))
