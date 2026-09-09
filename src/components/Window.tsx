import { type PointerEvent, type ReactNode } from 'react'
import { useWindowsStore, type WindowId } from '../store/windows'

type WindowProps = {
  id: WindowId
  children: ReactNode
}

function isCloseControl(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button'))
}

export function Window({ id, children }: WindowProps) {
  const frame = useWindowsStore((state) => state.windows[id])
  const focused = useWindowsStore((state) => state.focusedId === id)

  if (!frame) return null

  function handleFocus() {
    useWindowsStore.getState().focus(id)
  }

  function handleHeaderDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return
    if (isCloseControl(event.target)) return

    const current = useWindowsStore.getState().windows[id]
    if (!current) return

    event.preventDefault()
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    useWindowsStore.getState().focus(id)

    function onMove(ev: PointerEvent | MouseEvent) {
      useWindowsStore.getState().move(id, ev.clientX - dx, ev.clientY - dy)
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('mouseup', onUp)
  }

  function handleResizeDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return

    const current = useWindowsStore.getState().windows[id]
    if (!current) return

    event.preventDefault()
    event.stopPropagation()
    const origin = {
      x: event.clientX,
      y: event.clientY,
      w: current.width,
      h: current.height,
    }
    useWindowsStore.getState().focus(id)

    function onMove(ev: PointerEvent | MouseEvent) {
      useWindowsStore
        .getState()
        .resize(
          id,
          origin.w + (ev.clientX - origin.x),
          origin.h + (ev.clientY - origin.y),
        )
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('mouseup', onUp)
  }

  const closable = id !== 'terminal'

  return (
    <section
      aria-label={frame.title}
      data-focused={focused ? 'true' : 'false'}
      onPointerDown={handleFocus}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        zIndex: frame.zIndex,
      }}
      className={`absolute flex flex-col bg-terminal-bg ${
        focused ? 'border-terminal-fg' : 'border-terminal-muted'
      } border`}
    >
      <header
        className="flex shrink-0 cursor-grab touch-none select-none items-center border-b border-inherit text-sm active:cursor-grabbing"
        onPointerDown={handleHeaderDown}
      >
        <span
          className={`min-w-0 flex-1 truncate px-3 py-1 ${
            focused ? 'text-terminal-fg' : 'text-terminal-muted'
          }`}
        >
          {frame.title}
        </span>
        {closable ? (
          <button
            type="button"
            aria-label={`Close ${frame.title}`}
            className="cursor-pointer px-2 py-0.5 text-lg leading-none text-terminal-muted [&:hover]:text-red-500"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => useWindowsStore.getState().close(id)}
          >
            ×
          </button>
        ) : null}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      <button
        type="button"
        aria-label={`Resize ${frame.title}`}
        className="absolute right-0 bottom-0 h-3 w-3 cursor-se-resize touch-none"
        onPointerDown={handleResizeDown}
      />
    </section>
  )
}
