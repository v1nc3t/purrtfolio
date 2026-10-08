const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const

type Span = {
  name: string
  start: readonly [number, number]
  end?: readonly [number, number]
  link?: boolean
  from?: 'main' | 'school'
  fade?: boolean
}

const SCHOOLS: readonly Span[] = [
  { name: 'highschool', start: [2021, 9], end: [2025, 6] },
  { name: 'university', start: [2025, 9], end: [2028, 6] },
]

// no end: still in progress, so the lane runs up to the current month and never merges back
const PROJECTS: readonly Span[] = [
  { name: 'cit cat coe', start: [2023, 12], end: [2024, 8], link: true, from: 'main', fade: true },
  { name: 'CSEP project', start: [2025, 11], end: [2026, 1], from: 'school' },
  { name: 'meowDFer', start: [2026, 2], end: [2026, 6], link: true, from: 'main' },
  { name: 'meowNY', start: [2026, 5], from: 'main' },
  { name: 'nyatching-list', start: [2026, 7], end: [2026, 8], link: true, from: 'main' },
  { name: 'purrtfolio', start: [2026, 9], from: 'main' },
]

const POINTERS = [
  { name: 'AI hackathon', at: [2026, 5], link: true },
  { name: 'intro robotics hackathon', at: [2026, 9], link: true },
] as const

function monthId(year: number, month: number) {
  return year * 12 + month - 1
}

const at = (date: readonly [number, number]) => monthId(date[0], date[1])

const monthName = (id: number) => `${MONTHS[id % 12]} ${Math.floor(id / 12)}`

const pointers = POINTERS.map((pointer) => ({
  name: pointer.name,
  at: at(pointer.at),
  link: pointer.link,
}))

const dates = [
  ...[...SCHOOLS, ...PROJECTS].flatMap((span) => (span.end ? [at(span.start), at(span.end)] : [at(span.start)])),
  ...pointers.map((pointer) => pointer.at),
]
const first = Math.min(...dates)
const last = Math.max(...dates)

export type HistoryName = { text: string; link?: boolean; point?: boolean; branch?: string }

export type HistoryGlyph = { text: string; branch: string; fade?: number }

export type HistoryRow = {
  id: string
  line: string
  glyphs: HistoryGlyph[]
  date: string
  labels: HistoryName[]
  head: boolean
  future: boolean
}

const MAIN = 'main'
const BLANK: HistoryGlyph = { text: ' ', branch: MAIN }

type Lane = {
  name: string
  link?: boolean
  group: 'school' | 'main' | 'child'
  start: number
  // last month row the lane is drawn in
  top: number
  merges: boolean
  tip: boolean
  fadeEnd?: number
  slot: number
}

const drawnLane = (lane: Lane) => lane.merges || lane.top > lane.start

function lanesAt(headAt: number) {
  const lanes: Lane[] = [...SCHOOLS, ...PROJECTS].map((span) => {
    const end = span.end && at(span.end)
    return {
      name: span.name,
      link: span.link,
      group: SCHOOLS.includes(span) ? 'school' : span.from === 'school' ? 'child' : 'main',
      start: at(span.start),
      top: end === undefined ? headAt : end - 1,
      merges: end !== undefined && !span.fade,
      tip: end === undefined,
      fadeEnd: span.fade ? end : undefined,
      slot: 0,
    }
  })
  // a project keeps one column for its whole life, so its line stays straight
  // ponytail: no compaction like git's; a project outliving inner neighbours keeps its outer column
  for (const group of ['main', 'child'] as const) {
    const slots: Lane[][] = []
    const members = lanes.filter((lane) => lane.group === group && drawnLane(lane)).sort((a, b) => a.start - b.start)
    for (const lane of members) {
      lane.slot = 1
      while (slots[lane.slot]?.some((other) => other.start <= lane.top && lane.start <= other.top)) lane.slot++
      slots[lane.slot] = [...(slots[lane.slot] ?? []), lane]
    }
  }
  return lanes
}

