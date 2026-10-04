import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { useSettings } from '../shared/settings'
import { useCanvasStore } from '../workspace/useCanvasStore'
import { historyRows, historySummary, type HistoryName, type HistoryRow } from './historyGraph'

const TABS = ['about me', 'history', 'structure', 'links', 'settings'] as const

const AVATAR = `                   
                                  ....:-===============-:....
                             .. -============================-...
                          ..======================================.
                       .==============================================.
                    .===================================================-..
                 ..========================================================..
                :============================================================:
              .================================================================..
            .====================================================================.
          .=======================================================================-.
          ==========================================================================.
       ..===============================-............-===============================.
      .:=============================:..................:=============================-.
      -============================........................============================-
    .:============================..........................============================:.
    .===========================-............................-===========================..
   .============================..............................============================.
   ============================................................============================
 ..============================................................============================.
 .============================-................................-============================
 .============================-................................-============================..
 :=============================................................=============================:
.==============================................................==============================
.===============================..............................===============================
 ================================............................================================.
.=================================..........................=================================
 ===================================......................===================================
.=====================================..................=====================================.
.=========================================.........:-========================================.
 :==========================================================================================:.
  ==========================================================================================
 .=====================================...............:==-==================================
   ===============================..........................===============================
   -===========================................................-===========================.
   .========================:....................................:========================.
     =====================:........................................:=====================.
     :===================............................................-==================:
      -================................................................================-..
       :==============..................................................==============-
       ..============....................................................============..
        . ==========......................................................-=========.
          .-=======........................................................========.
           ..=====-........................................................-=====..
             ..==-..........................................................===:.
              ..:-..........................................................=:.
                  ............................................................
                     ....................................................
                       ...............................................
                           .........................................
                             .................................. .
                                       .................
`

type Tab = (typeof TABS)[number]

export function AboutPage() {
  const [tab, setTab] = useState<Tab>('history')
  const [nameOpen, setNameOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  useEffect(() => {
    if (!nameOpen) return
    const id = window.setTimeout(() => setNameOpen(false), 3000)
    return () => window.clearTimeout(id)
  }, [nameOpen])

  useEffect(() => {
    if (!emailOpen) return
    const id = window.setTimeout(() => setEmailOpen(false), 3000)
    return () => window.clearTimeout(id)
  }, [emailOpen])

  return (
    <div className="flex h-full min-h-0 font-mono text-[clamp(0.75rem,1.3cqi,0.875rem)]">
      <aside className="scrollbar-line flex w-[clamp(11rem,34cqi,18rem)] shrink-0 flex-col gap-3 overflow-auto border-r border-white/16 p-3">
        <div aria-hidden className="@container w-full shrink-0">
          <pre
            className="m-0 mx-auto w-fit font-mono leading-[1.05] text-white/75"
            style={{ fontSize: 'calc(100cqw / 58)' }}
          >
            {AVATAR}
          </pre>
        </div>
        <div className="flex flex-col gap-2">
          <Line label="username" value="v1nc3t" />
          <Secret
            label="name"
            hidden="^!#a7-K@ C;o3[#~"
            shown="that is"
            open={nameOpen}
            onToggle={() => setNameOpen((open) => !open)}
          />
          <Secret
            label="email"
            hidden="?o%h3.6xp@mo;l.<0m"
            shown="private"
            open={emailOpen}
            onToggle={() => setEmailOpen((open) => !open)}
          />
          <Line label="year" value="2006" />
          <Line label="nationality" value="ro/in" />
          <div className="leading-[1.2em]">
            <p className="m-0 text-white/45">hobbies</p>
            {['building software', 'photography', 'cooking', 'music', 'movies', 'tv shows', 'anime', 'manga'].map((item, index, list) => (
              <p key={item} className="m-0 whitespace-pre text-white">
                <span className="text-white/45">{index === list.length - 1 ? '`' : '|'}-- </span>
                {item}
              </p>
            ))}
          </div>
        </div>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div role="tablist" aria-label="about" className="flex shrink-0 border-b border-white/16">
          {TABS.map((id) => {
            const selected = tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`about-tab-${id}`}
                aria-controls={`about-panel-${id}`}
                aria-selected={selected}
                onClick={() => setTab(id)}
                className={`cursor-pointer border-r border-white/16 px-3 py-2 tracking-[0.14em] ${
                  selected ? 'text-white' : 'text-white/40'
                }`}
              >
                {id}
              </button>
            )
          })}
        </div>
        <div
          role="tabpanel"
          id={`about-panel-${tab}`}
          aria-labelledby={`about-tab-${tab}`}
          className="min-h-0 flex-1"
        >
          {tab === 'about me' ? <AboutMePanel /> : null}
          {tab === 'history' ? <HistoryPanel /> : null}
          {tab === 'structure' ? <StructurePanel /> : null}
          {tab === 'settings' ? <SettingsPanel /> : null}
        </div>
      </section>
    </div>
  )
}

