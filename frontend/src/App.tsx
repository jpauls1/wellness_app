import { useState } from 'react'
import { WeightPage } from './features/weight/WeightPage'
import { WorkoutsPage } from './features/workouts/WorkoutsPage'

type Tab = 'weight' | 'workouts'

function App() {
  const [tab, setTab] = useState<Tab>('weight')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Wellness Tracker</h1>
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
  )
}

export default App
