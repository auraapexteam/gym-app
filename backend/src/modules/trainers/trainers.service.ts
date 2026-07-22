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
import { AuthService } from '@/modules/auth/auth.service';
import { Role } from '@/shared/rbac/roles';
import { supabase } from '@/config/supabase';

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
    let profileId = input.profileId ?? null;
    let createdProfileId: string | null = null;

    try {
      if (input.email && input.password) {
        const profile = await AuthService.createManagedUser({
          email: input.email,
          password: input.password,
          fullName: input.fullName,
          role: Role.TRAINER,
          gymId,
        });
        profileId = profile.id;
        createdProfileId = profile.id;
      }

      const row = await trainerRepository.create({
        gym_id: gymId,
        profile_id: profileId,
        full_name: input.fullName,
        specialization: input.specialization ?? null,
        bio: input.bio ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        image_url: input.imageUrl ?? null,
      });
      return toTrainerDto(row);
    } catch (err) {
      if (createdProfileId) {
        await AuthService.removeUser(createdProfileId);
      }
      throw err;
    }
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
    const trainer = await this.getRowOrThrow(gymId, id);
    await trainerRepository.remove(id, gymId);

    if (trainer.profile_id) {
      await supabase.auth.admin.deleteUser(trainer.profile_id);
    }
  }

  private static async getRowOrThrow(gymId: string, id: string): Promise<TrainerRow> {
    const row = await trainerRepository.findById(id, gymId);
    if (!row) throw new NotFoundError('Trainer not found', 'TRAINER_NOT_FOUND');
    return row;
  }
}

