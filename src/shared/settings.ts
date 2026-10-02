import { create } from 'zustand'

type SettingsState = {
  calm: boolean
  trail: boolean
  trailOverWindows: boolean
  trailLength: number
  trailDelay: number
  setCalm: (value: boolean) => void
  setTrail: (value: boolean) => void
  setTrailOverWindows: (value: boolean) => void
  setTrailLength: (value: number) => void
  setTrailDelay: (value: number) => void
}

const KEY = 'purrtfolio.settings'

function readSaved() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<SettingsState>
  } catch {
    return {}
  }
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === 'number' ? value : fallback
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

const saved = readSaved()

export const useSettings = create<SettingsState>((set) => ({
  calm: Boolean(saved.calm),
  trail: saved.trail !== false,
  trailOverWindows: Boolean(saved.trailOverWindows),
  trailLength: clamp(saved.trailLength, 16, 120, 72),
  trailDelay: clamp(saved.trailDelay, 1, 10, 3),
  setCalm: (calm) => set({ calm }),
  setTrail: (trail) => set({ trail }),
  setTrailOverWindows: (trailOverWindows) => set({ trailOverWindows }),
  setTrailLength: (trailLength) => set({ trailLength }),
  setTrailDelay: (trailDelay) => set({ trailDelay }),
}))

useSettings.subscribe((state) => {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        calm: state.calm,
        trail: state.trail,
        trailOverWindows: state.trailOverWindows,
        trailLength: state.trailLength,
        trailDelay: state.trailDelay,
      }),
    )
  } catch {
    // sessionStorage can throw in locked-down contexts
  }
})
