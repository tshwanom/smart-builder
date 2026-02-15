import { Point, Wall, Room, Opening, RoofPanel, ElectricalPoint, PlumbingPoint, MEPConfig, BOQConfig, ProjectData, Story, Staircase } from '../types'

export interface StaircaseSlice {
  staircases: Staircase[]
  addStaircase: (staircase: Omit<Staircase, 'id'>) => void
  updateStaircase: (id: string, updates: Partial<Staircase>) => void
  removeStaircase: (id: string) => void
}

export interface ViewSlice {
  // Viewport state (zoom/pan)
  viewport: {
    scale: number
    offset: Point
  }
  
  // Grid & Snap settings
  gridSettings: {
    gridSize: number
    showGrid: boolean
    snapToGrid: boolean
    snapToPoints: boolean
  }
  
  // Drawing aids
  orthogonalLock: boolean
  showDimensions: boolean
  unitSystem: 'mm' | 'm'
  
  // Reference Layer (Ghost Story)
  referenceSettings: {
    showBelow: boolean
    showAbove: boolean
    opacity: number // 0 to 1
  }
  
  // UI State
  isDrawing: boolean
  currentTool: 'select' | 'wall' | 'break' | 'room' | 'window' | 'door' | 'socket' | 'switch' | 'light' | 'isolator' | 'db' | 'basin' | 'sink' | 'shower' | 'toilet' | 'bath' | 'washing_machine' | 'source' | 'staircase'
  mousePosition: Point | null
  // Selected Element needs to be here if we initialize it here or managed globally.
  // We'll treat it as shared state managed primarily by interactions logic but stored here.
  // Deprecated: Use selection array instead. Kept for backward compatibility (returns selection[0])
  selectedElement: { type: 'wall' | 'room' | 'roof' | 'opening' | 'staircase' | 'plumbingPoint' | 'electricalPoint', data: Wall | Room | RoofPanel | Opening | Staircase | PlumbingPoint | ElectricalPoint } | null
  
  // Multi-selection support
  selection: Array<{ type: 'wall' | 'room' | 'roof' | 'opening' | 'staircase' | 'plumbingPoint' | 'electricalPoint', data: Wall | Room | RoofPanel | Opening | Staircase | PlumbingPoint | ElectricalPoint }>

  // Library Modal State
  activeLibraryModal: 'door' | 'window' | null
  openLibrary: (type: 'door' | 'window') => void
  closeLibrary: () => void

  // Viewport actions
  setViewport: (viewport: { scale: number; offset: Point }) => void
  setMousePosition: (pos: Point | null) => void
  setZoom: (scale: number) => void
  zoomIn: () => void
  zoomOut: () => void
  zoomToFit: () => void
  resetView: () => void
  setPan: (offset: Point) => void
  panBy: (delta: Point) => void
  
  // Grid & Snap actions
  toggleGrid: () => void
  toggleSnap: () => void
  setGridSize: (size: number) => void
  snapPoint: (point: Point) => Point
  
  // Drawing aids actions
  setOrthogonalLock: (locked: boolean) => void
  toggleDimensions: () => void
  setUnitSystem: (unit: 'mm' | 'm') => void
  setReferenceSettings: (settings: Partial<ViewSlice['referenceSettings']>) => void
  setTool: (tool: ViewSlice['currentTool']) => void
  
  // Selection
  selectElement: (element: ViewSlice['selectedElement']) => void
  setSelection: (selection: ViewSlice['selection']) => void
  addToSelection: (element: ViewSlice['selection'][0]) => void
  removeFromSelection: (id: string) => void
  clearSelection: () => void
  
  // Bulk Actions
  deleteSelection: () => void
}

export interface WallSlice {
  walls: Wall[]
  currentWall: Point[]
  activeDimension: { 
    wallId: string, 
    currentLength: number, 
    screenPosition: Point, 
    rotation: number,
    type?: 'length' | 'gap',
    referenceWallId?: string,
    direction?: Point // Vector to move wall
  } | null
  
