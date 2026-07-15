import { BaseRepository } from '@/shared/repositories';
import { ProfileRow } from '@/modules/auth/auth.types';

const PROFILE_COLUMNS =
  'id, email, phone, full_name, avatar_url, role, gym_id, status, created_at, updated_at';

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
