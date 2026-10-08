import { useState } from 'react'
import { CookieNotice } from './shared/CookieNotice'
import { MouseTrail } from './shared/MouseTrail'
import { WelcomePage } from './welcome/WelcomePage'
import { Workspace } from './workspace/Workspace'
import { readSessionUsername, writeSessionUsername } from './welcome/username'

function App() {
  const [username, setUsername] = useState<string | null>(readSessionUsername)

  function handleWelcome(name: string) {
    writeSessionUsername(name)
    setUsername(name)
  }

  return (
    <>
      <MouseTrail />
      <CookieNotice />
      {username ? (
        <Workspace username={username} />
      ) : (
        <WelcomePage onSubmit={handleWelcome} />
      )}
    </>
  )
}

export default App
