export interface Opening {
  id: string
  wallId: string
  type: 'window' | 'door'
  width: number // in meters
  height: number // in meters
  position: number // position along wall (0-1, percentage)
  sillHeight?: number // for windows, height from floor to bottom of window
}

export const OPENING_DEFAULTS = {
  window: {
    width: 1.2,
    height: 1.5,
    sillHeight: 0.9
  },
  door: {
    width: 0.9,
    height: 2.1,
    sillHeight: 0
  }
}
