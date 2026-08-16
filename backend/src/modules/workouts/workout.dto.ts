import { WorkoutLogRow, WorkoutLogDto } from '@/modules/workouts/workout.types';

export const toWorkoutLogDto = (row: WorkoutLogRow): WorkoutLogDto => ({
  id: row.id,
  workoutName: row.workout_name,
  category: row.category,
  durationMin: row.duration_min,
  caloriesBurned: row.calories_burned ?? 0,
  exercisesCount: row.exercises_count ?? (Array.isArray(row.exercises) ? row.exercises.length : 0),
  exercises: Array.isArray(row.exercises) ? row.exercises : [],
  logDate: row.log_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
