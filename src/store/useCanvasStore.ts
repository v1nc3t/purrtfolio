import { create } from 'zustand'
import {
  cameraFittingRects,
  cameraFocusingWindow,
  clampCamera,
  minScaleForViewport,
  panCamera as shiftCamera,
  zoomCamera as scaleCamera,
  type Camera,
  type Viewport,
} from '../lib/camera'
import { clampFrame } from '../lib/world'
import {
  DEFAULT_WINDOW_SIZE,
  pickWindowInDirection,
  placeAroundHub,
  type Direction,
} from '../lib/layout'

export const WINDOW_IDS = ['terminal', 'about', 'projects', 'photos'] as const

export type WindowId = (typeof WINDOW_IDS)[number]

export type WindowFrame = {
  id: WindowId
  title: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

type CanvasStore = {
  windows: Partial<Record<WindowId, WindowFrame>>
  order: WindowId[]
  focusedId: WindowId | null
  isOverviewMode: boolean
  camera: Camera
  cameraAnimating: boolean
  cameraLocked: boolean
  cameraBeforeOverview: Camera | null
  viewport: Viewport
  open: (id: WindowId) => void
  close: (id: WindowId) => void
  focus: (id: WindowId) => void
  focusOnWindow: (id: WindowId) => void
  focusDirection: (direction: Direction) => void
  panCamera: (deltaX: number, deltaY: number) => void
  zoomCamera: (zoomDelta: number, focusPointX: number, focusPointY: number) => void
  unlockCamera: () => void
  enterOverview: () => void
  toggleOverview: () => void
  exitOverview: (id?: WindowId) => void
  setViewport: (viewport: Viewport) => void
  setWindowPosition: (id: WindowId, x: number, y: number) => void
  applySimPositions: (positions: Partial<Record<WindowId, { x: number; y: number }>>) => void
  fitOverview: () => void
}

const TITLES: Record<WindowId, string> = {
  terminal: 'terminal',
  about: 'about',
  projects: 'projects',
  photos: 'photos',
}

function readViewport(): Viewport {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 800 }
  }
  return { width: window.innerWidth, height: window.innerHeight }
}

function framesOf(
  windows: Partial<Record<WindowId, WindowFrame>>,
): WindowFrame[] {
  return Object.values(windows).filter(
    (frame): frame is WindowFrame => Boolean(frame),
  )
}

function windowSize(id: WindowId) {
  return id === 'projects'
    ? { width: 720, height: 560 }
    : DEFAULT_WINDOW_SIZE
}

function placeWindow(
  id: WindowId,
  windows: Partial<Record<WindowId, WindowFrame>>,
  zIndex: number,
): WindowFrame {
  const size = windowSize(id)
  const existing = framesOf(windows)
  const hub = windows.terminal
  const satellites = existing.filter((frame) => frame.id !== 'terminal')
  const origin = hub
    ? placeAroundHub(hub, satellites, size)
    : {
        x: -size.width / 2,
        y: -size.height / 2,
      }

  return clampFrame({
    id,
    title: TITLES[id],
    x: origin.x,
    y: origin.y,
    width: size.width,
    height: size.height,
    zIndex,
  })
}

function nextZ(windows: Partial<Record<WindowId, WindowFrame>>) {
  return framesOf(windows).reduce((max, frame) => Math.max(max, frame.zIndex), 0) + 1
}

function boundCamera(camera: Camera, viewport: Viewport) {
  return clampCamera(camera, viewport)
}

function camerasDiffer(a: Camera, b: Camera) {
  return (
    Math.abs(a.x - b.x) > 0.05 ||
    Math.abs(a.y - b.y) > 0.05 ||
    Math.abs(a.scale - b.scale) > 0.0005
  )
}

function lockedFocusCamera(
  windows: Partial<Record<WindowId, WindowFrame>>,
  focusedId: WindowId | null,
  viewport: Viewport,
  camera: Camera,
) {
  if (!focusedId) return camera
  const frame = windows[focusedId]
  if (!frame) return camera
  const next = boundCamera(cameraFocusingWindow(frame, viewport), viewport)
  return camerasDiffer(next, camera) ? next : camera
}

let animateTimer = 0

function startCameraAnimation() {
  if (typeof window === 'undefined') return
  window.clearTimeout(animateTimer)
  animateTimer = window.setTimeout(() => {
    useCanvasStore.setState({ cameraAnimating: false })
  }, 420)
}

