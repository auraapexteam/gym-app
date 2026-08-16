import { BaseRepository } from '@/shared/repositories';
import { WorkoutLogRow } from '@/modules/workouts/workout.types';

const WORKOUT_COLUMNS =
  'id, profile_id, workout_name, category, duration_min, calories_burned, ' +
  'exercises_count, exercises, log_date, created_at, updated_at';

export class WorkoutRepository extends BaseRepository<WorkoutLogRow> {
  constructor() {
    super('workout_logs', {
      softDelete: false,
      defaultSelect: WORKOUT_COLUMNS,
      tenantColumn: 'profile_id',
    });
  }

  /** List chronological workout history for a profile. */
  async findHistoryByProfile(
    profileId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<WorkoutLogRow[]> {
    const { data, error } = await this.client
      .from('workout_logs')
      .select(WORKOUT_COLUMNS)
      .eq('profile_id', profileId)
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) this.fail('Failed to fetch workout history', error);
    return (data as unknown as WorkoutLogRow[]) ?? [];
  }
}

export const workoutRepository = new WorkoutRepository();
