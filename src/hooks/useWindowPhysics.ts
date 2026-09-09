import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getWindowPhysics, stopWindowPhysics } from '../lib/windowPhysics'
import { useCanvasStore } from '../store/useCanvasStore'

export function useWindowPhysics() {
  const order = useCanvasStore(useShallow((state) => state.order))
  const overview = useCanvasStore((state) => state.isOverviewMode)
  const focusedId = useCanvasStore((state) => state.focusedId)

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
  }, [order])

  useEffect(() => {
    getWindowPhysics().setAmbient(overview, focusedId)
  }, [overview, focusedId])
}