function createInitialState() {
  const viewport = readViewport()
  const terminal: WindowFrame = {
    id: 'terminal',
    title: TITLES.terminal,
    x: -DEFAULT_WINDOW_SIZE.width / 2,
    y: -DEFAULT_WINDOW_SIZE.height / 2,
    width: DEFAULT_WINDOW_SIZE.width,
    height: DEFAULT_WINDOW_SIZE.height,
    zIndex: 1,
  }

  return {
    viewport,
    order: ['terminal'] as WindowId[],
    focusedId: 'terminal' as WindowId,
    isOverviewMode: false,
    camera: boundCamera(cameraFocusingWindow(terminal, viewport), viewport),
    cameraAnimating: false,
    cameraLocked: true,
    cameraBeforeOverview: null as Camera | null,
    windows: { terminal } as Partial<Record<WindowId, WindowFrame>>,
  }
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  ...createInitialState(),

  open: (id) => {
    const { windows, order } = get()
    if (windows[id]) {
      get().focusOnWindow(id)
      return
    }

    const frame = placeWindow(id, windows, nextZ(windows))
    set({
      order: [...order, id],
      windows: { ...windows, [id]: frame },
    })
    get().focusOnWindow(id)
  },

  close: (id) => {
    if (id === 'terminal') return

    const { windows, order, focusedId, viewport, isOverviewMode } = get()
    if (!windows[id]) return

    const nextOrder = order.filter((item) => item !== id)
    const nextWindows = { ...windows }
    delete nextWindows[id]

    let nextFocus = focusedId
    if (focusedId === id) {
      const index = order.indexOf(id)
      nextFocus = nextOrder[Math.max(0, index - 1)] ?? nextOrder[0] ?? null
    }

    const nextOverview = isOverviewMode && nextOrder.length > 1
    set({
      order: nextOrder,
      windows: nextWindows,
      focusedId: nextFocus,
      isOverviewMode: nextOverview,
    })

    if (nextOverview) {
      set({
        camera: boundCamera(cameraFittingRects(framesOf(nextWindows), viewport), viewport),
        cameraAnimating: true,
      })
      startCameraAnimation()
      return
    }

    if (nextFocus && (focusedId === id || isOverviewMode)) {
      get().focusOnWindow(nextFocus)
    }
  },

  focus: (id) => {
    const { windows, focusedId } = get()
    const frame = windows[id]
    if (!frame) return
    if (focusedId === id) return

    set({
      focusedId: id,
      cameraLocked: false,
      windows: {
        ...windows,
        [id]: { ...frame, zIndex: nextZ(windows) },
      },
    })
  },

  focusOnWindow: (id) => {
    const { windows, viewport, focusedId } = get()
    const frame = windows[id]
    if (!frame) return

    const zIndex = focusedId === id ? frame.zIndex : nextZ(windows)
    set({
      focusedId: id,
      isOverviewMode: false,
      cameraLocked: true,
      cameraBeforeOverview: null,
      camera: boundCamera(cameraFocusingWindow(frame, viewport), viewport),
      cameraAnimating: true,
      windows: {
        ...windows,
        [id]: { ...frame, zIndex },
      },
    })
    startCameraAnimation()
  },

  focusDirection: (direction) => {
    const { windows, focusedId } = get()
    if (!focusedId) return
    const nextId = pickWindowInDirection(framesOf(windows), focusedId, direction)
    if (nextId) get().focusOnWindow(nextId as WindowId)
  },

  panCamera: (deltaX, deltaY) => {
    const { camera, viewport } = get()
    set({
      camera: boundCamera(shiftCamera(camera, deltaX, deltaY), viewport),
      cameraAnimating: false,
      cameraLocked: false,
    })
  },

  zoomCamera: (zoomDelta, focusPointX, focusPointY) => {
    const { camera, viewport } = get()
    set({
      camera: boundCamera(
        scaleCamera(
          camera,
          zoomDelta,
          focusPointX,
          focusPointY,
          minScaleForViewport(viewport),
        ),
        viewport,
      ),
      cameraAnimating: false,
      cameraLocked: false,
    })
  },

  enterOverview: () => {
    const { isOverviewMode, windows, viewport, camera } = get()
    if (isOverviewMode) return
    set({
      isOverviewMode: true,
      cameraLocked: false,
      cameraBeforeOverview: camera,
      camera: boundCamera(cameraFittingRects(framesOf(windows), viewport), viewport),
      cameraAnimating: true,
    })
    startCameraAnimation()
  },

  toggleOverview: () => {
    if (get().isOverviewMode) {
      get().exitOverview()
      return
    }
    get().enterOverview()
  },

  exitOverview: (id) => {
    if (id) {
      get().focusOnWindow(id)
      return
    }

    const { isOverviewMode, cameraBeforeOverview, viewport } = get()
    if (!isOverviewMode) return

    set({
      isOverviewMode: false,
      cameraLocked: false,
      camera: boundCamera(cameraBeforeOverview ?? get().camera, viewport),
      cameraBeforeOverview: null,
      cameraAnimating: true,
    })
    startCameraAnimation()
  },

  unlockCamera: () => {
    set({ cameraLocked: false, cameraAnimating: false })
  },

  fitOverview: () => {
    const { isOverviewMode, windows, viewport } = get()
    if (!isOverviewMode) return
    set({
      camera: boundCamera(cameraFittingRects(framesOf(windows), viewport), viewport),
      cameraAnimating: true,
    })
    startCameraAnimation()
  },

  setViewport: (viewport) => {
    set({
      viewport,
      camera: boundCamera(get().camera, viewport),
    })
  },

  setWindowPosition: (id, x, y) => {
    const frame = get().windows[id]
    if (!frame) return
    const next = clampFrame({ ...frame, x, y })
    set({
      windows: {
        ...get().windows,
        [id]: next,
      },
    })
  },

  applySimPositions: (positions) => {
    set((state) => {
      let changed = false
      const windows = { ...state.windows }
      for (const id of state.order) {
        const pos = positions[id]
        const frame = windows[id]
        if (!pos || !frame) continue
        if (frame.x === pos.x && frame.y === pos.y) continue
        windows[id] = clampFrame({ ...frame, x: pos.x, y: pos.y })
        changed = true
      }

      const camera = boundCamera(
        state.cameraLocked && !state.isOverviewMode
          ? lockedFocusCamera(
              changed ? windows : state.windows,
              state.focusedId,
              state.viewport,
              state.camera,
            )
          : state.camera,
        state.viewport,
      )
      const cameraChanged = camera !== state.camera
      if (!changed && !cameraChanged) return state
      return changed ? { windows, camera } : { camera }
    })
  },
}))
