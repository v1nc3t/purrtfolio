import { SHORTCUT_HELP } from '../shared/hotkeys'
import type { WindowId } from '../workspace/useCanvasStore'

export type CommandContext = {
  username: string
  args: string[]
}

export type CommandResult = {
  clear?: boolean
  output: string[]
  open?: Exclude<WindowId, 'terminal'>
}

export type CommandHandler = (ctx: CommandContext) => CommandResult

const windowHandlers: Record<string, CommandHandler> = {
  projects: () => ({ output: [], open: 'projects' }),
  photos: () => ({ output: [], open: 'photos' }),
  about: () => ({ output: [], open: 'about' }),
}

const builtinHandlers: Record<string, CommandHandler> = {
  clear: () => ({ clear: true, output: [] }),
  whoami: (ctx) => ({ output: [ctx.username] }),
  shortcuts: () => ({ output: [...SHORTCUT_HELP] }),
  help: () => ({
    output: [
      ...Object.keys(windowHandlers),
      ...Object.keys(builtinHandlers).filter(
        (name) => name !== 'help' && name !== 'whoami',
      ),
    ],
  }),
}

const handlers: Record<string, CommandHandler> = {
  ...windowHandlers,
  ...builtinHandlers,
}

export function runCommand(raw: string, username: string): CommandResult {
  const trimmed = raw.trim()
  if (!trimmed) return { output: [] }

  const [cmd, ...args] = trimmed.split(/\s+/)
  const handler = handlers[cmd]

  if (!handler) return { output: [`${cmd}: command not found`] }

  return handler({ username, args })
}
