type BlockCursorProps = {
  caret: number
  focused?: boolean
  boxClass?: string
}

export function BlockCursor({
  caret,
  focused = true,
  boxClass = 'top-0 h-[1.2em]',
}: BlockCursorProps) {
  return (
    <span
      aria-hidden
      className={
        focused
          ? `absolute w-[1ch] bg-terminal-fg animate-cursor-blink ${boxClass}`
          : `absolute box-border w-[1ch] border border-terminal-fg ${boxClass}`
      }
      style={{ left: `${caret}ch` }}
    />
  )
}
