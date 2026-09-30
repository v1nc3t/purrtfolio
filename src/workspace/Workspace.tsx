import { memo, useEffect, useRef, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ProjectsPage } from '../projects/ProjectsPage'
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
    default:
      return <div className="h-full" />
  }
})

function CanvasGrid() {
  const windows = useCanvasStore((state) => state.windows)
  const order = useCanvasStore((state) => state.order)
  const viewport = useCanvasStore((state) => state.viewport)
  const scale = useCanvasStore((state) => state.camera.scale)
  const world = worldRect(windowSizeFor(viewport))
  const stroke = 0.9 / scale
  const spots = order.flatMap((id) => {
    const frame = windows[id]
    if (!frame) return []
    return [
      {
        id,
        cx: frame.x - world.x + frame.width / 2,
        cy: frame.y - world.y + frame.height / 2,
        radius:
          Math.hypot(frame.width, frame.height) / 2 +
          Math.min(frame.width, frame.height) * 0.28,
      },
    ]
  })

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
          <path d="M48 0 H0 V48" fill="none" stroke="white" strokeWidth={stroke} />
        </pattern>
        {spots.map(({ id, cx, cy, radius }) => (
          <radialGradient
            key={id}
            id={`canvas-flash-${id}`}
            gradientUnits="userSpaceOnUse"
            cx={cx}
            cy={cy}
            r={radius}
          >
            <stop offset="0%" stopColor="white" />
            <stop offset="68%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
        ))}
      </defs>
      <rect width="100%" height="100%" fill="url(#canvas-grid)" opacity="0.12" />
      {spots.map(({ id, cx, cy, radius }) => (
        <mask key={id} id={`canvas-flash-mask-${id}`} maskUnits="userSpaceOnUse">
          <circle cx={cx} cy={cy} r={radius} fill={`url(#canvas-flash-${id})`} />
        </mask>
      ))}
      {spots.map(({ id }) => (
        <rect
          key={id}
          width="100%"
          height="100%"
          fill="url(#canvas-grid)"
            opacity="0.25"
          mask={`url(#canvas-flash-mask-${id})`}
        />
      ))}
    </svg>
  )
}

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
      aria-label={overview ? 'window overview' : 'workspace'}
    >
      <span className="sr-only">signed in as {username}</span>
      <CanvasWorld>
        <CanvasGrid />
        {openIds.map((id) => (
          <Window key={id} id={id}>
            <WindowBody id={id} username={username} />
          </Window>
        ))}
      </CanvasWorld>
    </main>
  )
}