const BRANCH_COLOR: Record<string, string> = {
  main: '#a89984',
  highschool: '#83a598',
  university: '#8ec07c',
  'CSEP project': '#fabd2f',
  meowDFer: '#fe8019',
  'nyatching-list': '#d3869b',
  'cit cat coe': '#b8bb26',
}

function HistoryLine({ row, headRef }: { row: HistoryRow; headRef?: Ref<HTMLSpanElement> }) {
  const linked = row.labels.some((label) => label.link)
  const named = row.labels.filter((label) => !label.point)
  const points = row.labels.filter((label) => label.point)
  return (
    <span ref={headRef} aria-hidden={!linked} className={`block whitespace-pre${row.future ? ' opacity-35' : ''}`}>
      <span className="text-white">{row.head ? '> ' : '  '}</span>
      {row.glyphs.map((glyph, index) => (
        <span key={index} style={{ color: BRANCH_COLOR[glyph.branch], opacity: glyph.fade }}>
          {glyph.text}
        </span>
      ))}
      {row.date ? <span className="text-white/45">{row.date}</span> : null}
      {named.length > 0 && (
        <span className="text-white">
          (
          {named.map((label, index) => (
            <span key={label.text}>
              {index > 0 ? ', ' : null}
              <HistoryLabel label={label} />
            </span>
          ))}
          )
        </span>
      )}
      {points.length > 0 && (
        <span className="text-white">
          {named.length > 0 ? ' ' : null}
          {points.map((label, index) => (
            <span key={label.text}>
              {index > 0 ? ', ' : null}
              <HistoryLabel label={label} />
            </span>
          ))}
        </span>
      )}
    </span>
  )
}

function HistoryLabel({ label }: { label: HistoryName }) {
  const color = label.branch ? BRANCH_COLOR[label.branch] : undefined
  if (!label.link) return <span style={color ? { color } : undefined}>{label.text}</span>
  return (
    <button
      type="button"
      style={color ? { color } : undefined}
      className="slice-link border-0 bg-transparent p-0 font-[inherit]"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => useCanvasStore.getState().open('projects')}
    >
      {label.text}
    </button>
  )
}

const INK = '#ebdbb2'
const TRUNK = '#a89984'

const PAGES: { name: string; color: string; children: string[] }[] = [
  { name: 'about', color: '#83a598', children: ['about me', 'history', 'structure', 'links', 'settings'] },
  { name: 'projects', color: '#fabd2f', children: [] },
  { name: 'photos', color: '#d3869b', children: [] },
]

function StructureRow({ children }: { children: ReactNode }) {
  return <span className="flex h-[1.2em] items-stretch leading-none">{children}</span>
}

