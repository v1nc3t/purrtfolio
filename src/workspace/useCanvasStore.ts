import { create } from 'zustand'
import {
  cameraFittingWorld,
  cameraFocusingWindow,
  clampCamera,
  minScaleForViewport,
  panCamera as shiftCamera,
  zoomCamera as scaleCamera,
  type Camera,
  type Viewport,
} from './camera'
import {
  pickWindowInDirection,
  placeAroundHub,
  type Direction,
} from './layout'
import { clampFrame, windowSizeFor } from './world'

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
  projects: 'purr times - project archive',
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

function placeWindow(
  id: WindowId,
  windows: Partial<Record<WindowId, WindowFrame>>,
  zIndex: number,
  viewport: Viewport,
): WindowFrame {
  const size = windowSizeFor(viewport)
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

const FOCUS_MS = 180
const OVERVIEW_MS = 200
let glideRaf = 0

function cancelGlide() {
  if (typeof cancelAnimationFrame === 'undefined') return
  cancelAnimationFrame(glideRaf)
  glideRaf = 0
}

function glideCamera(to: Camera, ms: number) {
  cancelGlide()
  const from = useCanvasStore.getState().camera
  const reduce =
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || !camerasDiffer(from, to) || typeof requestAnimationFrame === 'undefined') {
    useCanvasStore.setState({ camera: to })
    return
  }
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms)
    const e = 1 - (1 - t) ** 3
    useCanvasStore.setState({
      camera: {
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
        scale: from.scale + (to.scale - from.scale) * e,
      },
    })
    glideRaf = t < 1 ? requestAnimationFrame(step) : 0
  }
  glideRaf = requestAnimationFrame(step)
}

function createInitialState() {
  const viewport = readViewport()
  const size = windowSizeFor(viewport)
  const terminal: WindowFrame = {
    id: 'terminal',
    title: TITLES.terminal,
    x: -size.width / 2,
    y: -size.height / 2,
    width: size.width,
    height: size.height,
    zIndex: 1,
  }

  return {
    viewport,
    order: ['terminal'] as WindowId[],
    focusedId: 'terminal' as WindowId,
    isOverviewMode: false,
    camera: boundCamera(cameraFocusingWindow(terminal, viewport), viewport),
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

    const frame = placeWindow(id, windows, nextZ(windows), get().viewport)
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
      glideCamera(boundCamera(cameraFittingWorld(viewport), viewport), OVERVIEW_MS)
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
    const camera = boundCamera(cameraFocusingWindow(frame, viewport), viewport)
    set({
      focusedId: id,
      isOverviewMode: false,
      cameraLocked: true,
      cameraBeforeOverview: null,
      windows: {
        ...windows,
        [id]: { ...frame, zIndex },
      },
    })
    glideCamera(camera, FOCUS_MS)
  },

  focusDirection: (direction) => {
    const { windows, focusedId } = get()
    if (!focusedId) return
    const nextId = pickWindowInDirection(framesOf(windows), focusedId, direction)
    if (nextId) get().focusOnWindow(nextId as WindowId)
  },

  panCamera: (deltaX, deltaY) => {
    cancelGlide()
    const { camera, viewport } = get()
    set({
      camera: boundCamera(shiftCamera(camera, deltaX, deltaY), viewport),
      cameraLocked: false,
    })
  },

  zoomCamera: (zoomDelta, focusPointX, focusPointY) => {
    cancelGlide()
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
      cameraLocked: false,
    })
  },

  enterOverview: () => {
    const { isOverviewMode, viewport, camera } = get()
    if (isOverviewMode) return
    set({
      isOverviewMode: true,
      cameraLocked: false,
      cameraBeforeOverview: camera,
    })
    glideCamera(boundCamera(cameraFittingWorld(viewport), viewport), OVERVIEW_MS)
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

    const camera = boundCamera(cameraBeforeOverview ?? get().camera, viewport)
    set({
      isOverviewMode: false,
      cameraLocked: false,
      cameraBeforeOverview: null,
    })
    glideCamera(camera, OVERVIEW_MS)
  },

  unlockCamera: () => {
    cancelGlide()
    set({ cameraLocked: false })
  },

  fitOverview: () => {
    const { isOverviewMode, viewport } = get()
    if (!isOverviewMode) return
    glideCamera(boundCamera(cameraFittingWorld(viewport), viewport), OVERVIEW_MS)
  },

  setViewport: (viewport) => {
    cancelGlide()
    const { windows, focusedId, isOverviewMode, camera, cameraLocked } = get()
    const size = windowSizeFor(viewport)
    const nextWindows: Partial<Record<WindowId, WindowFrame>> = {}
    for (const id of Object.keys(windows) as WindowId[]) {
      const frame = windows[id]
      if (!frame) continue
      const cx = frame.x + frame.width / 2
      const cy = frame.y + frame.height / 2
      nextWindows[id] = clampFrame({
        ...frame,
        width: size.width,
        height: size.height,
        x: cx - size.width / 2,
        y: cy - size.height / 2,
      })
    }

    const nextCamera = isOverviewMode
      ? boundCamera(cameraFittingWorld(viewport), viewport)
      : cameraLocked && focusedId && nextWindows[focusedId]
        ? boundCamera(cameraFocusingWindow(nextWindows[focusedId], viewport), viewport)
        : boundCamera(camera, viewport)

    set({ viewport, windows: nextWindows, camera: nextCamera })
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
        // ponytail: drop sub-pixel drift, the overview orbit is too slow to see it
        if (Math.abs(frame.x - pos.x) < 1 && Math.abs(frame.y - pos.y) < 1) continue
        windows[id] = clampFrame({ ...frame, x: pos.x, y: pos.y })
        changed = true
      }

      if (glideRaf) return changed ? { windows } : state

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
