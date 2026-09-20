import { useState } from 'react'
import { WelcomePage } from './welcome/WelcomePage'
import { Workspace } from './workspace/Workspace'
import { readSessionUsername, writeSessionUsername } from './welcome/username'

function App() {
  const [username, setUsername] = useState<string | null>(readSessionUsername)

  function handleWelcome(name: string) {
    writeSessionUsername(name)
    setUsername(name)
  }

  if (!username) {
    return <WelcomePage onSubmit={handleWelcome} />
  }

  return <Workspace username={username} />
}

export default App
