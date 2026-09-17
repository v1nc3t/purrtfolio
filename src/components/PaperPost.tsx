import type { ReactNode } from 'react'
import { useCanvasStore, type WindowId } from '../store/useCanvasStore'

function AsciiFigure({ src }: { src: string }) {
  return (
    <pre className="m-0 flex h-full min-h-24 items-center justify-center border border-[#7a7164] p-2 text-center text-[10px] leading-none">
      {src}
    </pre>
  )
}

function Copy({
  title,
  size,
  as: Title = 'h2',
  links,
  children,
}: {
  title: string
  size: 'lg' | 'base' | 'sm'
  as?: 'h2' | 'span'
  links?: { href: string; label: string }[]
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <Title
        className={`block leading-tight ${
          size === 'lg' ? 'text-xl' : size === 'base' ? 'text-lg' : 'text-sm'
        }`}
      >
        {title}
      </Title>
      <div className="mt-2 text-[10px] leading-relaxed">{children}</div>
      {links?.length ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {links.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="relative inline-block text-[8px] text-inherit no-underline after:absolute after:top-[calc(50%-0.5px)] after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:content-[''] after:transition-transform hover:after:scale-x-100"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function FullPost({
  title,
  figure,
  image = 'right',
  links,
  children,
}: {
  title: string
  figure?: string
  image?: 'left' | 'right'
  links?: { href: string; label: string }[]
  children: ReactNode
}) {
  const copy = (
    <Copy title={title} size="lg" links={links}>
      {children}
    </Copy>
  )

  return (
    <article className="col-span-2 border-b border-[#7a7164] pb-4">
      {figure ? (
        <div className="grid grid-cols-2 gap-4">
          {image === 'left' ? <AsciiFigure src={figure} /> : copy}
          {image === 'left' ? copy : <AsciiFigure src={figure} />}
        </div>
      ) : (
        copy
      )}
    </article>
  )
}

export function HalfPost({
  title,
  figure,
  image = 'over',
  links,
  children,
}: {
  title: string
  figure?: string
  image?: 'over' | 'under'
  links?: { href: string; label: string }[]
  children: ReactNode
}) {
  const copy = (
    <Copy title={title} size="base" links={links}>
      {children}
    </Copy>
  )
  const pic = figure ? <AsciiFigure src={figure} /> : null

  return (
    <article className="border-b border-[#7a7164] pb-4">
      <div className="flex flex-col gap-2">
        {image === 'over' ? pic : null}
        {copy}
        {image === 'under' ? pic : null}
      </div>
    </article>
  )
}

export function SidePost({
  title,
  to,
  children,
}: {
  title: string
  to: WindowId
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="w-full cursor-pointer border border-[#7a7164] bg-transparent p-3 text-left text-[#e6d9c2]"
      onClick={() => useCanvasStore.getState().open(to)}
    >
      <Copy title={title} size="sm" as="span">
        {children}
      </Copy>
    </button>
  )
}
