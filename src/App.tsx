import { useEffect, useState } from 'react'
import { NotFound } from './NotFound'
import { CookieNotice } from './shared/CookieNotice'
import { MouseTrail } from './shared/MouseTrail'
import { WelcomePage } from './welcome/WelcomePage'
import { Workspace } from './workspace/Workspace'
import { bindRoutes, getMissing, matchRoute, subscribeMissing } from './workspace/routes'
import { readSessionUsername, writeSessionUsername } from './welcome/username'

function App() {
  const [username, setUsername] = useState<string | null>(readSessionUsername)
  const [missing, setMissing] = useState(() => matchRoute(location.pathname) === null)

  useEffect(() => subscribeMissing(() => setMissing(getMissing())), [])
  useEffect(() => bindRoutes(), [])

  function handleWelcome(name: string) {
    writeSessionUsername(name)
    setUsername(name)
  }

  return (
    <>
      <MouseTrail />
      <CookieNotice />
      {missing ? (
        <NotFound />
      ) : username ? (
        <Workspace username={username} />
      ) : (
        <WelcomePage onSubmit={handleWelcome} />
      )}
    </>
  )
}

export default App