function place(lanes: Lane[]) {
  const inner = Math.max(0, ...lanes.filter((lane) => lane.group === 'main').map((lane) => lane.slot))
  const cols = new Map<Lane, number>()
  for (const lane of lanes) {
    const slot = lane.group === 'main' ? lane.slot : lane.group === 'school' ? inner + 1 : inner + 1 + lane.slot
    cols.set(lane, slot * 2)
  }
  return cols
}

function schoolCol(cols: Map<Lane, number>) {
  for (const [lane, col] of cols) if (lane.group === 'school') return col
  return 0
}

const parentCol = (lane: Lane, cols: Map<Lane, number>) => (lane.group === 'child' ? schoolCol(cols) : 0)

type Draft = { id: string; at: number; cells: HistoryGlyph[]; labels: HistoryName[]; dated: boolean }

function monthDraft(month: number, cols: Map<Lane, number>, lanes: Lane[]): Draft {
  const cells = Array.from({ length: Math.max(0, ...cols.values()) + 2 }, () => BLANK)
  cells[0] = { text: '|', branch: MAIN }
  for (const [lane, col] of cols) cells[col] = { text: '|', branch: lane.name }
  const named: [number, HistoryName][] = []
  const commit = (col: number, lane?: Lane) => {
    cells[col] = { ...cells[col], text: '*' }
    if (lane) named.push([col, { text: lane.name, link: lane.link, branch: lane.name }])
  }
  for (const lane of lanes) {
    if (lane.start === month || (lane.merges && lane.top + 1 === month)) commit(parentCol(lane, cols), lane)
    const tip = cols.get(lane)
    if (lane.tip && lane.top === month && tip !== undefined) commit(tip, lane)
  }
  const points = pointers.filter((item) => item.at === month)
  if (points.length) commit(schoolCol(cols))
  const labels = named.sort((a, b) => a[0] - b[0]).map(([, label]) => label)
  for (const point of points) labels.push({ text: point.name, link: point.link, point: true })
  return { id: String(month), at: month, cells, labels, dated: true }
}

type Track = { branch: string; from: number; to: number }

// Moves lines like git's graph.c (graph_output_collapsing_line): one column per row, done once next
// to the target. When the next cell holds another line, the diagonal jumps it and that line keeps its char.
function stage(tracks: Track[]) {
  if (tracks.every((track) => track.from === track.to)) return []
  const width = Math.max(...tracks.flatMap((track) => [track.from, track.to])) + 2
  const pos = tracks.map((track) => track.from)
  const settled = (index: number) => Math.abs(tracks[index].to - pos[index]) <= 1
  const rows: HistoryGlyph[][] = []
  while (!tracks.every((_, index) => settled(index))) {
    const cells = Array.from({ length: width }, () => BLANK)
    const moving: number[] = []
    tracks.forEach((track, index) => {
      if (!settled(index)) {
        moving.push(index)
        return
      }
      pos[index] = track.to
      if (cells[track.to] === BLANK) cells[track.to] = { text: '|', branch: track.branch }
    })
    const lean = Math.sign(tracks[moving[0]].to - pos[moving[0]])
    // lines nearest their target go first, so the ones behind see them and cross
    moving.sort((a, b) => (pos[a] - pos[b]) * -lean)
    for (const index of moving) {
      const { branch, from, to } = tracks[index]
      let next = pos[index] + lean
      if (cells[next] !== BLANK && pos[index] === from) {
        // two lines leaving one commit the same way: the second waits a row
        if (cells[from] === BLANK) cells[from] = { text: '|', branch }
        continue
      }
      while (cells[next] !== BLANK && Math.abs(to - next) > 1) next += lean
      pos[index] = next
      cells[next] = { text: lean < 0 ? '/' : '\\', branch }
    }
    rows.push(cells)
  }
  return rows
}

