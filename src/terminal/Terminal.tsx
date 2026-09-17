import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from 'react'
import { BlockCursor } from '../shared/BlockCursor'
import { useCanvasStore } from '../workspace/useCanvasStore'
import { runCommand } from './commands'

type TerminalProps = {
  username: string
}

type LogLine =
  | { kind: 'input'; text: string }
  | { kind: 'output'; text: string }

const MAX_COMMAND_LENGTH = 20
const lineClass = 'flex items-center whitespace-pre py-1'

function clampCaret(position: number, length: number) {
  return Math.min(Math.max(position, 0), length)
}

function promptText(username: string) {
  return `${username}@purrtfolio:~$ `
}

export const Terminal = memo(function Terminal({ username }: TerminalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const prompt = promptText(username)

  const [value, setValue] = useState('')
  const [caret, setCaret] = useState(0)
  const [lines, setLines] = useState<LogLine[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(true)

  const windowFocused = useCanvasStore(
    (state) => state.focusedId === 'terminal' && !state.isOverviewMode,
  )

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    if (windowFocused) input.focus()
    else input.blur()
  }, [windowFocused])

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return
    const next = clampCaret(caret, value.length)
    if (input.selectionStart !== next || input.selectionEnd !== next) {
      input.setSelectionRange(next, next)
    }
  }, [value, caret])

  useLayoutEffect(() => {
    const log = logRef.current
    if (!log) return
    log.scrollTop = log.scrollHeight
  }, [lines, value])

  function setInput(next: string, nextCaret = next.length) {
    const clipped = next.slice(0, MAX_COMMAND_LENGTH)
    setValue(clipped)
    setCaret(clampCaret(nextCaret, clipped.length))
  }

  function submitCommand(raw: string) {
    const result = runCommand(raw, username)
    const command = raw.trim()

    if (command && command !== history[history.length - 1]) {
      setHistory((prev) => [...prev, command])
    }

    setInput('')
    setDraft('')
    setHistoryIndex(null)

    if (result.open) useCanvasStore.getState().open(result.open)

    if (result.clear) {
      setLines([])
      return
    }

    setLines((prev) => [
      ...prev,
      { kind: 'input', text: raw },
      ...result.output.map((text) => ({ kind: 'output' as const, text })),
    ])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitCommand(value)
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value.slice(0, MAX_COMMAND_LENGTH)
    const selection = Math.min(
      event.target.selectionStart ?? next.length,
      next.length,
    )
    setInput(next, selection)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (history.length === 0) return

      const nextIndex =
        historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1)

      if (historyIndex === null) setDraft(value)
      setHistoryIndex(nextIndex)
      setInput(history[nextIndex])
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyIndex === null) return

      if (historyIndex >= history.length - 1) {
        setHistoryIndex(null)
        setInput(draft)
        return
      }

      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      setInput(history[nextIndex])
    }
  }

  function handleSelect(event: SyntheticEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const start = input.selectionStart ?? 0
    setCaret(clampCaret(start, input.value.length))
  }

  function handleLogClick() {
    inputRef.current?.focus()
  }

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <div
        ref={logRef}
        className="scrollbar-line min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 text-sm leading-none"
        onClick={handleLogClick}
      >
        {lines.map((line, index) =>
          line.kind === 'input' ? (
            <div key={index} className={lineClass}>
              <span className="text-terminal-muted">{prompt}</span>
              <span>{line.text}</span>
            </div>
          ) : (
            <div key={index} className={lineClass}>
              {line.text}
            </div>
          ),
        )}
        <div className={`relative ${lineClass}`}>
          <span className="shrink-0 text-terminal-muted">{prompt}</span>
          <div className="relative min-w-[1ch] flex-1">
            <input
              ref={inputRef}
              id="terminal-input"
              name="command"
              aria-label="command"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={MAX_COMMAND_LENGTH}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onSelect={handleSelect}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="absolute inset-0 z-10 cursor-text bg-transparent text-transparent caret-transparent outline-none"
            />
            <div className="pointer-events-none relative h-[1em]" aria-hidden>
              <span>{value}</span>
              <BlockCursor caret={caret} focused={focused} boxClass="top-[-0.15em] bottom-0" />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
})
