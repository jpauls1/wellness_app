import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { WorkoutWithSets } from '../../api/types'

interface WorkoutDetailProps {
  workoutId: number
  onClose: () => void
  onWorkoutDeleted: () => void
}

export function WorkoutDetail({ workoutId, onClose, onWorkoutDeleted }: WorkoutDetailProps) {
  const [workout, setWorkout] = useState<WorkoutWithSets | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [exerciseType, setExerciseType] = useState('')
  const [reps, setReps] = useState('')
  const [timeSpent, setTimeSpent] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')

  async function loadWorkout() {
    setError(null)
    try {
      setWorkout(await api.getWorkout(workoutId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout')
    }
  }

  useEffect(() => {
    loadWorkout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId])

  async function handleAddSet(event: React.FormEvent) {
    event.preventDefault()
    const parsedReps = Number(reps)
    if (!exerciseType || !reps || Number.isNaN(parsedReps)) return

    try {
      await api.createSet(workoutId, {
        exercise_type: exerciseType,
        reps: parsedReps,
        time_spent: timeSpent || undefined,
        calories_burned: caloriesBurned ? Number(caloriesBurned) : undefined,
      })
      setReps('')
      setTimeSpent('')
      setCaloriesBurned('')
      await loadWorkout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add set')
    }
  }

  async function handleDeleteSet(setId: number) {
    try {
      await api.deleteSet(workoutId, setId)
      await loadWorkout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete set')
    }
  }

  async function handleDeleteWorkout() {
    try {
      await api.deleteWorkout(workoutId)
      onWorkoutDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout')
    }
  }

  if (!workout) {
    return (
      <div className="card">
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="detail-header">
        <div>
          <h3>{workout.name}</h3>
          <p className="muted">
            {workout.date} · {workout.type}
          </p>
        </div>
        <div>
          <button type="button" className="link-button" onClick={handleDeleteWorkout}>
            Delete workout
          </button>
          <button type="button" className="link-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <form className="entry-form set-form" onSubmit={handleAddSet}>
        <input
          placeholder="Exercise (e.g. Bench Press)"
          value={exerciseType}
          onChange={(event) => setExerciseType(event.target.value)}
          required
        />
        <input
          type="number"
          min="1"
          placeholder="Reps"
          value={reps}
          onChange={(event) => setReps(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="HH:MM:SS (optional)"
          pattern="^\d{2}:\d{2}:\d{2}$"
          value={timeSpent}
          onChange={(event) => setTimeSpent(event.target.value)}
        />
        <input
          type="number"
          min="0"
          placeholder="Calories (optional)"
          value={caloriesBurned}
          onChange={(event) => setCaloriesBurned(event.target.value)}
        />
        <button type="submit">Add set</button>
      </form>

      {workout.sets.length === 0 ? (
        <p className="empty-state">No sets logged yet.</p>
      ) : (
        <table className="sets-table">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Set</th>
              <th>Reps</th>
              <th>Time</th>
              <th>Calories</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {workout.sets.map((set) => (
              <tr key={set.id}>
                <td>{set.exercise_type}</td>
                <td>{set.set_number}</td>
                <td>{set.reps}</td>
                <td>{set.time_spent ?? '—'}</td>
                <td>{set.calories_burned ?? '—'}</td>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => handleDeleteSet(set.id)}
                    aria-label="Delete set"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
