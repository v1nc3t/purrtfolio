import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useCanvasStore, type WindowId } from './useCanvasStore'
import { getWindowPhysics, stopWindowPhysics } from './windowPhysics'

export function useWindowPhysics() {
  const order = useCanvasStore(useShallow((state) => state.order))
  const minimized = useCanvasStore(useShallow((state) => state.minimized))
  const overview = useCanvasStore((state) => state.isOverviewMode)
  const focusedId = useCanvasStore((state) => state.focusedId)
  const viewportW = useCanvasStore((state) => state.viewport.width)
  const viewportH = useCanvasStore((state) => state.viewport.height)

  useEffect(() => {
    const physics = getWindowPhysics()
    physics.start((positions) => {
      useCanvasStore.getState().applySimPositions(positions)
    })

    return () => {
      stopWindowPhysics()
    }
  }, [])

  useEffect(() => {
    const { windows, minimized: hidden } = useCanvasStore.getState()
    const visible: typeof windows = {}
    for (const id of Object.keys(windows) as WindowId[]) {
      if (!hidden.includes(id)) visible[id] = windows[id]
    }
    getWindowPhysics().sync(visible)
  }, [order, minimized, viewportW, viewportH])

  useEffect(() => {
    getWindowPhysics().setAmbient(overview, focusedId)
  }, [overview, focusedId])
}
