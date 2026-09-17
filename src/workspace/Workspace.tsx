import { memo, useEffect, useRef, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ProjectsPage } from '../projects/ProjectsPage'
import { Terminal } from '../terminal/Terminal'
import { useCanvasCamera } from './useCanvasCamera'
import { useCanvasStore, type WindowId } from './useCanvasStore'
import { useWindowPhysics } from './useWindowPhysics'
import { useWindowShortcuts } from './useWindowShortcuts'
import { Window } from './Window'

type WorkspaceProps = {
  username: string
}

const WindowBody = memo(function WindowBody({
  id,
  username,
}: {
  id: WindowId
  username: string
}) {
  switch (id) {
    case 'terminal':
      return <Terminal username={username} />
    case 'projects':
      return <ProjectsPage />
    default:
      return <div className="h-full" />
  }
})

function CanvasWorld({ children }: { children: ReactNode }) {
  const camera = useCanvasStore((state) => state.camera)
  const animating = useCanvasStore((state) => state.cameraAnimating)

  return (
    <div
      className={`absolute top-0 left-0 origin-top-left ${
        animating ? 'canvas-world-animate' : ''
      }`}
      style={{
        transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`,
      }}
    >
      {children}
    </div>
  )
}

export function Workspace({ username }: WorkspaceProps) {
  const containerRef = useRef<HTMLElement>(null)
  useWindowShortcuts()
  useCanvasCamera(containerRef)
  useWindowPhysics()

  const openIds = useCanvasStore(useShallow((state) => state.order))
  const overview = useCanvasStore((state) => state.isOverviewMode)

  useEffect(() => {
    function syncViewport() {
      useCanvasStore.getState().setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  return (
    <main
      ref={containerRef}
      data-username={username}
      data-overview={overview ? 'true' : 'false'}
      className="relative min-h-svh cursor-default overflow-hidden bg-workspace data-[panning=true]:cursor-grabbing data-[space=true]:cursor-grab"
      aria-label={overview ? 'Window overview' : 'Workspace'}
    >
      <span className="sr-only">Signed in as {username}</span>
      <CanvasWorld>
        {openIds.map((id) => (
          <Window key={id} id={id}>
            <WindowBody id={id} username={username} />
          </Window>
        ))}
      </CanvasWorld>
    </main>
  )
}