  activeTemplate: import('../types').WallTemplate | null
  setActiveTemplate: (template: import('../types').WallTemplate | null) => void

  startWall: (point: Point) => void
  addWallPoint: (point: Point) => void
  addWall: (wall: Partial<Omit<Wall, 'id' | 'completed'>>) => void
  completeWall: () => void
  cancelWall: () => void
  deleteWall: (id: string) => void
  
  selectWall: (id: string) => void
  updateWall: (id: string, updates: Partial<Wall>) => void
  
  breakWall: (id: string, breakPoint: Point) => void
  resizeWall: (id: string, newLength: number, side: 'start' | 'end' | 'center') => void
  moveWall: (id: string, delta: Point) => void
  
  setActiveDimension: (dim: WallSlice['activeDimension']) => void
}

export interface RoomSlice {
  rooms: Room[]
  detectRooms: () => void
  selectRoom: (id: string) => void
  updateRoom: (id: string, updates: Partial<Room>) => void
}

export interface ConnectionSlice {
  openings: Opening[]
  activeOpeningType: Partial<Opening> | null
  
  addOpening: (wallId: string, type: 'window' | 'door', position: number, properties?: Partial<Opening>) => void
  deleteOpening: (id: string) => void
  updateOpening: (id: string, updates: Partial<Opening>) => void
  setActiveOpeningType: (opening: Partial<Opening> | null) => void
}

export interface RoofSlice {
  roofPanels: RoofPanel[]
  
  // Global Roof Settings
  roofPitch: number
  roofOverhang: number // mm
  showRoof: boolean
  
  createRoofPanel: (roomId: string | null, storyId: string, type: 'pitched' | 'flat', footprint?: import('../types').Point[]) => void
  updateRoofPanel: (id: string, updates: Partial<RoofPanel>) => void
  deleteRoofPanel: (id: string) => void
  selectRoofPanel: (id: string) => void
  
  setRoofPitch: (pitch: number) => void
  setRoofOverhang: (overhang: number) => void
  toggleRoof: (show: boolean) => void
  
  showRoofSlopeArrows: boolean
  toggleRoofSlopeArrows: (show: boolean) => void
  
  roofArrowOffset: number // 0.0 to 1.0 (percentage up the slope)
  setRoofArrowOffset: (offset: number) => void

  editingRoofId: string | null
  setEditingRoofId: (id: string | null) => void
}

export interface MEPSlice {
  electricalPoints: ElectricalPoint[]
  plumbingPoints: PlumbingPoint[]
  mepConfig: MEPConfig
  
  addElectricalPoint: (point: Omit<ElectricalPoint, 'id'>) => void
  updateElectricalPoint: (id: string, updates: Partial<ElectricalPoint>) => void
  deleteElectricalPoint: (id: string) => void
  
  addPlumbingPoint: (point: Omit<PlumbingPoint, 'id'>) => void
  updatePlumbingPoint: (id: string, updates: Partial<PlumbingPoint>) => void
  deletePlumbingPoint: (id: string) => void

  updateMEPConfig: (config: Partial<MEPConfig> | Partial<MEPConfig['electrical']> | Partial<MEPConfig['plumbing']>) => void
  setMEPWizardCompleted: (completed: boolean) => void
}

export interface BOQSlice {
  boqConfig: BOQConfig
  updateBOQConfig: (config: Partial<BOQConfig>) => void
}

export interface ProjectSlice {
  loadProject: (data: Partial<ProjectData>) => void
}

export interface StorySlice {
  stories: Story[]
  activeStoryId: string | null
  
  addStory: (name?: string, height?: number) => void
  updateStory: (id: string, updates: Partial<Story>) => void
  deleteStory: (id: string) => void
  setActiveStory: (id: string) => void
}
