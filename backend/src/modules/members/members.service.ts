import { memberRepository } from '@/modules/members/members.repository';
import { toMemberDto } from '@/modules/members/members.dto';
import {
  CreateMemberInput,
  MemberDto,
  MemberRow,
  UpdateMemberInput,
} from '@/modules/members/members.types';
import { ListQuery, PaginatedResult } from '@/shared/types';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { normalizeEmail } from '@/shared/utils';

/**
 * Business logic for gym members. Framework-agnostic and reusable from REST,
 * cron jobs or future interfaces. Always tenant-scoped by `gymId`.
 */
export class MemberService {
  /** Paginated, searchable member list scoped to a gym. */
  static async list(
    gymId: string,
    query: ListQuery,
    status?: string,
  ): Promise<PaginatedResult<MemberDto>> {
    const result = await memberRepository.findMany({
      gymId,
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
      searchColumns: ['full_name', 'email', 'phone'],
      filters: status ? { status } : undefined,
    });

    return { ...result, items: result.items.map(toMemberDto) };
  }

  /** Fetch a single member or throw 404. */
  static async getById(gymId: string, id: string): Promise<MemberDto> {
    const row = await this.getRowOrThrow(gymId, id);
    return toMemberDto(row);
  }

  /** Create a new member, enforcing per-gym email uniqueness. */
  static async create(gymId: string, input: CreateMemberInput): Promise<MemberDto> {
    const email = input.email ? normalizeEmail(input.email) : null;
    if (email) {
      const existing = await memberRepository.findByEmail(gymId, email);
      if (existing) {
        throw new ConflictError('A member with this email already exists', 'MEMBER_EMAIL_EXISTS');
      }
    }

    const row = await memberRepository.create({
      gym_id: gymId,
      profile_id: input.profileId ?? null,
      full_name: input.fullName,
      email,
      phone: input.phone ?? null,
      gender: input.gender ?? null,
      date_of_birth: input.dateOfBirth ?? null,
      address: input.address ?? null,
      emergency_contact: input.emergencyContact ?? null,
      notes: input.notes ?? null,
    });

    return toMemberDto(row);
  }

  /** Patch an existing member. */
  static async update(gymId: string, id: string, input: UpdateMemberInput): Promise<MemberDto> {
    await this.getRowOrThrow(gymId, id);

    const patch: Partial<MemberRow> = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.email !== undefined) patch.email = input.email ? normalizeEmail(input.email) : null;
    if (input.phone !== undefined) patch.phone = input.phone ?? null;
    if (input.gender !== undefined) patch.gender = input.gender ?? null;
    if (input.dateOfBirth !== undefined) patch.date_of_birth = input.dateOfBirth ?? null;
    if (input.address !== undefined) patch.address = input.address ?? null;
    if (input.emergencyContact !== undefined) patch.emergency_contact = input.emergencyContact ?? null;
    if (input.notes !== undefined) patch.notes = input.notes ?? null;
    if (input.status !== undefined) patch.status = input.status;

    const updated = await memberRepository.update(id, patch, gymId);
    if (!updated) throw new NotFoundError('Member not found', 'MEMBER_NOT_FOUND');
    return toMemberDto(updated);
  }

  /** Soft-delete a member. */
  static async remove(gymId: string, id: string): Promise<void> {
    await this.getRowOrThrow(gymId, id);
    await memberRepository.remove(id, gymId);
  }

  /** Ids of every member record linked to a profile (across all gyms). */
  static listMemberIdsForProfile(profileId: string): Promise<string[]> {
    return memberRepository.findIdsByProfile(profileId);
  }

  /**
   * Find or lazily create the member record for an app user in a gym. Used by
   * customer-facing flows (subscriptions, attendance) that operate on a member.
   */
  static async resolveForProfile(
    gymId: string,
    profileId: string,
    fallback: { fullName: string; email?: string; phone?: string },
  ): Promise<MemberRow> {
    const existing = await memberRepository.findByProfile(gymId, profileId);
    if (existing) return existing;

    return memberRepository.create({
      gym_id: gymId,
      profile_id: profileId,
      full_name: fallback.fullName,
      email: fallback.email ? normalizeEmail(fallback.email) : null,
      phone: fallback.phone ?? null,
    });
  }

  private static async getRowOrThrow(gymId: string, id: string): Promise<MemberRow> {
    const row = await memberRepository.findById(id, gymId);
    if (!row) throw new NotFoundError('Member not found', 'MEMBER_NOT_FOUND');
    return row;
  }
}
