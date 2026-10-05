import { BaseRepository } from '@/shared/repositories';
import { ProfileRow } from '@/modules/auth/auth.types';

const PROFILE_COLUMNS =
  'id, email, phone, full_name, avatar_url, role, gym_id, status, created_at, updated_at, ' +
  'onboarding_completed, date_of_birth, gender, weight_kg, height_cm, fitness_level, fitness_goal, ' +
  'training_frequency, location_address, gym_preference, has_health_condition, health_conditions, dietary_preference, ' +
  'health_data_consent_at, health_data_notice_version';

/**
 * Persistence for profiles. A profile is keyed by the Supabase auth user id, so
 * it is addressed directly (not gym-scoped).
 */
export class ProfileRepository extends BaseRepository<ProfileRow> {
  constructor() {
    super('profiles', { softDelete: false, defaultSelect: PROFILE_COLUMNS, tenantColumn: 'id' });
  }
}

export const profileRepository = new ProfileRepository();
