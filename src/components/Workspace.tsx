import { memo, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useWindowsStore, type WindowId } from '../store/windows'
import { Terminal } from './Terminal'
import { Window } from './Window'

type WorkspaceProps = {
  username: string
}

const WindowBody = memo(function WindowBody({
  id,
  username,
}: {
  id: WindowId
  username: string
}) {
  switch (id) {
    case 'terminal':
      return <Terminal username={username} />
    default:
      return <div className="h-full" />
  }
})

export function Workspace({ username }: WorkspaceProps) {
  const openIds = useWindowsStore(
    useShallow((state) => Object.keys(state.windows) as WindowId[]),
  )

  useEffect(() => {
    function onResize() {
      useWindowsStore.getState().clampAll()
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <main
      data-username={username}
      className="relative min-h-svh overflow-hidden bg-workspace"
      aria-label="Workspace"
    >
      <span className="sr-only">Signed in as {username}</span>
      {openIds.map((id) => (
        <Window key={id} id={id}>
          <WindowBody id={id} username={username} />
        </Window>
      ))}
    </main>
  )
}
