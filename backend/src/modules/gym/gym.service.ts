import { gymRepository } from '@/modules/gym/gym.repository';
import { toGymDto, toPublicGymDto } from '@/modules/gym/gym.dto';
import { GymDto, GymRow, PublicGymDto, UpdateGymInput } from '@/modules/gym/gym.types';
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

  private static async getRowOrThrow(id: string): Promise<GymRow> {
    const row = await gymRepository.findById(id);
    if (!row) throw new NotFoundError('Gym not found', 'GYM_NOT_FOUND');
    return row;
  }
}