function Elbow({
  rail,
  color,
  label,
  stop = false,
}: {
  rail: string
  color: string
  label?: string
  stop?: boolean
}) {
  return (
    <>
      <span className="relative h-full w-[1ch] shrink-0">
        <span
          className={`absolute left-1/2 w-px -translate-x-1/2 ${stop ? 'top-0 h-1/2' : 'inset-y-0'}`}
          style={{ background: rail }}
        />
        {label != null ? (
          <span className="absolute top-1/2 left-1/2 h-px w-[2.8ch]" style={{ background: color }} />
        ) : null}
      </span>
      {label != null ? (
        <span className="self-center pl-[3.4ch]" style={{ color }}>
          {label}
        </span>
      ) : null}
    </>
  )
}

function StructurePanel() {
  return (
    <pre className="scrollbar-line m-0 h-full overflow-auto py-8 pr-4 pl-[16%] whitespace-normal">
      <StructureRow>
        <span className="self-center" style={{ color: INK }}>
          terminal
        </span>
      </StructureRow>
      {PAGES.map((page, index) => {
        const last = index === PAGES.length - 1
        return (
          <span key={page.name}>
            <StructureRow>
              <Elbow rail={TRUNK} color={TRUNK} />
            </StructureRow>
            <StructureRow>
              <Elbow rail={last ? page.color : TRUNK} color={page.color} label={page.name} stop={last} />
            </StructureRow>
            {page.children.map((child, childIndex) => {
              const end = childIndex === page.children.length - 1
              return (
                <span key={child}>
                  <StructureRow>
                    {last ? <span className="w-[1ch] shrink-0" /> : <Elbow rail={TRUNK} color={TRUNK} />}
                    <span className="w-[5ch] shrink-0" />
                    <Elbow rail={page.color} color={page.color} />
                  </StructureRow>
                  <StructureRow>
                    {last ? <span className="w-[1ch] shrink-0" /> : <Elbow rail={TRUNK} color={TRUNK} />}
                    <span className="w-[5ch] shrink-0" />
                    <Elbow rail={page.color} color={page.color} label={child} stop={end} />
                  </StructureRow>
                </span>
              )
            })}
          </span>
        )
      })}
    </pre>
  )
}

function HistoryPanel() {
  const now = new Date()
  const rows = historyRows(now)
  const scroller = useRef<HTMLPreElement>(null)
  const head = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const pane = scroller.current
    const mark = head.current
    if (!pane || !mark) return
    pane.scrollTop = mark.offsetTop - pane.clientHeight / 2 + mark.offsetHeight / 2
  }, [])

  return (
    <pre
      ref={scroller}
      className="scrollbar-line relative m-0 h-full overflow-auto py-4 pr-4 pl-[20%] leading-normal"
    >
      <span className="sr-only">{historySummary(now)}</span>
      {rows.map((row) => (
        <HistoryLine key={row.id} row={row} headRef={row.head ? head : undefined} />
      ))}
    </pre>
  )
}

function AboutLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="slice-link">
      {children}
    </a>
  )
}

function AboutMePanel() {
  return (
    <div className="scrollbar-line flex h-full flex-col gap-3 overflow-auto p-4 leading-relaxed text-white">
      <p>
        hey, this is my personal website, with things i enjoy. i spend most of my time building software. the rest goes to photography, cooking, and music.
      </p>
      <p>
        i was watching youtube one day and saw a video pop up on my page by <AboutLink href="https://www.youtube.com/@onionboots">onionboots</AboutLink> about a <AboutLink href="https://www.youtube.com/watch?v=tkUgOT22F5s&t=490s">web revival</AboutLink>. it instantly captivated my attention. after watching it i had so many ideas, and couldn't think of which to choose. up until now i was brainwashed to think that websites with crazy visuals or single scroll pages were above all.
      </p>
      <p>
        i lost the plot. the most important thing is whether you like it or not. websites should be created to fit your preferences, not some fancy standards. and this is what i found on the sites listed on neocities. going through them was eye-opening: so many websites people made, different layouts, styles, and aesthetics.
      </p>
      <p>
        i was planning on creating a site of my own for a while, but i didn't have inspiration, not until i saw that video. surfing through the interconnected web, i was able to get inspiration from everywhere (the sites i took inspiration from are listed in links).
      </p>
      <p>
        the theme i've always liked was a retro one, that revolves around ascii (words, images, art). retro, but a minimalistic retro. no flashy colors or images, just simplicity.
      </p>
      <p>
        if you haven't checked out my projects yet (also on <AboutLink href="https://github.com/v1nc3t/">github</AboutLink>), all of them have cat themed names. this started in highschool, when i made a tic tac toe game in c++ and called it cit cat coe. from that point onwards, only cat themed projects (personal ones only, sadly).
      </p>
      <p>
        i do photography, and i got tired of posting pictures on instagram. it felt like it was more for the likes than the photos themselves. you can go to the photography page and check them out, and not "like" them.
      </p>
      <p>enjoy the site, and try to find the easter eggs i scattered around.</p>
    </div>
  )
}

