import { create } from 'zustand'

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

type WindowsStore = {
  windows: Partial<Record<WindowId, WindowFrame>>
  focusedId: WindowId | null
  topZ: number
  open: (id: WindowId) => void
  close: (id: WindowId) => void
  focus: (id: WindowId) => void
  move: (id: WindowId, x: number, y: number) => void
  resize: (id: WindowId, width: number, height: number) => void
  clampAll: () => void
}

const TITLES: Record<WindowId, string> = {
  terminal: 'terminal',
  about: 'about',
  projects: 'projects',
  photos: 'photos',
}

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 448
const MIN_WIDTH = 280
const MIN_HEIGHT = 160
const MARGIN = 16
const CASCADE = 28

function viewportSize() {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 800 }
  }
  return { width: window.innerWidth, height: window.innerHeight }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clampFrame(frame: WindowFrame): WindowFrame {
  const vp = viewportSize()
  const maxWidth = Math.max(MIN_WIDTH, vp.width - MARGIN)
  const maxHeight = Math.max(MIN_HEIGHT, vp.height - MARGIN)
  const width = clamp(frame.width, MIN_WIDTH, maxWidth)
  const height = clamp(frame.height, MIN_HEIGHT, maxHeight)
  const maxX = Math.max(0, vp.width - width)
  const maxY = Math.max(0, vp.height - height)

  return {
    ...frame,
    width,
    height,
    x: clamp(frame.x, 0, maxX),
    y: clamp(frame.y, 0, maxY),
  }
}

function layoutWindow(id: WindowId, openCount: number, zIndex: number): WindowFrame {
  const vp = viewportSize()
  const width = Math.min(DEFAULT_WIDTH, Math.max(MIN_WIDTH, vp.width - MARGIN * 2))
  const height = Math.min(DEFAULT_HEIGHT, Math.max(MIN_HEIGHT, vp.height - MARGIN * 2))
  const offset = openCount * CASCADE
  const x = Math.max(MARGIN, (vp.width - width) / 2) + offset
  const y = Math.max(MARGIN, (vp.height - height) / 2) + offset

  return clampFrame({
    id,
    title: TITLES[id],
    x,
    y,
    width,
    height,
    zIndex,
  })
}

function patchWindow(
  windows: Partial<Record<WindowId, WindowFrame>>,
  id: WindowId,
  patch: Partial<WindowFrame>,
): Partial<Record<WindowId, WindowFrame>> {
  const current = windows[id]
  if (!current) return windows

  return {
    ...windows,
    [id]: clampFrame({ ...current, ...patch }),
  }
}

export const useWindowsStore = create<WindowsStore>((set, get) => ({
  windows: { terminal: layoutWindow('terminal', 0, 1) },
  focusedId: 'terminal',
  topZ: 1,

  open: (id) => {
    const { windows, focus } = get()
    if (windows[id]) {
      focus(id)
      return
    }

    const zIndex = get().topZ + 1
    set({
      windows: {
        ...windows,
        [id]: layoutWindow(id, Object.keys(windows).length, zIndex),
      },
      focusedId: id,
      topZ: zIndex,
    })
  },

  close: (id) => {
    if (id === 'terminal') return

    const { windows, focusedId } = get()
    if (!windows[id]) return

    const nextWindows = { ...windows }
    delete nextWindows[id]

    let nextFocus = focusedId
    if (focusedId === id) {
      const stacked = Object.values(nextWindows).sort((a, b) => b.zIndex - a.zIndex)
      nextFocus = stacked[0]?.id ?? null
    }

    set({ windows: nextWindows, focusedId: nextFocus })
  },

  focus: (id) => {
    const { windows, focusedId, topZ } = get()
    const frame = windows[id]
    if (!frame) return
    if (focusedId === id && frame.zIndex === topZ) return

    const zIndex = topZ + 1
    set({
      windows: { ...windows, [id]: { ...frame, zIndex } },
      focusedId: id,
      topZ: zIndex,
    })
  },

  move: (id, x, y) => {
    set((state) => ({ windows: patchWindow(state.windows, id, { x, y }) }))
  },

  resize: (id, width, height) => {
    set((state) => ({
      windows: patchWindow(state.windows, id, { width, height }),
    }))
  },

  clampAll: () => {
    const next: Partial<Record<WindowId, WindowFrame>> = {}
    for (const frame of Object.values(get().windows)) {
      next[frame.id] = clampFrame(frame)
    }
    set({ windows: next })
  },
}))
