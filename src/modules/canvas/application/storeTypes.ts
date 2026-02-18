import { TemporalState } from 'zundo'
import { ViewSlice, WallSlice, RoomSlice, ConnectionSlice, RoofSlice, MEPSlice, BOQSlice, ProjectSlice, StorySlice, StaircaseSlice, StructureSlice, FinishSlice } from './slices/interfaces'

export type CanvasStore = ViewSlice & WallSlice & RoomSlice & ConnectionSlice & RoofSlice & MEPSlice & BOQSlice & ProjectSlice & StorySlice & StaircaseSlice & StructureSlice & FinishSlice & {
  temporal: TemporalState<Pick<CanvasStore, 'walls' | 'rooms' | 'openings' | 'roofPanels' | 'electricalPoints' | 'plumbingPoints' | 'mepConfig' | 'boqConfig' | 'stories' | 'structureElements'>>
}
