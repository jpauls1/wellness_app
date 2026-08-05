export type WorkoutType = 'Lifting' | 'Cardio' | 'HIIT' | 'Yoga' | 'Combo' | 'Other'

export const WORKOUT_TYPES: WorkoutType[] = [
  'Lifting',
  'Cardio',
  'HIIT',
  'Yoga',
  'Combo',
  'Other',
]

export interface WeightEntry {
  id: number
  weight_lbs: number
  timestamp: string
}

export interface ExerciseSet {
  id: number
  workout_id: number
  exercise_type: string
  set_number: number
  reps: number
  time_spent: string | null
  calories_burned: number | null
  created_at: string
}

export interface Workout {
  id: number
  name: string
  date: string
  type: WorkoutType
  created_at: string
}

export interface WorkoutWithSets extends Workout {
  sets: ExerciseSet[]
}
