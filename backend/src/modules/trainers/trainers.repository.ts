import { BaseRepository } from '@/shared/repositories';
import { TrainerRow } from '@/modules/trainers/trainers.types';

const TRAINER_COLUMNS =
  'id, gym_id, profile_id, full_name, specialization, bio, phone, email, ' +
  'image_url, status, created_at, updated_at';

export class TrainerRepository extends BaseRepository<TrainerRow> {
  constructor() {
    super('trainers', { softDelete: true, defaultSelect: TRAINER_COLUMNS });
  }
}

export const trainerRepository = new TrainerRepository();
