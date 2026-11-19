import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { AboutPage } from '../about/AboutPage'
import { ProjectsPage } from '../projects/ProjectsPage'
import { useSettings } from '../shared/settings'
import { Terminal } from '../terminal/Terminal'
import { useCanvasCamera } from './useCanvasCamera'
import { useCanvasStore, type WindowId } from './useCanvasStore'
import { windowSizeFor, worldRect } from './world'
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
    case 'about':
      return <AboutPage />
    default:
      return <div className="h-full" />
  }
})

const Backdrop = memo(function Backdrop() {
  const viewport = useCanvasStore((state) => state.viewport)
  const windows = useCanvasStore((state) => state.windows)
  const order = useCanvasStore((state) => state.order)
  const minimized = useCanvasStore((state) => state.minimized)
  const flashlight = useSettings((state) => state.flashlight)
  // tile doubles as the camera zooms out, so grid lines stay about 1 screen px wide
  const tile = useCanvasStore((state) => 48 * 2 ** Math.max(0, Math.floor(Math.log2(1 / state.camera.scale))))
  const world = worldRect(windowSizeFor(viewport))
  const layer: CSSProperties = {
    left: world.x,
    top: world.y,
    width: world.width,
    height: world.height,
    backgroundImage: 'url(/canvas-bg.svg)',
    backgroundSize: `${tile}px ${tile}px`,
    backgroundPosition: `${-world.x}px ${-world.y}px`,
  }
  // one radial gradient per visible window, masks add up
  const spots = order.flatMap((id) => {
    const frame = windows[id]
    if (!frame || minimized.includes(id)) return []
    const radius =
      Math.hypot(frame.width, frame.height) / 2 +
      Math.min(frame.width, frame.height) * 0.1
    const x = frame.x + frame.width / 2 - world.x
    const y = frame.y + frame.height / 2 - world.y
    return [`radial-gradient(circle ${radius}px at ${x}px ${y}px, #000 68%, transparent 100%)`]
  })
  const mask = spots.join(', ')

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute opacity-40" style={layer} />
      {flashlight && spots.length > 0 ? (
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{ ...layer, maskImage: mask, WebkitMaskImage: mask }}
        />
      ) : null}
    </>
  )
})

const clockText = () =>
  new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

function Clock() {
  const [time, setTime] = useState(clockText)

  useEffect(() => {
    const id = window.setInterval(() => setTime(clockText()), 1_000)
    return () => window.clearInterval(id)
  }, [])

  return <span className="taskbar-tray">{time}</span>
}

function Taskbar() {
  const order = useCanvasStore(useShallow((state) => state.order))
  const minimized = useCanvasStore(useShallow((state) => state.minimized))
  const focusedId = useCanvasStore((state) => state.focusedId)

  return (
    <div className="taskbar" role="tablist" aria-label="taskbar">
      {order.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={focusedId === id}
          data-minimized={minimized.includes(id) ? 'true' : 'false'}
          onClick={() => useCanvasStore.getState().focusOnWindow(id)}
        >
          {id}
        </button>
      ))}
      <Clock />
    </div>
  )
}

function CanvasWorld({ children }: { children: ReactNode }) {
  const camera = useCanvasStore((state) => state.camera)

  return (
    <div
      className="absolute top-0 left-0 origin-top-left"
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
  const minimized = useCanvasStore(useShallow((state) => state.minimized))
  const overview = useCanvasStore((state) => state.isOverviewMode)
  const calm = useSettings((state) => state.calm)

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
      className="relative min-h-svh cursor-default overflow-clip bg-workspace data-[panning=true]:cursor-grabbing data-[space=true]:cursor-grab"
      aria-label={overview ? 'window overview' : 'workspace'}
    >
      <span className="sr-only">signed in as {username}</span>
      <Taskbar />
      <CanvasWorld>
        {calm ? null : <Backdrop />}
        {openIds.filter((id) => !minimized.includes(id)).map((id) => (
          <Window key={id} id={id}>
            <WindowBody id={id} username={username} />
          </Window>
        ))}
      </CanvasWorld>
    </main>
  )
}
