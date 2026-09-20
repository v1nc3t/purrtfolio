import { useEffect, type RefObject } from 'react'
import { isTypingHotkeyTarget } from '../shared/hotkeys'
import { screenPoint } from './camera'
import { panGesture } from './panGesture'
import { useCanvasStore } from './useCanvasStore'

const ZOOM_INTENSITY = 0.0016
const DRAG_THRESHOLD = 5

export function useCanvasCamera(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const canvas: HTMLElement = element

    let dragging = false
    let lastX = 0
    let lastY = 0
    let startX = 0
    let startY = 0
    let pointerId = 0
    let moved = false
    let clickToOverview = false

    function isOnWindow(target: EventTarget | null) {
      return target instanceof Element && Boolean(target.closest('.window-frame'))
    }

    function isPanModifier(event: PointerEvent) {
      return event.button === 1 || panGesture.spaceDown || event.altKey
    }

    function onPointerDown(event: PointerEvent) {
      if (event.button === 2) return
      const onWindow = isOnWindow(event.target)
      const panModifier = isPanModifier(event)
      if (onWindow && !panModifier) return
      if (!panModifier && event.button !== 0) return

      dragging = true
      moved = false
      clickToOverview = !onWindow && !panModifier && event.button === 0
      pointerId = event.pointerId
      lastX = event.clientX
      lastY = event.clientY
      startX = event.clientX
      startY = event.clientY
      canvas.setPointerCapture(event.pointerId)
      if (!clickToOverview) canvas.dataset.panning = 'true'
      event.preventDefault()
      event.stopPropagation()
    }

    function onPointerMove(event: PointerEvent) {
      if (!dragging || event.pointerId !== pointerId) return

      if (clickToOverview && !moved) {
        if (Math.hypot(event.clientX - startX, event.clientY - startY) < DRAG_THRESHOLD) {
          return
        }
        moved = true
        canvas.dataset.panning = 'true'
      }

      useCanvasStore
        .getState()
        .panCamera(event.clientX - lastX, event.clientY - lastY)
      lastX = event.clientX
      lastY = event.clientY
    }

    function onPointerUp(event: PointerEvent) {
      if (event.pointerId !== pointerId) return
      const enterOverview = clickToOverview && !moved
      dragging = false
      clickToOverview = false
      canvas.dataset.panning = 'false'
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
      if (enterOverview) useCanvasStore.getState().enterOverview()
    }

    function onWheel(event: WheelEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        event.preventDefault()
        const point = screenPoint(canvas, event.clientX, event.clientY)
        useCanvasStore
          .getState()
          .zoomCamera(-event.deltaY * ZOOM_INTENSITY, point.x, point.y)
        return
      }

      if (event.target === canvas || panGesture.spaceDown) {
        event.preventDefault()
        useCanvasStore.getState().panCamera(-event.deltaX, -event.deltaY)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space' || event.repeat) return
      if (isTypingHotkeyTarget(event.target)) return
      panGesture.spaceDown = true
      canvas.dataset.space = 'true'
      event.preventDefault()
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code !== 'Space') return
      panGesture.spaceDown = false
      canvas.dataset.space = 'false'
    }

    function onBlur() {
      panGesture.spaceDown = false
      canvas.dataset.space = 'false'
      dragging = false
      clickToOverview = false
      canvas.dataset.panning = 'false'
    }

    canvas.addEventListener('pointerdown', onPointerDown, true)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      panGesture.spaceDown = false
      canvas.removeEventListener('pointerdown', onPointerDown, true)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [containerRef])
}
