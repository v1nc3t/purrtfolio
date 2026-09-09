export type HotkeyAction =
  | 'close'
  | 'overview'
  | 'focusLeft'
  | 'focusRight'
  | 'focusUp'
  | 'focusDown'
  | 'overviewExit'
  | 'overviewSelect'

export type KeyBind = {
  alt?: boolean
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  key?: string
  code?: string
}

export type HotkeyMap = Record<HotkeyAction, readonly KeyBind[]>

export const WINDOW_HOTKEYS: HotkeyMap = {
  close: [{ alt: true, code: 'KeyQ' }],
  overview: [{ alt: true, code: 'KeyO' }],
  focusLeft: [
    { alt: true, key: 'ArrowLeft' },
    { alt: true, code: 'KeyH' },
  ],
  focusRight: [
    { alt: true, key: 'ArrowRight' },
    { alt: true, code: 'KeyL' },
  ],
  focusUp: [
    { alt: true, key: 'ArrowUp' },
    { alt: true, code: 'KeyK' },
  ],
  focusDown: [
    { alt: true, key: 'ArrowDown' },
    { alt: true, code: 'KeyJ' },
  ],
  overviewExit: [{ key: 'Escape' }],
  overviewSelect: [{ key: 'Enter' }],
}

export const SHORTCUT_HELP = [
  'close      Alt+Q',
  'overview   Alt+O',
  'focus      Alt+Arrows',
  'pan        drag / Alt+drag',
  'zoom       Alt+wheel',
] as const

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export function matchesBind(event: KeyboardEvent, bind: KeyBind) {
  if (!!bind.alt !== event.altKey) return false
  if (!!bind.meta !== event.metaKey) return false
  if (!!bind.ctrl !== event.ctrlKey) return false
  if (!!bind.shift !== event.shiftKey) return false
  if (bind.code && event.code !== bind.code) return false
  if (bind.key && event.key !== bind.key) return false
  return Boolean(bind.code || bind.key)
}

export function matchHotkey(
  event: KeyboardEvent,
  hotkeys: HotkeyMap,
): HotkeyAction | null {
  for (const [action, binds] of Object.entries(hotkeys) as [
    HotkeyAction,
    readonly KeyBind[],
  ][]) {
    if (binds.some((bind) => matchesBind(event, bind))) return action
  }
  return null
}

export function shouldHandleHotkey(
  event: KeyboardEvent,
  action: HotkeyAction,
  isOverviewMode: boolean,
) {
  if (
    event.repeat &&
    action !== 'focusLeft' &&
    action !== 'focusRight' &&
    action !== 'focusUp' &&
    action !== 'focusDown'
  ) {
    return false
  }

  if (action === 'overviewExit' || action === 'overviewSelect') {
    return isOverviewMode
  }

  const usesModifier = event.altKey || event.metaKey || event.ctrlKey
  if (!usesModifier && isTypingTarget(event.target) && !isOverviewMode) {
    return false
  }

  return true
}

export function isTypingHotkeyTarget(target: EventTarget | null) {
  return isTypingTarget(target)
}
