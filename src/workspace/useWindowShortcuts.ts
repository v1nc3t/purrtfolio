import { useEffect } from 'react'
import {
  matchHotkey,
  shouldHandleHotkey,
  WINDOW_HOTKEYS,
  type HotkeyAction,
  type HotkeyMap,
} from '../shared/hotkeys'
import { useCanvasStore } from './useCanvasStore'

const OVERVIEW_ARROWS: Record<string, HotkeyAction> = {
  ArrowLeft: 'focusLeft',
  ArrowRight: 'focusRight',
  ArrowUp: 'focusUp',
  ArrowDown: 'focusDown',
}

function dispatchHotkey(action: HotkeyAction) {
  const store = useCanvasStore.getState()

  switch (action) {
    case 'close':
      if (store.focusedId) store.close(store.focusedId)
      return
    case 'overview':
      store.toggleOverview()
      return
    case 'focusLeft':
      store.focusDirection('left')
      return
    case 'focusRight':
      store.focusDirection('right')
      return
    case 'focusUp':
      store.focusDirection('up')
      return
    case 'focusDown':
      store.focusDirection('down')
      return
    case 'overviewExit':
      store.exitOverview()
      return
    case 'overviewSelect':
      store.exitOverview(store.focusedId ?? undefined)
      return
  }
}

export function useWindowShortcuts(hotkeys: HotkeyMap = WINDOW_HOTKEYS) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isOverviewMode = useCanvasStore.getState().isOverviewMode
      let action = matchHotkey(event, hotkeys)

      if (!action && isOverviewMode && !event.altKey && !event.metaKey && !event.ctrlKey) {
        action = OVERVIEW_ARROWS[event.key]
      }

      if (!action || !shouldHandleHotkey(event, action, isOverviewMode)) return

      event.preventDefault()
      event.stopPropagation()
      dispatchHotkey(action)
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [hotkeys])
}
