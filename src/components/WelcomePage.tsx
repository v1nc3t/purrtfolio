import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from 'react'
import { normalizeUsername, sanitizeUsernameInput } from '../lib/username'

type WelcomePageProps = {
  onSubmit: (username: string) => void
}

function clampCaret(position: number, length: number) {
  return Math.min(Math.max(position, 0), length)
}

export function WelcomePage({ onSubmit }: WelcomePageProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [caret, setCaret] = useState(0)
  const username = normalizeUsername(name)

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return
    const next = clampCaret(caret, name.length)
    if (input.selectionStart !== next || input.selectionEnd !== next) {
      input.setSelectionRange(next, next)
    }
  }, [name, caret])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!username) return
    onSubmit(username)
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    const selection = event.target.selectionStart ?? raw.length
    const sanitized = sanitizeUsernameInput(raw)
    const removedBefore =
      raw.slice(0, selection).length -
      sanitizeUsernameInput(raw.slice(0, selection)).length
    setName(sanitized)
    setCaret(clampCaret(selection - removedBefore, sanitized.length))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === ' ') {
      event.preventDefault()
      return
    }

    const input = event.currentTarget
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? start
    const atEnd = start === end && start >= input.value.length
    const atStart = start === end && start <= 0

    if (
      (event.key === 'ArrowRight' || event.key === 'End') &&
      atEnd
    ) {
      event.preventDefault()
      return
    }

    if ((event.key === 'ArrowLeft' || event.key === 'Home') && atStart) {
      event.preventDefault()
    }
  }

  function handleSelect(event: SyntheticEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const start = input.selectionStart ?? 0
    setCaret(clampCaret(start, input.value.length))
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-terminal-bg">
      <form onSubmit={handleSubmit}>
        <div className="relative font-mono text-lg">
          <input
            ref={inputRef}
            id="username"
            name="username"
            aria-label="username"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            maxLength={32}
            value={name}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            className="absolute inset-0 z-10 cursor-text bg-transparent text-transparent caret-transparent outline-none"
          />
          <div
            className="pointer-events-none relative min-h-[1.2em] min-w-[8ch]"
            aria-hidden
          >
            <span className={name ? 'text-terminal-fg' : 'text-terminal-muted'}>
              {name || 'username'}
            </span>
            <span
              className="absolute top-0 inline-block h-[1.2em] w-[1ch] bg-terminal-fg animate-cursor-blink"
              style={{ left: `${caret}ch` }}
            />
          </div>
        </div>
      </form>
    </main>
  )
}
