import { Terminal } from './Terminal'
import { Window } from './Window'

type WorkspaceProps = {
  username: string
}

export function Workspace({ username }: WorkspaceProps) {
  return (
    <main
      data-username={username}
      className="relative min-h-svh overflow-hidden bg-workspace"
      aria-label="Workspace"
    >
      <span className="sr-only">Signed in as {username}</span>
      <Window title="terminal">
        <Terminal username={username} />
      </Window>
    </main>
  )
}
