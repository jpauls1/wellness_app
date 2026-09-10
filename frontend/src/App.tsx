import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { setTokenGetter } from './api/client'
import { WeightPage } from './features/weight/WeightPage'
import { WorkoutsPage } from './features/workouts/WorkoutsPage'

type Tab = 'weight' | 'workouts'

// Registers the Clerk session-token getter with the plain-function api client
// once, so every api.* call can attach it — client.ts has no hook access.
function AuthBridge() {
  const { getToken } = useAuth()

  useEffect(() => {
    setTokenGetter(getToken)
  }, [getToken])

  return null
}

function App() {
  const [tab, setTab] = useState<Tab>('weight')

  return (
    <>
      <AuthBridge />
      <SignedOut>
        <div className="app-signed-out">
          <SignInButton mode="modal" />
        </div>
      </SignedOut>
      <SignedIn>
        <div className="app">
          <header className="app-header">
            <div className="app-title-row">
              <h1>Wellness Tracker</h1>
              <UserButton />
            </div>
            <nav className="tabs">
              <button
                type="button"
                className={tab === 'weight' ? 'active' : ''}
                onClick={() => setTab('weight')}
              >
                Weight
              </button>
              <button
                type="button"
                className={tab === 'workouts' ? 'active' : ''}
                onClick={() => setTab('workouts')}
              >
                Workouts
              </button>
            </nav>
          </header>

          <main>{tab === 'weight' ? <WeightPage /> : <WorkoutsPage />}</main>
        </div>
      </SignedIn>
    </>
  )
}

export default App
