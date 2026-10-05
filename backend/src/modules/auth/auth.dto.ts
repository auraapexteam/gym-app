import { Session } from '@supabase/supabase-js';
import { ProfileRow, ProfileDto, SessionDto } from '@/modules/auth/auth.types';

export const toProfileDto = (row: ProfileRow): ProfileDto => ({
  id: row.id,
  email: row.email,
  phone: row.phone,
  fullName: row.full_name,
  avatarUrl: row.avatar_url,
  avatarPath: row.avatar_url?.startsWith(`personal/${row.id}/avatar/`) ? row.avatar_url : null,
  role: row.role,
  gymId: row.gym_id,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  onboardingCompleted: row.onboarding_completed ?? true,
  dateOfBirth: row.date_of_birth ?? null,
  gender: row.gender ?? null,
  weightKg: row.weight_kg ?? null,
  heightCm: row.height_cm ?? null,
  fitnessLevel: row.fitness_level ?? null,
  fitnessGoal: row.fitness_goal ?? null,
  trainingFrequency: row.training_frequency ?? null,
  locationAddress: row.location_address ?? null,
  gymPreference: row.gym_preference ?? null,
  hasHealthCondition: row.has_health_condition ?? null,
  healthConditions: row.health_conditions ?? [],
  dietaryPreference: row.dietary_preference ?? null,
  healthDataConsentAt: row.health_data_consent_at ?? null,
  healthDataNoticeVersion: row.health_data_notice_version ?? null,
});

export const toSessionDto = (session: Session): SessionDto => ({
  accessToken: session.access_token,
  refreshToken: session.refresh_token,
  expiresAt: session.expires_at ?? null,
  tokenType: 'bearer',
});
