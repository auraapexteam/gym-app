import { GymRow, GymDto, PublicGymDto, SavedGymDto } from '@/modules/gym/gym.types';

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

export const toSavedGymDto = (row: any, savedAt?: string): SavedGymDto => ({
  id: row.id,
  name: row.name,
  slug: row.slug ?? null,
  address: row.address ?? null,
  description: row.description ?? null,
  logoUrl: row.logo_url ?? null,
  imageUrl: row.logo_url ?? null,
  rating: 4.8,
  monthlyPrice: row.monthly_price ?? (row.plans && row.plans[0] ? Number(row.plans[0].price) : null),
  timings: row.timings ?? {},
  weeklyOff: row.weekly_off ?? [],
  status: row.status ?? 'active',
  savedAt: savedAt || row.created_at || new Date().toISOString(),
});

