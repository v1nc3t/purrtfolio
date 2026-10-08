import { memo, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
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

const GridLines = memo(function GridLines() {
  const viewport = useCanvasStore((state) => state.viewport)
  const world = worldRect(windowSizeFor(viewport))

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute"
      style={{ left: world.x, top: world.y, width: world.width, height: world.height }}
    >
      <defs>
        <pattern
          id="canvas-grid"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
          x={-world.x}
          y={-world.y}
        >
          <path className="canvas-grid-line" d="M48 0 H0 V48" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#canvas-grid)" opacity="0.12" />
    </svg>
  )
})

const GridSpots = memo(function GridSpots() {
  const windows = useCanvasStore((state) => state.windows)
  const order = useCanvasStore((state) => state.order)
  const minimized = useCanvasStore((state) => state.minimized)

  return order.map((id) => {
    if (minimized.includes(id)) return null
    const frame = windows[id]
    if (!frame) return null
    const radius =
      Math.hypot(frame.width, frame.height) / 2 +
      Math.min(frame.width, frame.height) * 0.1
    const size = radius * 2
    const left = frame.x + frame.width / 2 - radius
    const top = frame.y + frame.height / 2 - radius
    return (
      <svg
        key={id}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left, top, width: size, height: size }}
      >
        <defs>
          <pattern
            id={`canvas-spot-${id}`}
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
            x={-left}
            y={-top}
          >
            <path className="canvas-grid-line" d="M48 0 H0 V48" />
          </pattern>
          <radialGradient
            id={`canvas-flash-${id}`}
            gradientUnits="userSpaceOnUse"
            cx={radius}
            cy={radius}
            r={radius}
          >
            <stop offset="0%" stopColor="white" />
            <stop offset="68%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <mask id={`canvas-flash-mask-${id}`} maskUnits="userSpaceOnUse">
            <circle cx={radius} cy={radius} r={radius} fill={`url(#canvas-flash-${id})`} />
          </mask>
        </defs>
        <rect
          width={size}
          height={size}
          fill={`url(#canvas-spot-${id})`}
          opacity="0.25"
          mask={`url(#canvas-flash-mask-${id})`}
        />
      </svg>
    )
  })
})

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
    </div>
  )
}

function CanvasWorld({ children }: { children: ReactNode }) {
  const camera = useCanvasStore((state) => state.camera)

  return (
    <div
      className="absolute top-0 left-0 origin-top-left"
      style={
        {
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`,
          '--cam-scale': camera.scale,
        } as CSSProperties
      }
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
        {calm ? null : (
          <>
            <GridLines />
            <GridSpots />
          </>
        )}
        {openIds.filter((id) => !minimized.includes(id)).map((id) => (
          <Window key={id} id={id}>
            <WindowBody id={id} username={username} />
          </Window>
        ))}
      </CanvasWorld>
    </main>
  )
}
