import { TemporalState } from 'zundo'
import { ViewSlice, WallSlice, RoomSlice, ConnectionSlice, RoofSlice, MEPSlice, BOQSlice, ProjectSlice, StorySlice, StaircaseSlice } from './slices/interfaces'

export type CanvasStore = ViewSlice & WallSlice & RoomSlice & ConnectionSlice & RoofSlice & MEPSlice & BOQSlice & ProjectSlice & StorySlice & StaircaseSlice & {
  temporal: TemporalState<Pick<CanvasStore, 'walls' | 'rooms' | 'openings' | 'roofPanels' | 'electricalPoints' | 'plumbingPoints' | 'mepConfig' | 'boqConfig' | 'stories'>>
}
