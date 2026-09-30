import { memo, useState, type PointerEvent, type ReactNode } from 'react'
import { pointerToWorld } from './camera'
import { panGesture } from './panGesture'
import { useCanvasStore, type WindowId } from './useCanvasStore'
import { getWindowPhysics } from './windowPhysics'

type WindowProps = {
  id: WindowId
  children: ReactNode
}

const DRAG_THRESHOLD = 5

function ControlIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden>
      <path d={d} />
    </svg>
  )
}

function WindowControls({
  title,
  canClose,
  onClose,
  className = '',
}: {
  title: string
  canClose: boolean
  onClose: () => void
  className?: string
}) {
  return (
    <div
      className={`window-controls ${className}`}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button type="button" disabled aria-label={`minimize ${title}`}>
        <ControlIcon d="M1 7.5h8" />
      </button>
      <button type="button" disabled aria-label={`maximize ${title}`}>
        <ControlIcon d="M1.6 1.6h6.8v6.8h-6.8z" />
      </button>
      <button
        type="button"
        className="window-control-close"
        disabled={!canClose}
        aria-label={`close ${title}`}
        onClick={onClose}
      >
        <ControlIcon d="M2 2l6 6M8 2L2 8" />
      </button>
    </div>
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

export const Window = memo(function Window({ id, children }: WindowProps) {
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
        className={`window-shell flex h-full flex-col ${
          paper ? 'window-shell-paper' : 'bg-terminal-bg'
        }`}
      >
        <header
          className={`window-header shrink-0 cursor-grab touch-none select-none active:cursor-grabbing ${
            paper
              ? 'window-header-paper grid grid-cols-[1fr_auto_1fr] items-center py-1 font-mono leading-none'
              : 'flex items-center py-1.5'
          }`}
          onPointerDown={handleHeaderDown}
        >
          <span
            className={`min-w-0 truncate ${
              paper ? 'col-start-2 px-2 text-center' : 'flex-1 px-4'
            }`}
          >
            {frame.title}
          </span>
          <WindowControls
            title={frame.title}
            canClose={closable}
            className={paper ? 'col-start-3' : ''}
            onClose={() => useCanvasStore.getState().close(id)}
          />
        </header>
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
})
