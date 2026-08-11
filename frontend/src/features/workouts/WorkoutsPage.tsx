import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { WORKOUT_TYPES, type Workout, type WorkoutType } from '../../api/types'
import { isoToMmDdYy, todayIso } from '../../utils/date'
import { WorkoutDetail } from './WorkoutDetail'

export function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [date, setDate] = useState(todayIso())
  const [type, setType] = useState<WorkoutType>('Lifting')

  async function loadWorkouts() {
    setLoading(true)
    setError(null)
    try {
      setWorkouts(await api.listWorkouts())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workouts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkouts()
  }, [])

  async function handleCreateWorkout(event: React.FormEvent) {
    event.preventDefault()
    if (!name || !date) return
    try {
      const created = await api.createWorkout({ name, date: isoToMmDdYy(date), type })
      setName('')
      setDate(todayIso())
      setType('Lifting')
      await loadWorkouts()
      setSelectedId(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workout')
    }
  }

  const sorted = [...workouts].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <section>
      <h2>Workouts</h2>

      <form className="entry-form" onSubmit={handleCreateWorkout}>
        <input
          placeholder="Workout name (e.g. Push Day)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
        <select value={type} onChange={(event) => setType(event.target.value as WorkoutType)}>
          {WORKOUT_TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button type="submit">Create workout</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>History</h3>
        {loading ? (
          <p>Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="empty-state">No workouts logged yet.</p>
        ) : (
          <ul className="history-list">
            {sorted.map((workout) => (
              <li key={workout.id}>
                <button
                  type="button"
                  className="link-button workout-select"
                  onClick={() => setSelectedId(workout.id)}
                >
                  {workout.name}
                </button>
                <span className="muted">
                  {workout.date} · {workout.type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedId !== null && (
        <WorkoutDetail
          workoutId={selectedId}
          onClose={() => setSelectedId(null)}
          onWorkoutDeleted={() => {
            setSelectedId(null)
            loadWorkouts()
          }}
          onWorkoutUpdated={loadWorkouts}
        />
      )}
    </section>
  )
}
