import { BaseRepository } from '@/shared/repositories';
import { MemberRow } from '@/modules/members/members.types';

const MEMBER_COLUMNS =
  'id, gym_id, profile_id, full_name, email, phone, gender, date_of_birth, ' +
  'address, emergency_contact, status, joined_at, notes, created_at, updated_at';

/**
 * Persistence for gym members. Extends the tenant-aware base repository and
 * adds only intent-revealing lookups. No business rules live here.
 */
export class MemberRepository extends BaseRepository<MemberRow> {
  constructor() {
    super('members', { softDelete: true, defaultSelect: MEMBER_COLUMNS });
  }

  /** Find an active member by email within a gym. */
  findByEmail(gymId: string, email: string): Promise<MemberRow | null> {
    return this.findOneBy('email', email, gymId);
  }

  /** Find the member linked to a given app profile within a gym. */
  findByProfile(gymId: string, profileId: string): Promise<MemberRow | null> {
    return this.findOneBy('profile_id', profileId, gymId);
  }

  /** Ids of every (non-deleted) member linked to a profile across all gyms. */
  async findIdsByProfile(profileId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('members')
      .select('id')
      .eq('profile_id', profileId)
      .is('deleted_at', null);
    if (error) this.fail('Failed to load members by profile', error);
    return ((data as { id: string }[]) ?? []).map((row) => row.id);
  }
}

export const memberRepository = new MemberRepository();
