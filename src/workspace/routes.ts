import { useCanvasStore, type WindowId } from './useCanvasStore'

export type AboutTab = 'about me' | 'history' | 'structure' | 'links' | 'settings'

const TAB_SLUG: Record<AboutTab, string> = {
  'about me': 'me',
  history: 'history',
  structure: 'structure',
  links: 'links',
  settings: 'settings',
}

const SLUG_TAB: Record<string, AboutTab> = {
  me: 'about me',
  history: 'history',
  structure: 'structure',
  links: 'links',
  settings: 'settings',
}

type AppRoute = {
  fullscreen: boolean
  window: WindowId
  about: AboutTab
}

let aboutTab: AboutTab = 'about me'
let applying = false
const aboutListeners = new Set<() => void>()

export function getAboutTab() {
  return aboutTab
}

export function subscribeAboutTab(listener: () => void) {
  aboutListeners.add(listener)
  return () => {
    aboutListeners.delete(listener)
  }
}

export function setAboutTab(tab: AboutTab) {
  if (aboutTab === tab) return
  aboutTab = tab
  aboutListeners.forEach((listener) => listener())
  syncRoute()
}

function takeFullscreen(parts: string[]) {
  if (parts.at(-1) === 'fullscreen') {
    parts.pop()
    return true
  }
  // older links put fullscreen first: /fullscreen/projects
  if (parts[0] === 'fullscreen') {
    parts.shift()
    return true
  }
  return false
}

const WINDOWS: readonly WindowId[] = ['terminal', 'about', 'projects', 'photos']

let missing = false
const missingListeners = new Set<() => void>()

export function getMissing() {
  return missing
}

export function subscribeMissing(listener: () => void) {
  missingListeners.add(listener)
  return () => {
    missingListeners.delete(listener)
  }
}

function setMissing(next: boolean) {
  if (missing === next) return
  missing = next
  missingListeners.forEach((listener) => listener())
}

export function matchRoute(pathname: string): AppRoute | null {
  const parts = pathname.split('/').filter(Boolean)
  const fullscreen = takeFullscreen(parts)
  if (parts.length === 0) return { fullscreen, window: 'terminal', about: 'about me' }

  const head = parts[0]
  if (!WINDOWS.includes(head as WindowId)) return null
  const window = head as WindowId

  if (window === 'about') {
    if (parts.length > 2) return null
    if (parts.length === 1) return { fullscreen, window, about: 'about me' }
    const about = SLUG_TAB[parts[1]]
    if (!about) return null
    return { fullscreen, window, about }
  }

  if (parts.length > 1) return null
  return { fullscreen, window, about: aboutTab }
}

export function formatRoute(route: AppRoute) {
  const parts: string[] = [route.window]
  if (route.window === 'about') parts.push(TAB_SLUG[route.about])
  if (route.fullscreen) parts.push('fullscreen')
  return `/${parts.join('/')}`
}

function currentRoute(): AppRoute {
  const { fullscreen, focusedId } = useCanvasStore.getState()
  return {
    fullscreen,
    window: focusedId ?? 'terminal',
    about: aboutTab,
  }
}

export function syncRoute() {
  if (applying) return
  const path = formatRoute(currentRoute())
  if (path === location.pathname) return
  history.pushState(null, '', path)
}

export function applyRoute(pathname = location.pathname) {
  const route = matchRoute(pathname)
  if (!route) {
    setMissing(true)
    return
  }
  setMissing(false)
  applying = true
  try {
    if (aboutTab !== route.about) {
      aboutTab = route.about
      aboutListeners.forEach((listener) => listener())
    }
    const store = useCanvasStore.getState()
    if (!store.windows[route.window]) store.open(route.window)
    else if (store.focusedId !== route.window) store.focusOnWindow(route.window)

    const live = useCanvasStore.getState()
    const showing = Boolean(live.fullscreen && live.maximized[route.window])
    if (route.fullscreen !== showing) live.maximize(route.window)
  } finally {
    applying = false
  }
  const canonical = formatRoute(currentRoute())
  if (canonical !== location.pathname) history.replaceState(null, '', canonical)
}

export function bindRoutes() {
  applyRoute()
  const onPop = () => applyRoute()
  window.addEventListener('popstate', onPop)
  const unsub = useCanvasStore.subscribe((state, prev) => {
    if (state.focusedId === prev?.focusedId && state.fullscreen === prev?.fullscreen) return
    syncRoute()
  })
  return () => {
    window.removeEventListener('popstate', onPop)
    unsub()
  }
}
