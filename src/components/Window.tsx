import type { ReactNode } from 'react'

type WindowProps = {
  title: string
  children: ReactNode
}

export function Window({ title, children }: WindowProps) {
  return (
    <section
      aria-label={title}
      className="absolute left-1/2 top-1/2 z-10 flex h-[min(28rem,calc(100svh-2rem))] w-[min(72ch,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col border border-terminal-muted bg-terminal-bg"
    >
      <header className="shrink-0 border-b border-terminal-muted px-3 py-1 text-sm text-terminal-muted">
        {title}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}
