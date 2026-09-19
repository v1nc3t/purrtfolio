import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useCanvasStore } from './useCanvasStore'
import { getWindowPhysics, stopWindowPhysics } from './windowPhysics'

export function useWindowPhysics() {
  const order = useCanvasStore(useShallow((state) => state.order))
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
    getWindowPhysics().sync(useCanvasStore.getState().windows)
  }, [order, viewportW, viewportH])

  useEffect(() => {
    getWindowPhysics().setAmbient(overview, focusedId)
  }, [overview, focusedId])
}
