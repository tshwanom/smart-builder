export interface ViewSettings {
  scale: number
  offsetX: number
  offsetY: number
  width: number
  height: number
  padding: number
}

export interface Point2D {
  x: number
  y: number
}

export const CoordinateSystem = {
  screenToWorld: (screenPoint: Point2D, view: ViewSettings): Point2D => {
    // screenX = worldX * scale + offsetX
    // worldX = (screenX - offsetX) / scale
    return {
      x: (screenPoint.x - view.offsetX) / view.scale,
      y: (screenPoint.y - view.offsetY) / view.scale
    }
  },

  worldToScreen: (worldPoint: Point2D, view: ViewSettings): Point2D => {
    return {
      x: worldPoint.x * view.scale + view.offsetX,
      y: worldPoint.y * view.scale + view.offsetY
    }
  }
}
