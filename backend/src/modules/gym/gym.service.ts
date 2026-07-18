import { gymRepository } from '@/modules/gym/gym.repository';
import { toGymDto, toPublicGymDto } from '@/modules/gym/gym.dto';
import {
  CreateGymInput,
  GymDto,
  GymRow,
  GymStatus,
  PublicGymDto,
  UpdateGymInput,
} from '@/modules/gym/gym.types';
import { ListQuery, PaginatedResult } from '@/shared/types';
import { NotFoundError } from '@/shared/errors';

/** Business logic for the gym (tenant) profile, timings and settings. */
export class GymService {
  static async getById(id: string): Promise<GymDto> {
    return toGymDto(await this.getRowOrThrow(id));
  }

  static async getPublicById(id: string): Promise<PublicGymDto> {
    return toPublicGymDto(await this.getRowOrThrow(id));
  }

  static async update(id: string, input: UpdateGymInput): Promise<GymDto> {
    await this.getRowOrThrow(id);

    const patch: Partial<GymRow> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.email !== undefined) patch.email = input.email;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.address !== undefined) patch.address = input.address;
    if (input.description !== undefined) patch.description = input.description;
    if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
    if (input.timings !== undefined) patch.timings = input.timings;
    if (input.weeklyOff !== undefined) patch.weekly_off = input.weeklyOff;
    if (input.settings !== undefined) patch.settings = input.settings;

    const updated = await gymRepository.update(id, patch);
    if (!updated) throw new NotFoundError('Gym not found', 'GYM_NOT_FOUND');
    return toGymDto(updated);
  }

  // --- Platform-admin operations (used by the admin module) -----------------

  /** Provision a new gym (super-admin onboarding). */
  static async createGym(input: CreateGymInput): Promise<GymDto> {
    const row = await gymRepository.create({
      name: input.name,
      slug: input.slug ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      description: input.description ?? null,
      status: input.status ?? 'active',
    });
    return toGymDto(row);
  }

  /** List every gym on the platform (super admin only). */
  static async listAll(query: ListQuery, status?: string): Promise<PaginatedResult<GymDto>> {
    const result = await gymRepository.findMany({
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
      searchColumns: ['name', 'email', 'slug'],
      filters: status ? { status } : undefined,
    });
    return { ...result, items: result.items.map(toGymDto) };
  }

  /** Change a gym's lifecycle status (approve / suspend / activate). */
  static async setStatus(id: string, status: GymStatus): Promise<GymDto> {
    await this.getRowOrThrow(id);
    const updated = await gymRepository.update(id, { status });
    if (!updated) throw new NotFoundError('Gym not found', 'GYM_NOT_FOUND');
    return toGymDto(updated);
  }

  /** Assign an owner profile to a gym. */
  static async assignOwner(gymId: string, ownerId: string): Promise<void> {
    await gymRepository.update(gymId, { owner_id: ownerId });
  }

  private static async getRowOrThrow(id: string): Promise<GymRow> {
    const row = await gymRepository.findById(id);
    if (!row) throw new NotFoundError('Gym not found', 'GYM_NOT_FOUND');
    return row;
  }
}
