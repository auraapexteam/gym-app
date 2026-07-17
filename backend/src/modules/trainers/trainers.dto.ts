import { TrainerRow, TrainerDto } from '@/modules/trainers/trainers.types';

export const toTrainerDto = (row: TrainerRow): TrainerDto => ({
  id: row.id,
  gymId: row.gym_id,
  profileId: row.profile_id,
  fullName: row.full_name,
  specialization: row.specialization,
  bio: row.bio,
  phone: row.phone,
  email: row.email,
  imageUrl: row.image_url,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
