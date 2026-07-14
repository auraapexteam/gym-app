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
}

export const gymRepository = new GymRepository();
