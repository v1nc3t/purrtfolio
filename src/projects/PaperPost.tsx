import { useEffect, useState, type ReactNode } from 'react'
import { useCanvasStore, type WindowId } from '../workspace/useCanvasStore'

export function SliceLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="slice-link"
    >
      {children}
    </a>
  )
}

function AsciiFigure({ src, className }: { src: string; className?: string }) {
  return (
    <pre
      className={`m-0 flex items-center justify-center p-2 text-center text-[1em] ${className ?? 'h-full min-h-24 leading-none'}`}
    >
      <span className="whitespace-pre">{src}</span>
    </pre>
  )
}

function Copy({
  title,
  date,
  size,
  as: Title = 'h2',
  links,
  children,
}: {
  title: string
  date?: string
  size: 'lg' | 'base' | 'sm'
  as?: 'h2' | 'span'
  links?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="min-w-0">
      <Title
        className={`block font-bold leading-tight ${
          size === 'lg' ? 'text-[2em]' : size === 'base' ? 'text-[1.73em]' : 'text-[1.36em]'
        }`}
      >
        {title}
      </Title>
      {date ? <p className="mt-1 text-[0.82em] opacity-70">{date}</p> : null}
      {children ? <div className="mt-2 leading-relaxed [&_p+p]:mt-2">{children}</div> : null}
      {links ? (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.82em]">{links}</div>
      ) : null}
    </div>
  )
}

export function FullPost({
  title,
  date,
  figure,
  image = 'right',
  links,
  children,
}: {
  title: string
  date?: string
  figure?: string
  image?: 'left' | 'right'
  links?: ReactNode
  children: ReactNode
}) {
  const copy = (
    <Copy title={title} date={date} size="lg" links={links}>
      {children}
    </Copy>
  )

  return (
    <article className="col-span-2 border-b border-[#6e655c] pb-6 transition-opacity hover:opacity-80">
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
  date,
  figure,
  image = 'over',
  links,
  children,
}: {
  title: string
  date?: string
  figure?: string
  image?: 'over' | 'under'
  links?: ReactNode
  children: ReactNode
}) {
  const copy = (
    <Copy title={title} date={date} size="base" links={links}>
      {children}
    </Copy>
  )
  const pic = figure ? <AsciiFigure src={figure} /> : null

  return (
    <article className="border-b border-[#6e655c] pb-6 transition-opacity hover:opacity-80">
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
  date,
  to,
  figure,
  children,
}: {
  title: string
  date?: string
  to: WindowId
  figure?: string
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer flex-col gap-4 border-x-0 border-t-0 border-b border-[#6e655c] bg-transparent p-0 pb-6 text-left text-[#d5cec2] transition-opacity hover:opacity-80"
      onClick={() => useCanvasStore.getState().open(to)}
    >
      {figure ? <AsciiFigure src={figure} className="w-full leading-[1.5]" /> : null}
      <Copy title={title} date={date} size="sm" as="span">
        {children}
      </Copy>
    </button>
  )
}

const GLYPH: Record<string, [string, string, string]> = {
  ' ': ['   ', '   ', '   '],
  ':': ['   ', ' · ', ' · '],
  '0': [' _ ', '| |', '|_|'],
  '1': ['   ', '  |', '  |'],
  '2': [' _ ', ' _|', '|_ '],
  '3': [' _ ', ' _|', ' _|'],
  '4': ['   ', '|_|', '  |'],
  '5': [' _ ', '|_ ', ' _|'],
  '6': [' _ ', '|_ ', '|_|'],
  '7': [' _ ', '  |', '  |'],
  '8': [' _ ', '|_|', '|_|'],
  '9': [' _ ', '|_|', ' _|'],
}

function asciiText(text: string) {
  return [0, 1, 2]
    .map((row) => [...text].map((ch) => (GLYPH[ch] ?? GLYPH[' '])[row]).join(''))
    .join('\n')
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function ClockPost() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'short' })
  const date = `${weekday} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  return (
    <article
      className="flex w-full flex-col items-center gap-5 border-b border-[#6e655c] pt-6 pb-8 text-center font-['Courier_New',Courier,monospace] text-[1.15em] font-bold transition-opacity hover:opacity-80"
      aria-label={`${time} ${date}`}
    >
      <pre className="m-0 font-[inherit] leading-[1.2]">{asciiText(time)}</pre>
      <p className="m-0">{date}</p>
    </article>
  )
}

const CAT_SLEEP = [
  "      |\      _,,,---,,_",
  "ZZZzz /,`.-'`'    -.  ;-;;,_",
  "     |,4-  ) )-,_. ,\ (  `'-'",
  "    '---''(_/--'  `-'\_)   ",
]

const Z_FRAMES = ['     ', '    z', '   zz', '  Zzz', ' ZZzz', 'ZZZzz']

export function CatPost() {
  const [awake, setAwake] = useState(false)
  const [z, setZ] = useState(0)
  const [poke, setPoke] = useState(0)

  useEffect(() => {
    if (awake) return
    const id = setInterval(() => setZ((i) => (i + 1) % Z_FRAMES.length), 300)
    return () => clearInterval(id)
  }, [awake])

  useEffect(() => {
    if (!awake) return
    const id = window.setTimeout(() => setAwake(false), 4000)
    return () => clearTimeout(id)
  }, [awake, poke])

  const src = [
    CAT_SLEEP[0],
    (awake ? '     ' : Z_FRAMES[z]) + CAT_SLEEP[1].slice(5),
    CAT_SLEEP[2].replace('4', awake ? 'o' : '4'),
    CAT_SLEEP[3],
  ].join('\n')

  return (
    <button
      type="button"
      className="w-full cursor-pointer border-x-0 border-t-0 border-b border-[#6e655c] bg-transparent p-0 pt-8 pb-12 text-[#d5cec2] transition-opacity hover:opacity-80"
      aria-label={awake ? 'Cat is awake' : 'Sleeping cat'}
      onClick={() => {
        setAwake(true)
        setPoke((n) => n + 1)
        setZ(0)
      }}
    >
      <pre className="m-0 mx-auto w-fit text-[0.85em] leading-[1.15] whitespace-pre">{src}</pre>
    </button>
  )
}