// Between month a and the month below: first lanes fork out or make room, then lanes join their base commit.
function transition(a: number, upper: Map<Lane, number>, middle: Map<Lane, number>, lower: Map<Lane, number>) {
  const out: Track[] = [{ branch: MAIN, from: 0, to: 0 }]
  const into: Track[] = [{ branch: MAIN, from: 0, to: 0 }]
  for (const [lane, mid] of middle) {
    const from = upper.get(lane) ?? (lane.merges ? parentCol(lane, upper) : undefined)
    // a tip or a fade starts in the row below, with nothing above it
    if (from === undefined) continue
    out.push({ branch: lane.name, from, to: mid })
    into.push({ branch: lane.name, from: mid, to: lower.get(lane) ?? parentCol(lane, lower) })
  }
  const draft = (id: string, month: number) => (cells: HistoryGlyph[], index: number): Draft => ({
    id: `${id}-${index}`,
    at: month,
    cells,
    labels: [],
    dated: false,
  })
  return [...stage(out).map(draft(`${a}-out`, a)), ...stage(into).map(draft(`${a - 1}-in`, a - 1))]
}

function labelText(names: HistoryName[]) {
  const named = names.filter((name) => !name.point)
  const points = names.filter((name) => name.point)
  const titled = named.length ? `(${named.map((name) => name.text).join(', ')})` : ''
  const pointed = points.map((name) => name.text).join(', ')
  return titled && pointed ? `${titled} ${pointed}` : titled || pointed
}

export function historyRows(now: Date): HistoryRow[] {
  const cursor = monthId(now.getFullYear(), now.getMonth() + 1)
  // ponytail: HEAD clamps into the spans; a date outside sits on the nearer end
  const headAt = Math.min(last, Math.max(first, cursor))
  const lanes = lanesAt(headAt)
  const drawn = lanes.filter(drawnLane)
  const rowCols = (month: number) => place(drawn.filter((lane) => lane.start < month && month <= lane.top))
  const drafts: Draft[] = []
  for (let month = last; month >= first; month--) {
    const cols = rowCols(month)
    drafts.push(monthDraft(month, cols, lanes))
    if (month === first) break
    const middle = place(drawn.filter((lane) => lane.start < month && month - 1 <= lane.top))
    drafts.push(...transition(month, cols, middle, rowCols(month - 1)))
  }
  return drafts.map((draft, index) => {
    if (draft.dated) {
      const near = [drafts[index - 1], drafts[index + 1]].filter((other) => other && !other.dated)
      const width = Math.max(4, draft.cells.length, ...near.map((other) => other.cells.length))
      while (draft.cells.length < width) draft.cells.push(BLANK)
    }
    let glyphs = draft.cells
    for (const lane of lanes) {
      if (lane.fadeEnd === undefined || draft.at < lane.start || draft.at >= lane.fadeEnd) continue
      const fade = Math.max(0.15, 1 - (draft.at - lane.start) / (lane.fadeEnd - lane.start))
      glyphs = glyphs.map((cell) => (cell.branch === lane.name ? { ...cell, fade } : cell))
    }
    const head = draft.dated && draft.at === headAt
    const labels = head ? [{ text: 'HEAD' }, ...draft.labels] : draft.labels
    const text = labelText(labels)
    const date = !draft.dated ? '' : text ? `${monthName(draft.at)} ` : draft.at % 12 === 0 ? String(draft.at / 12) : ''
    const line = `${head ? '>' : ' '} ${glyphs.map((item) => item.text).join('')}${date}${text}`
    return { id: draft.id, line, glyphs, date, labels, head, future: draft.at > cursor }
  })
}

export function historySummary(now: Date) {
  const events = [
    ...[...SCHOOLS, ...PROJECTS].map((span) => {
      const end = span.end && at(span.end)
      const tail = end === undefined ? ', in progress' : span.fade ? `, fading out by ${monthName(end)}` : ` to ${monthName(end)}`
      return { at: at(span.start), text: `${span.name}, ${monthName(at(span.start))}${tail}` }
    }),
    ...pointers.map((pointer) => ({ at: pointer.at, text: `${pointer.name}, ${monthName(pointer.at)}` })),
  ].sort((a, b) => a.at - b.at)
  return `${events.map((event) => `${event.text}. `).join('')}now ${monthName(monthId(now.getFullYear(), now.getMonth() + 1))}. each line is a month.`
}

