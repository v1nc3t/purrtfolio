import { useState, type PointerEvent, type ReactNode } from 'react'
import { pointerToWorld } from './camera'
import { panGesture } from './panGesture'
import { useCanvasStore, type WindowId } from './useCanvasStore'
import { getWindowPhysics } from './windowPhysics'

type WindowProps = {
  id: WindowId
  children: ReactNode
}

const FLOAT_DELAY: Record<WindowId, string> = {
  terminal: '0s',
  about: '-1.2s',
  projects: '-2.4s',
  photos: '-3.6s',
}

const DRAG_THRESHOLD = 5

function PaperBanner({
  title,
  focused,
  closable,
  onClose,
  onPointerDown,
}: {
  title: string
  focused: boolean
  closable: boolean
  onClose: () => void
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
}) {
  return (
    <header
      className={`window-header window-header-paper flex shrink-0 cursor-grab touch-none select-none items-center py-1 font-mono leading-none active:cursor-grabbing ${
        focused ? 'text-[#f3dcb4]' : 'text-[#a37c4f] opacity-75'
      }`}
      onPointerDown={onPointerDown}
    >
      {closable ? (
        <span className="invisible shrink-0 pr-1 pl-3" aria-hidden>
          [x]
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate px-2 text-center">{title}</span>
      {closable ? (
        <button
          type="button"
          aria-label={`Close ${title}`}
          className="shrink-0 cursor-pointer pr-3 pl-1 leading-none [&:hover]:text-red-500"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
        >
          [x]
        </button>
      ) : null}
    </header>
  )
}

function isCloseControl(target: EventTarget | null) {
  return (
    target instanceof HTMLElement && Boolean(target.closest('button, a'))
  )
}

function workspaceOf(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null
  const main = target.closest('main')
  return main instanceof HTMLElement ? main : null
}

export function Window({ id, children }: WindowProps) {
  const frame = useCanvasStore((state) => state.windows[id])
  const focused = useCanvasStore((state) => state.focusedId === id)
  const overview = useCanvasStore((state) => state.isOverviewMode)
  const [dragging, setDragging] = useState(false)

  if (!frame) return null

  function startMove(
    event: PointerEvent<HTMLElement>,
    options: { focusOnClick: boolean },
  ) {
    const store = useCanvasStore.getState()
    const current = store.windows[id]
    const workspace = workspaceOf(event.currentTarget)
    if (!current || !workspace) return
    const canvas: HTMLElement = workspace

    event.preventDefault()
    event.stopPropagation()

    store.focus(id)
    if (!store.isOverviewMode) store.unlockCamera()

    const startX = event.clientX
    const startY = event.clientY
    const origin = pointerToWorld(
      store.camera,
      canvas,
      event.clientX,
      event.clientY,
    )
    const offsetX = origin.x - current.x
    const offsetY = origin.y - current.y
    const physics = getWindowPhysics()
    physics.pin(
      id,
      current.x + current.width / 2,
      current.y + current.height / 2,
    )
    setDragging(true)

    let moved = false

    function onMove(ev: globalThis.PointerEvent) {
      if (!moved) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) {
          return
        }
        moved = true
      }

      const nextStore = useCanvasStore.getState()
      const live = nextStore.windows[id]
      if (!live) return
      const world = pointerToWorld(
        nextStore.camera,
        canvas,
        ev.clientX,
        ev.clientY,
      )
      const x = world.x - offsetX
      const y = world.y - offsetY
      nextStore.setWindowPosition(id, x, y)
      physics.pin(id, x + live.width / 2, y + live.height / 2)
    }

    function onUp() {
      physics.unpin(id)
      setDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)

      const nextStore = useCanvasStore.getState()
      if (!moved && options.focusOnClick && nextStore.isOverviewMode) {
        nextStore.exitOverview(id)
        return
      }
      if (moved && nextStore.isOverviewMode) nextStore.fitOverview()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return
    if (isCloseControl(event.target)) return
    if (panGesture.spaceDown || event.altKey) return

    const store = useCanvasStore.getState()
    if (store.isOverviewMode) {
      startMove(event, { focusOnClick: true })
      return
    }
    store.focusOnWindow(id)
  }

  function handleHeaderDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return
    if (isCloseControl(event.target)) return
    if (panGesture.spaceDown || event.altKey) return

    const store = useCanvasStore.getState()
    startMove(event, { focusOnClick: store.isOverviewMode })
  }

  const closable = id !== 'terminal'
  const paper = id === 'projects'

  return (
    <section
      aria-label={frame.title}
      aria-selected={focused}
      data-focused={focused ? 'true' : 'false'}
      data-overview={overview ? 'true' : 'false'}
      data-dragging={dragging ? 'true' : 'false'}
      onPointerDown={handlePointerDown}
      style={{
        width: frame.width,
        height: frame.height,
        zIndex: frame.zIndex,
        transform: `translate3d(${frame.x}px, ${frame.y}px, 0)`,
      }}
      className={`window-frame absolute top-0 left-0 ${
        overview ? 'cursor-grab' : ''
      } ${dragging ? 'cursor-grabbing' : ''}`}
    >
      <div
        className={`window-shell animate-window-float flex h-full flex-col motion-reduce:animate-none ${
          paper ? 'window-shell-paper' : 'bg-terminal-bg'
        }`}
        style={{
          animationDelay: FLOAT_DELAY[id],
          animationPlayState: dragging ? 'paused' : 'running',
        }}
      >
        {paper ? (
          <PaperBanner
            title={frame.title}
            focused={focused}
            closable={closable}
            onClose={() => useCanvasStore.getState().close(id)}
            onPointerDown={handleHeaderDown}
          />
        ) : (
          <header
            className={`window-header flex shrink-0 cursor-grab touch-none select-none items-center py-1.5 text-sm active:cursor-grabbing ${
              focused
                ? 'bg-terminal-accent/10 text-terminal-accent'
                : 'text-terminal-muted opacity-75'
            }`}
            onPointerDown={handleHeaderDown}
          >
            <span className="min-w-0 flex-1 truncate px-3">{frame.title}</span>
            {closable ? (
              <button
                type="button"
                aria-label={`Close ${frame.title}`}
                className="cursor-pointer py-0.5 pr-3 pl-2 text-lg leading-none text-terminal-muted [&:hover]:text-red-500"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => useCanvasStore.getState().close(id)}
              >
                ×
              </button>
            ) : null}
          </header>
        )}
        <div
          className={`min-h-0 flex-1 ${focused ? '' : 'opacity-75'} ${
            overview ? 'pointer-events-none' : ''
          }`}
        >
          {children}
        </div>
      </div>
    </section>
  )
}
