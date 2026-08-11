import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { WORKOUT_TYPES, type WorkoutType, type WorkoutWithSets } from '../../api/types'
import { isoToMmDdYy, mmDdYyToIso } from '../../utils/date'

interface WorkoutDetailProps {
  workoutId: number
  onClose: () => void
  onWorkoutDeleted: () => void
  onWorkoutUpdated: () => void
}

export function WorkoutDetail({
  workoutId,
  onClose,
  onWorkoutDeleted,
  onWorkoutUpdated,
}: WorkoutDetailProps) {
  const [workout, setWorkout] = useState<WorkoutWithSets | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [exerciseType, setExerciseType] = useState('')
  const [reps, setReps] = useState('')
  const [timeSpent, setTimeSpent] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')

  const [isEditingWorkout, setIsEditingWorkout] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editType, setEditType] = useState<WorkoutType>('Lifting')

  const [editingSetId, setEditingSetId] = useState<number | null>(null)
  const [editReps, setEditReps] = useState('')
  const [editTimeSpent, setEditTimeSpent] = useState('')
  const [editCaloriesBurned, setEditCaloriesBurned] = useState('')

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

  function startEditWorkout() {
    if (!workout) return
    setEditName(workout.name)
    setEditDate(mmDdYyToIso(workout.date))
    setEditType(workout.type)
    setIsEditingWorkout(true)
  }

  function cancelEditWorkout() {
    setIsEditingWorkout(false)
  }

  async function handleSaveWorkout(event: React.FormEvent) {
    event.preventDefault()
    if (!editName || !editDate) return
    try {
      await api.updateWorkout(workoutId, {
        name: editName,
        date: isoToMmDdYy(editDate),
        type: editType,
      })
      setIsEditingWorkout(false)
      await loadWorkout()
      onWorkoutUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workout')
    }
  }

  function startEditSet(setId: number, currentReps: number, currentTime: string | null, currentCalories: number | null) {
    setEditingSetId(setId)
    setEditReps(String(currentReps))
    setEditTimeSpent(currentTime ?? '')
    setEditCaloriesBurned(currentCalories !== null ? String(currentCalories) : '')
  }

  function cancelEditSet() {
    setEditingSetId(null)
  }

  async function handleSaveSet(setId: number) {
    const parsedReps = Number(editReps)
    if (!editReps || Number.isNaN(parsedReps)) return
    try {
      await api.updateSet(workoutId, setId, {
        reps: parsedReps,
        time_spent: editTimeSpent || null,
        calories_burned: editCaloriesBurned ? Number(editCaloriesBurned) : null,
      })
      setEditingSetId(null)
      await loadWorkout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update set')
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
      {isEditingWorkout ? (
        <form className="entry-form" onSubmit={handleSaveWorkout}>
          <input
            placeholder="Workout name"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            required
          />
          <input
            type="date"
            value={editDate}
            onChange={(event) => setEditDate(event.target.value)}
            required
          />
          <select
            value={editType}
            onChange={(event) => setEditType(event.target.value as WorkoutType)}
          >
            {WORKOUT_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="row-actions">
            <button type="submit" className="link-button">
              Save
            </button>
            <button type="button" className="link-button" onClick={cancelEditWorkout}>
              Cancel
            </button>
          </span>
        </form>
      ) : (
        <div className="detail-header">
          <div>
            <h3>{workout.name}</h3>
            <p className="muted">
              {workout.date} · {workout.type}
            </p>
          </div>
          <div>
            <button type="button" className="link-button" onClick={startEditWorkout}>
              Edit workout
            </button>
            <button type="button" className="link-button" onClick={handleDeleteWorkout}>
              Delete workout
            </button>
            <button type="button" className="link-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      )}

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
            {workout.sets.map((set) =>
              editingSetId === set.id ? (
                <tr key={set.id}>
                  <td>{set.exercise_type}</td>
                  <td>{set.set_number}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      autoFocus
                      value={editReps}
                      onChange={(event) => setEditReps(event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="HH:MM:SS"
                      pattern="^\d{2}:\d{2}:\d{2}$"
                      value={editTimeSpent}
                      onChange={(event) => setEditTimeSpent(event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={editCaloriesBurned}
                      onChange={(event) => setEditCaloriesBurned(event.target.value)}
                    />
                  </td>
                  <td>
                    <span className="row-actions">
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => handleSaveSet(set.id)}
                      >
                        Save
                      </button>
                      <button type="button" className="link-button" onClick={cancelEditSet}>
                        Cancel
                      </button>
                    </span>
                  </td>
                </tr>
              ) : (
                <tr key={set.id}>
                  <td>{set.exercise_type}</td>
                  <td>{set.set_number}</td>
                  <td>{set.reps}</td>
                  <td>{set.time_spent ?? '—'}</td>
                  <td>{set.calories_burned ?? '—'}</td>
                  <td>
                    <span className="row-actions">
                      <button
                        type="button"
                        className="link-button"
                        onClick={() =>
                          startEditSet(set.id, set.reps, set.time_spent, set.calories_burned)
                        }
                        aria-label="Edit set"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => handleDeleteSet(set.id)}
                        aria-label="Delete set"
                      >
                        Delete
                      </button>
                    </span>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