function SettingsPanel() {
  const calm = useSettings((state) => state.calm)
  const trail = useSettings((state) => state.trail)
  const trailOverWindows = useSettings((state) => state.trailOverWindows)
  const trailLength = useSettings((state) => state.trailLength)
  const trailDelay = useSettings((state) => state.trailDelay)

  return (
    <div className="scrollbar-line flex h-full flex-col gap-8 overflow-auto p-4">
      <div className="flex flex-col gap-2">
        <Toggle
          label="remove animations"
          checked={calm}
          onChange={(value) => useSettings.getState().setCalm(value)}
        />
        <p className="m-0 text-white/45">hides the grid and background drag</p>
      </div>
      <div className="flex flex-col gap-3">
        <Toggle
          label="mouse trail"
          checked={trail}
          onChange={(value) => useSettings.getState().setTrail(value)}
        />
        <div className={`flex flex-col gap-3 pl-4 ${trail ? '' : 'opacity-40'}`}>
          <Toggle
            label="over windows"
            checked={trailOverWindows}
            disabled={!trail}
            onChange={(value) => useSettings.getState().setTrailOverWindows(value)}
          />
          <Slider
            label="length"
            min={16}
            max={120}
            step={4}
            value={trailLength}
            disabled={!trail}
            onChange={(value) => useSettings.getState().setTrailLength(value)}
          />
          <Slider
            label="delay"
            min={1}
            max={10}
            value={trailDelay}
            disabled={!trail}
            onChange={(value) => useSettings.getState().setTrailDelay(value)}
          />
        </div>
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      {label}
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="retro-check"
      />
    </label>
  )
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  disabled,
  onChange,
}: {
  label: string
  min: number
  max: number
  step?: number
  value: number
  disabled: boolean
  onChange: (value: number) => void
}) {
  return (
    <label className="grid grid-cols-[4.5rem_1fr_2ch] items-center gap-3">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="retro-range"
      />
      <span className="text-right text-white/45">{value}</span>
    </label>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="m-0">
      <span className="text-white/45">{label}: </span>
      <span className="text-white">{value}</span>
    </p>
  )
}

function Secret({
  label,
  hidden,
  shown,
  open,
  onToggle,
}: {
  label: string
  hidden: string
  shown: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-baseline gap-2">
      <Line label={label} value={open ? shown : hidden} />
      <button
        type="button"
        aria-label={`${open ? 'hide' : 'show'} ${label}`}
        aria-pressed={open}
        onClick={onToggle}
        className="ml-auto shrink-0 cursor-pointer text-white/80"
      >
        <Eye open={open} />
      </button>
    </div>
  )
}

function Eye({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-[1em] w-[1.15em]" aria-hidden>
      <path
        d="M1.2 8S3.6 4 8 4s6.8 4 6.8 4-2.4 4-6.8 4S1.2 8 1.2 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="8" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {open ? null : (
        <path d="M3 13.2 13 2.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      )}
    </svg>
  )
}
