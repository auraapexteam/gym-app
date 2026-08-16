import { BaseRepository } from '@/shared/repositories';
import { GymRow } from '@/modules/gym/gym.types';

const GYM_COLUMNS =
  'id, name, slug, email, phone, address, description, logo_url, status, ' +
  'timings, weekly_off, settings, owner_id, created_at, updated_at';

/**
 * Persistence for gyms (the tenant root). Gyms are not tenant-scoped; a gym is
 * addressed directly by its id.
 */
export class GymRepository extends BaseRepository<GymRow> {
  constructor() {
    super('gyms', { softDelete: false, defaultSelect: GYM_COLUMNS, tenantColumn: 'id' });
  }

  findBySlug(slug: string): Promise<GymRow | null> {
    return this.findOneBy('slug', slug);
  }

  /** List gyms bookmarked by a user profile. */
  async listSavedByProfile(profileId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('saved_gyms')
      .select('id, gym_id, created_at, gyms(id, name, slug, email, phone, address, description, logo_url, status, timings, weekly_off)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) this.fail('Failed to list saved gyms', error);
    return data ?? [];
  }

  /** Check if a gym is bookmarked by a user. */
  async isGymSaved(profileId: string, gymId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('saved_gyms')
      .select('id')
      .eq('profile_id', profileId)
      .eq('gym_id', gymId)
      .maybeSingle();

    if (error) this.fail('Failed to check saved gym status', error);
    return !!data;
  }

  /** Bookmark/save a gym. */
  async addBookmark(profileId: string, gymId: string): Promise<any> {
    const { data, error } = await this.client
      .from('saved_gyms')
      .upsert({ profile_id: profileId, gym_id: gymId }, { onConflict: 'profile_id,gym_id' })
      .select()
      .single();

    if (error) this.fail('Failed to bookmark gym', error);
    return data;
  }

  /** Remove a bookmark. */
  async removeBookmark(profileId: string, gymId: string): Promise<void> {
    const { error } = await this.client
      .from('saved_gyms')
      .delete()
      .eq('profile_id', profileId)
      .eq('gym_id', gymId);

    if (error) this.fail('Failed to remove gym bookmark', error);
  }
}

export const gymRepository = new GymRepository();

