import type { ExerciseSet, WeightEntry, Workout, WorkoutType, WorkoutWithSets } from './types'

const API_BASE = '/api'

interface ApiErrorBody {
  message?: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(body.message ?? `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function toQueryString(params?: Record<string, string | undefined>): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, value]) => value !== undefined) as [
    string,
    string,
  ][]
  if (entries.length === 0) return ''
  return `?${new URLSearchParams(entries).toString()}`
}

export const api = {
  listWeightEntries(params?: { from?: string; to?: string }) {
    return request<WeightEntry[]>(`/weight-entries${toQueryString(params)}`)
  },
  createWeightEntry(payload: { weight_lbs: number; timestamp?: string }) {
    return request<WeightEntry>('/weight-entries', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  updateWeightEntry(id: number, payload: { weight_lbs?: number; timestamp?: string }) {
    return request<WeightEntry>(`/weight-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  deleteWeightEntry(id: number) {
    return request<void>(`/weight-entries/${id}`, { method: 'DELETE' })
  },

  listWorkouts(params?: { from?: string; to?: string; type?: WorkoutType }) {
    return request<Workout[]>(`/workouts${toQueryString(params)}`)
  },
  getWorkout(id: number) {
    return request<WorkoutWithSets>(`/workouts/${id}`)
  },
  createWorkout(payload: { name: string; date: string; type: WorkoutType }) {
    return request<Workout>('/workouts', { method: 'POST', body: JSON.stringify(payload) })
  },
  updateWorkout(id: number, payload: { name?: string; date?: string; type?: WorkoutType }) {
    return request<Workout>(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  deleteWorkout(id: number) {
    return request<void>(`/workouts/${id}`, { method: 'DELETE' })
  },

  createSet(
    workoutId: number,
    payload: { exercise_type: string; reps: number; time_spent?: string; calories_burned?: number },
  ) {
    return request<ExerciseSet>(`/workouts/${workoutId}/sets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  updateSet(
    workoutId: number,
    setId: number,
    payload: { reps?: number; time_spent?: string | null; calories_burned?: number | null },
  ) {
    return request<ExerciseSet>(`/workouts/${workoutId}/sets/${setId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  deleteSet(workoutId: number, setId: number) {
    return request<void>(`/workouts/${workoutId}/sets/${setId}`, { method: 'DELETE' })
  },
}
