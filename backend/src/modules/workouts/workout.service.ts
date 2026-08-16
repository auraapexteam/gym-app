import { workoutRepository } from '@/modules/workouts/workout.repository';
import { toWorkoutLogDto } from '@/modules/workouts/workout.dto';
import { CreateWorkoutLogInput, WorkoutLogDto } from '@/modules/workouts/workout.types';

export class WorkoutService {
  /** Fetch workout history for a user. */
  static async listHistory(
    profileId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<WorkoutLogDto[]> {
    const rows = await workoutRepository.findHistoryByProfile(profileId, limit, offset);
    return rows.map(toWorkoutLogDto);
  }

  /** Record a detailed workout log entry. */
  static async logWorkout(
    profileId: string,
    input: CreateWorkoutLogInput,
  ): Promise<WorkoutLogDto> {
    const logDate = input.logDate || new Date().toISOString().split('T')[0];
    const exercises = input.exercises || [];
    const exercisesCount = input.exercisesCount !== undefined ? input.exercisesCount : exercises.length;

    const row = await workoutRepository.create({
      profile_id: profileId,
      workout_name: input.workoutName,
      category: input.category,
      duration_min: input.durationMin,
      calories_burned: input.caloriesBurned ?? 0,
      exercises_count: exercisesCount,
      exercises: exercises,
      log_date: logDate,
    });

    return toWorkoutLogDto(row);
  }
}
