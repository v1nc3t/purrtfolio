import { WINDOW_INSET, windowSizeFor, worldRect } from './world'

export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type Viewport = {
  width: number
  height: number
}

export type Camera = {
  x: number
  y: number
  scale: number
}

export const MIN_SCALE = 0.15
export const MAX_SCALE = 2
export const FOCUS_MAX_SCALE = 1.6
export const OVERVIEW_PADDING = 120
export const DEFAULT_CAMERA: Camera = { x: 0, y: 0, scale: 1 }

function worldForViewport(viewport: Viewport) {
  return worldRect(windowSizeFor(viewport))
}

function focusPad(viewport: Viewport) {
  return Math.min(viewport.width, viewport.height) * WINDOW_INSET
}

export function clampScale(scale: number, minScale = MIN_SCALE) {
  return Math.min(MAX_SCALE, Math.max(minScale, scale))
}

export function minScaleForViewport(viewport: Viewport) {
  const world = worldForViewport(viewport)
  return Math.min(
    viewport.width / Math.max(world.width, 1),
    viewport.height / Math.max(world.height, 1),
  )
}

export function clampCamera(camera: Camera, viewport: Viewport): Camera {
  const world = worldForViewport(viewport)
  const scale = clampScale(camera.scale, minScaleForViewport(viewport))
  const worldW = world.width * scale
  const worldH = world.height * scale
  const cx = world.x + world.width / 2
  const cy = world.y + world.height / 2

  let x = camera.x
  let y = camera.y

  if (worldW <= viewport.width) {
    x = viewport.width / 2 - cx * scale
  } else {
    const minX = viewport.width - (world.x + world.width) * scale
    const maxX = -world.x * scale
    x = Math.min(maxX, Math.max(minX, x))
  }

  if (worldH <= viewport.height) {
    y = viewport.height / 2 - cy * scale
  } else {
    const minY = viewport.height - (world.y + world.height) * scale
    const maxY = -world.y * scale
    y = Math.min(maxY, Math.max(minY, y))
  }

  return { scale, x, y }
}

export function panCamera(camera: Camera, deltaX: number, deltaY: number): Camera {
  return {
    ...camera,
    x: camera.x + deltaX,
    y: camera.y + deltaY,
  }
}

export function zoomCamera(
  camera: Camera,
  zoomDelta: number,
  focusPointX: number,
  focusPointY: number,
  minScale = MIN_SCALE,
): Camera {
  const scale = clampScale(camera.scale * Math.exp(zoomDelta), minScale)
  if (scale === camera.scale) return camera

  const worldX = (focusPointX - camera.x) / camera.scale
  const worldY = (focusPointY - camera.y) / camera.scale

  return {
    scale,
    x: focusPointX - worldX * scale,
    y: focusPointY - worldY * scale,
  }
}

export function cameraForRect(
  rect: Rect,
  viewport: Viewport,
  padding: number,
  maxScale = MAX_SCALE,
): Camera {
  const availW = Math.max(1, viewport.width - padding * 2)
  const availH = Math.max(1, viewport.height - padding * 2)
  const scale = clampScale(
    Math.min(availW / Math.max(rect.width, 1), availH / Math.max(rect.height, 1), maxScale),
    MIN_SCALE,
  )
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2

  return {
    scale,
    x: viewport.width / 2 - cx * scale,
    y: viewport.height / 2 - cy * scale,
  }
}

export function cameraFocusingWindow(rect: Rect, viewport: Viewport): Camera {
  return cameraForRect(rect, viewport, focusPad(viewport), FOCUS_MAX_SCALE)
}

export function cameraFittingRects(rects: Rect[], viewport: Viewport): Camera {
  if (rects.length === 0) return { ...DEFAULT_CAMERA }
  return cameraForRect(boundingBox(rects), viewport, OVERVIEW_PADDING)
}

export function boundingBox(rects: Rect[]): Rect {
  const left = Math.min(...rects.map((rect) => rect.x))
  const top = Math.min(...rects.map((rect) => rect.y))
  const right = Math.max(...rects.map((rect) => rect.x + rect.width))
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height))
  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  }
}

export function screenPoint(
  element: HTMLElement,
  clientX: number,
  clientY: number,
) {
  const bounds = element.getBoundingClientRect()
  return {
    x: clientX - bounds.left,
    y: clientY - bounds.top,
  }
}

export function screenToWorld(camera: Camera, screenX: number, screenY: number) {
  return {
    x: (screenX - camera.x) / camera.scale,
    y: (screenY - camera.y) / camera.scale,
  }
}

export function pointerToWorld(
  camera: Camera,
  container: HTMLElement,
  clientX: number,
  clientY: number,
) {
  const point = screenPoint(container, clientX, clientY)
  return screenToWorld(camera, point.x, point.y)
}
