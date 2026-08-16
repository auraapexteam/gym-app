export interface ExerciseDetail {
  name: string;
  sets?: number;
  reps?: number;
  weightKg?: number;
  notes?: string;
}

export interface WorkoutLogRow {
  id: string;
  profile_id: string;
  workout_name: string;
  category: string;
  duration_min: number;
  calories_burned: number;
  exercises_count: number;
  exercises: ExerciseDetail[];
  log_date: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutLogDto {
  id: string;
  workoutName: string;
  category: string;
  durationMin: number;
  caloriesBurned: number;
  exercisesCount: number;
  exercises: ExerciseDetail[];
  logDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkoutLogInput {
  workoutName: string;
  category: string;
  durationMin: number;
  caloriesBurned?: number;
  exercisesCount?: number;
  exercises?: ExerciseDetail[];
  logDate?: string;
}
