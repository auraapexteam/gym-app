import { trainerRepository } from '@/modules/trainers/trainers.repository';
import { toTrainerDto } from '@/modules/trainers/trainers.dto';
import {
  CreateTrainerInput,
  TrainerDto,
  TrainerRow,
  UpdateTrainerInput,
} from '@/modules/trainers/trainers.types';
import { ListQuery, PaginatedResult } from '@/shared/types';
import { NotFoundError } from '@/shared/errors';

/** Business logic for trainers. Trainers never own customers. */
export class TrainerService {
  static async list(
    gymId: string,
    query: ListQuery,
    status?: string,
  ): Promise<PaginatedResult<TrainerDto>> {
    const result = await trainerRepository.findMany({
      gymId,
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
      searchColumns: ['full_name', 'specialization', 'email'],
      filters: status ? { status } : undefined,
    });
    return { ...result, items: result.items.map(toTrainerDto) };
  }

  static async getById(gymId: string, id: string): Promise<TrainerDto> {
    return toTrainerDto(await this.getRowOrThrow(gymId, id));
  }

  static async create(gymId: string, input: CreateTrainerInput): Promise<TrainerDto> {
    const row = await trainerRepository.create({
      gym_id: gymId,
      profile_id: input.profileId ?? null,
      full_name: input.fullName,
      specialization: input.specialization ?? null,
      bio: input.bio ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      image_url: input.imageUrl ?? null,
    });
    return toTrainerDto(row);
  }

  static async update(gymId: string, id: string, input: UpdateTrainerInput): Promise<TrainerDto> {
    await this.getRowOrThrow(gymId, id);
    const patch: Partial<TrainerRow> = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.specialization !== undefined) patch.specialization = input.specialization ?? null;
    if (input.bio !== undefined) patch.bio = input.bio ?? null;
    if (input.phone !== undefined) patch.phone = input.phone ?? null;
    if (input.email !== undefined) patch.email = input.email ?? null;
    if (input.imageUrl !== undefined) patch.image_url = input.imageUrl ?? null;
    if (input.profileId !== undefined) patch.profile_id = input.profileId ?? null;
    if (input.status !== undefined) patch.status = input.status;

    const updated = await trainerRepository.update(id, patch, gymId);
    if (!updated) throw new NotFoundError('Trainer not found', 'TRAINER_NOT_FOUND');
    return toTrainerDto(updated);
  }

  static async remove(gymId: string, id: string): Promise<void> {
    await this.getRowOrThrow(gymId, id);
    await trainerRepository.remove(id, gymId);
  }

  private static async getRowOrThrow(gymId: string, id: string): Promise<TrainerRow> {
    const row = await trainerRepository.findById(id, gymId);
    if (!row) throw new NotFoundError('Trainer not found', 'TRAINER_NOT_FOUND');
    return row;
  }
}
