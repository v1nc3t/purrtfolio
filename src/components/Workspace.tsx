type WorkspaceProps = {
  username: string
}

export function Workspace({ username }: WorkspaceProps) {
  return (
    <main
      data-username={username}
      className="min-h-svh bg-workspace"
      aria-label="Terminal workspace"
    >
      <span className="sr-only">Signed in as {username}</span>
    </main>
  )
}