function assertHistory() {
  const rows = historyRows(new Date(2026, 9, 3))
  const linked = (name: string) =>
    rows.some((row) => row.labels.some((label) => label.text === name && label.link))
  if (!['cit cat coe', 'meowDFer', 'nyatching-list', 'AI hackathon', 'intro robotics hackathon'].every(linked)) {
    throw new Error('missing link')
  }
  const cit = rows.filter((row) => row.glyphs.some((item) => item.branch === 'cit cat coe'))
  const citMark = (mark: string) => cit.some((row) => row.glyphs.some((item) => item.branch === 'cit cat coe' && item.text.includes(mark)))
  if (!citMark('/') || citMark('\\')) throw new Error('cit merge')
  const jog = rows.find((row) => row.id === `${monthId(2024, 8)}-out-0`)
  if (!jog?.glyphs.some((item) => item.branch === 'highschool' && item.text === '\\')) throw new Error('school jog')
  if (jog.glyphs.filter((item) => item.text.includes('\\')).length !== 1) throw new Error('school jog')
  if (jog.glyphs.some((item) => item.branch === 'cit cat coe')) throw new Error('cit jog')
  if (!cit.some((row) => row.glyphs.some((item) => item.fade != null && item.fade < 0.5))) throw new Error('cit fade')
  const citStart = rows.find((row) => row.line.includes('dec 2023') && row.labels.some((label) => label.text === 'cit cat coe'))
  if (citStart?.glyphs[0]?.branch !== 'main') throw new Error('cit lane')
  if (rows.some((row) => row.labels.some((label) => label.point && row.line.includes(`(${label.text})`)))) {
    throw new Error('point parens')
  }
  const meow = rows.find((row) => row.labels.some((label) => label.text === 'meowDFer'))
  if (meow?.glyphs[0]?.branch !== 'main') throw new Error('meow lane')
  const csep = rows.find((row) => row.labels.some((label) => label.text === 'CSEP project'))
  if (!csep?.glyphs.some((glyph) => glyph.branch === 'university' && glyph.text.includes('*'))) {
    throw new Error('csep lane')
  }
  const robotics = rows.find((row) => row.labels.some((label) => label.text === 'intro robotics hackathon'))
  if (!robotics?.glyphs.some((glyph) => glyph.branch === 'university' && glyph.text.includes('*'))) {
    throw new Error('robotics lane')
  }
  const head = rows.find((row) => row.head)
  if (!head?.line.startsWith('> ') || head.labels[0]?.text !== 'HEAD') throw new Error(head?.line)
  for (const name of ['meowNY', 'purrtfolio']) {
    const lane = rows.filter((row) => row.glyphs.some((item) => item.branch === name))
    const marks = lane.flatMap((row) => row.glyphs.filter((item) => item.branch === name).map((item) => item.text))
    if (marks.includes('\\') || !marks.includes('/')) throw new Error(`${name} merge`)
    if (!head.glyphs.some((item) => item.branch === name && item.text === '*')) throw new Error(`${name} tip`)
    if (lane.some((row) => row.future)) throw new Error(`${name} future`)
  }
  const grid = rows.map((row) => row.glyphs.map((item) => item.text))
  const marked = (row: number, col: number) => (grid[row]?.[col] ?? ' ') !== ' '
  grid.forEach((cells, row) =>
    cells.forEach((text, col) => {
      const lean = text === '/' ? 1 : text === '\\' ? -1 : 0
      if (!lean) return
      // a one-month branch is a fork right above its join: |\ over |/
      const flip = lean > 0 ? '\\' : '/'
      const up = marked(row - 1, col + lean) || grid[row - 1]?.[col] === flip
      const down = marked(row + 1, col - lean) || grid[row + 1]?.[col] === flip
      if (!up || !down) throw new Error(`loose line: ${rows[row].line}`)
      const branch = rows[row].glyphs[col].branch
      const straight = (other: number) => grid[other]?.[col] === '|' && rows[other].glyphs[col].branch !== branch
      if (straight(row - 1) && straight(row + 1)) throw new Error(`diagonal over a straight line: ${rows[row].line}`)
    }),
  )
}

if (import.meta.env?.DEV) assertHistory()
