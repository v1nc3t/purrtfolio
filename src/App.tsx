import { useState } from 'react'
import { WelcomePage } from './components/WelcomePage'
import { Workspace } from './components/Workspace'
import { readSessionUsername, writeSessionUsername } from './lib/username'

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
