import { GymRow, GymDto, PublicGymDto } from '@/modules/gym/gym.types';

export const toGymDto = (row: GymRow): GymDto => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  email: row.email,
  phone: row.phone,
  address: row.address,
  description: row.description,
  logoUrl: row.logo_url,
  status: row.status,
  timings: row.timings ?? {},
  weeklyOff: row.weekly_off ?? [],
  settings: row.settings ?? {},
  ownerId: row.owner_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toPublicGymDto = (row: GymRow): PublicGymDto => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  address: row.address,
  description: row.description,
  logoUrl: row.logo_url,
  timings: row.timings ?? {},
  weeklyOff: row.weekly_off ?? [],
  status: row.status,
});
