import { create } from 'zustand'

type SettingsState = {
  calm: boolean
  trail: boolean
  trailOverWindows: boolean
  trailLength: number
  trailDelay: number
  cookies: 'unknown' | 'yes' | 'no'
  setCalm: (value: boolean) => void
  setTrail: (value: boolean) => void
  setTrailOverWindows: (value: boolean) => void
  setTrailLength: (value: number) => void
  setTrailDelay: (value: number) => void
  acceptCookies: () => void
  rejectCookies: () => void
}

const CONSENT = 'purrtfolio.consent'
const SETTINGS = 'purrtfolio.settings'
const REJECTED = 'purrtfolio.cookies'
const YEAR = 60 * 60 * 24 * 365

type Saved = Partial<Pick<SettingsState, 'calm' | 'trail' | 'trailOverWindows' | 'trailLength' | 'trailDelay'>>

function readCookie(name: string) {
  if (typeof document === 'undefined') return null
  const prefix = `${name}=`
  const hit = document.cookie.split('; ').find((part) => part.startsWith(prefix))
  return hit ? decodeURIComponent(hit.slice(prefix.length)) : null
}

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

function clearCookie(name: string) {
  writeCookie(name, '', 0)
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === 'number' ? value : fallback
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function readSaved(cookies: SettingsState['cookies']): Saved {
  if (cookies !== 'yes') return {}
  try {
    const raw = readCookie(SETTINGS)
    if (!raw) return {}
    return JSON.parse(raw) as Saved
  } catch {
    return {}
  }
}

function readCookies(): SettingsState['cookies'] {
  if (readCookie(CONSENT) === 'yes') return 'yes'
  try {
    if (sessionStorage.getItem(REJECTED) === 'no') return 'no'
  } catch {
    // sessionStorage can throw in locked-down contexts
  }
  return 'unknown'
}

const cookies = readCookies()
const saved = readSaved(cookies)

function snapshot(state: SettingsState): Saved {
  return {
    calm: state.calm,
    trail: state.trail,
    trailOverWindows: state.trailOverWindows,
    trailLength: state.trailLength,
    trailDelay: state.trailDelay,
  }
}

export const useSettings = create<SettingsState>((set) => ({
  calm: Boolean(saved.calm),
  trail: saved.trail !== false,
  trailOverWindows: Boolean(saved.trailOverWindows),
  trailLength: clamp(saved.trailLength, 16, 120, 72),
  trailDelay: clamp(saved.trailDelay, 1, 10, 3),
  cookies,
  setCalm: (calm) => set({ calm }),
  setTrail: (trail) => set({ trail }),
  setTrailOverWindows: (trailOverWindows) => set({ trailOverWindows }),
  setTrailLength: (trailLength) => set({ trailLength }),
  setTrailDelay: (trailDelay) => set({ trailDelay }),
  acceptCookies: () => {
    writeCookie(CONSENT, 'yes', YEAR)
    try {
      sessionStorage.removeItem(REJECTED)
    } catch {
      // sessionStorage can throw in locked-down contexts
    }
    set({ cookies: 'yes' })
  },
  rejectCookies: () => {
    clearCookie(CONSENT)
    clearCookie(SETTINGS)
    try {
      sessionStorage.setItem(REJECTED, 'no')
      sessionStorage.removeItem(SETTINGS)
    } catch {
      // sessionStorage can throw in locked-down contexts
    }
    set({ cookies: 'no' })
  },
}))

useSettings.subscribe((state) => {
  if (state.cookies !== 'yes') return
  try {
    writeCookie(SETTINGS, JSON.stringify(snapshot(state)), YEAR)
  } catch {
    // document.cookie can throw in locked-down contexts
  }
})
