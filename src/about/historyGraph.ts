const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const

type Span = {
  name: string
  start: readonly [number, number]
  end: readonly [number, number]
  link?: boolean
  from?: 'main' | 'school'
}

const SCHOOLS: readonly Span[] = [
  { name: 'highschool', start: [2021, 9], end: [2025, 6] },
  { name: 'university', start: [2025, 9], end: [2028, 6] },
]

const PROJECTS: readonly Span[] = [
  { name: 'CSEP project', start: [2025, 11], end: [2026, 1], from: 'school' },
  { name: 'meowDFer', start: [2026, 2], end: [2026, 6], link: true, from: 'main' },
  { name: 'nyatching-list', start: [2026, 7], end: [2026, 8], link: true, from: 'main' },
]

const POINTERS = [
  { name: 'AI hackathon', at: [2026, 5], link: true },
  { name: 'intro robotics hackathon', at: [2026, 9], link: true },
] as const

function monthId(year: number, month: number) {
  return year * 12 + month - 1
}

type Branch = {
  name: string
  start: number
  end: number
  link?: boolean
  project: boolean
  offMain: boolean
}

const branches: Branch[] = [...SCHOOLS, ...PROJECTS].map((span) => ({
  name: span.name,
  start: monthId(span.start[0], span.start[1]),
  end: monthId(span.end[0], span.end[1]),
  link: 'link' in span ? span.link : undefined,
  project: PROJECTS.some((project) => project.name === span.name),
  offMain: span.from === 'main',
}))

const pointers = POINTERS.map((pointer) => ({
  name: pointer.name,
  at: monthId(pointer.at[0], pointer.at[1]),
  link: pointer.link,
}))

const first = branches[0].start
const last = branches[1].end

export type HistoryName = { text: string; link?: boolean; point?: boolean; branch?: string }

export type HistoryGlyph = { text: string; branch: string }

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

function glyph(text: string, branch: string): HistoryGlyph {
  return { text, branch }
}

function schoolAt(id: number) {
  return branches.find((branch) => !branch.project && branch.start < id && branch.end > id)
}

function projectAt(id: number) {
  return branches.find((branch) => branch.project && branch.start < id && branch.end > id)
}

// ponytail: one side lane. a main-fork overlapping a school-fork needs another column.
function commitGlyphs(branch: Branch, school: Branch | undefined, star: boolean) {
  if (branch.offMain && school) {
    return [glyph('* ', MAIN), glyph(star ? '* ' : '| ', school.name), glyph('  ', school.name)]
  }
  if (branch.project && school) return [glyph('| ', MAIN), glyph('* ', school.name), glyph('  ', school.name)]
  return [glyph('*   ', MAIN)]
}

function forkGlyphs(branch: Branch, school: Branch | undefined) {
  if (branch.offMain && school) {
    return [glyph('|', MAIN), glyph('\\', branch.name), glyph(' ', MAIN), glyph('\\', school.name), glyph('  ', school.name)]
  }
  if (branch.project && school) {
    return [glyph('| ', MAIN), glyph('|', school.name), glyph('\\', branch.name), glyph('  ', branch.name)]
  }
  return [glyph('|', MAIN), glyph('\\', branch.name), glyph('  ', branch.name)]
}

function joinGlyphs(branch: Branch, school: Branch | undefined) {
  if (branch.offMain && school) {
    return [glyph('|', MAIN), glyph('/', branch.name), glyph(' ', MAIN), glyph('/', school.name), glyph('  ', school.name)]
  }
  if (branch.project && school) {
    return [glyph('| ', MAIN), glyph('|', school.name), glyph('/', branch.name), glyph('  ', branch.name)]
  }
  return [glyph('|', MAIN), glyph('/', branch.name), glyph('  ', branch.name)]
}

function bodyGlyphs(school: Branch | undefined, project: Branch | undefined, star: boolean) {
  if (project?.offMain && school) {
    return [glyph('| ', MAIN), glyph('| ', project.name), glyph(star ? '* ' : '| ', school.name)]
  }
  if (project && school) {
    return [glyph('| ', MAIN), glyph(star ? '* ' : '| ', school.name), glyph('| ', project.name)]
  }
  if (school) return [glyph('| ', MAIN), glyph(star ? '* ' : '| ', school.name)]
  return [glyph(star ? '*   ' : '|   ', MAIN)]
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
  const rows: HistoryRow[] = []
  const emit = (key: string, glyphs: HistoryGlyph[], at: number, labels: HistoryName[], dated: boolean) => {
    const head = dated && at === headAt
    const year = Math.floor(at / 12)
    const month = (at % 12) + 1
    const names = head ? [{ text: 'HEAD' }, ...labels] : labels
    const monthName = `${MONTHS[month - 1]} ${year}`
    const text = labelText(names)
    const date = !dated ? '' : text ? `${monthName} ` : month === 1 ? String(year) : ''
    const line = `${head ? '>' : ' '} ${glyphs.map((item) => item.text).join('')}${date}${text}`
    rows.push({ id: key, line, glyphs, date, labels: names, head, future: at > cursor })
  }
  for (let id = last; id >= first; id--) {
    const merging = branches.find((branch) => branch.end === id)
    const starting = branches.find((branch) => branch.start === id)
    const school = schoolAt(id)
    const project = projectAt(id)
    const pointer = pointers.find((item) => item.at === id)
    const extra: HistoryName[] = pointer ? [{ text: pointer.name, link: pointer.link, point: true }] : []
    const named = (branch: Branch): HistoryName => ({ text: branch.name, link: branch.link, branch: branch.name })
    if (merging) {
      emit(String(id), commitGlyphs(merging, school, Boolean(pointer)), id, [named(merging), ...extra], true)
      emit(`${id}-fork`, forkGlyphs(merging, school), id, [], false)
    } else if (starting) {
      emit(`${id}-join`, joinGlyphs(starting, school), id, [], false)
      emit(String(id), commitGlyphs(starting, school, Boolean(pointer)), id, [named(starting), ...extra], true)
    } else {
      emit(String(id), bodyGlyphs(school, project, Boolean(pointer)), id, extra, true)
    }
  }
  return rows
}

export function historySummary(now: Date) {
  const month = MONTHS[now.getMonth()]
  const year = now.getFullYear()
  return `highschool, sep 2021 to jun 2025. university, sep 2025 to jun 2028. CSEP project, nov 2025 to jan 2026. meowDFer, feb 2026 to jun 2026. AI hackathon, may 2026. nyatching-list, jul 2026 to sep 2026. intro robotics hackathon, sep 2026. now ${month} ${year}. each line is a month.`
}

function assertHistory() {
  const rows = historyRows(new Date(2026, 9, 3))
  const linked = (name: string) =>
    rows.some((row) => row.labels.some((label) => label.text === name && label.link))
  if (!['meowDFer', 'nyatching-list', 'AI hackathon', 'intro robotics hackathon'].every(linked)) {
    throw new Error('missing link')
  }
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
}

if (import.meta.env?.DEV) assertHistory()
