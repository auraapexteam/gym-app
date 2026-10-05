import { Role } from '@/shared/rbac';
import { AccountStatus } from '@/shared/types';

export interface ProfileRow {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  gym_id: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
  onboarding_completed?: boolean;
  date_of_birth?: string | null;
  gender?: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  fitness_level?: string | null;
  fitness_goal?: string | null;
  training_frequency?: string | null;
  location_address?: string | null;
  gym_preference?: string | null;
  has_health_condition?: boolean | null;
  health_conditions?: string[];
  dietary_preference?: string | null;
  health_data_consent_at?: string | null;
  health_data_notice_version?: string | null;
}

export interface ProfileDto {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  avatarPath?: string | null;
  avatarUnavailable?: boolean;
  role: Role;
  gymId: string | null;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
  dateOfBirth?: string | null;
  gender?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  fitnessLevel?: string | null;
  fitnessGoal?: string | null;
  trainingFrequency?: string | null;
  locationAddress?: string | null;
  gymPreference?: string | null;
  hasHealthCondition?: boolean | null;
  healthConditions?: string[];
  dietaryPreference?: string | null;
  healthDataConsentAt?: string | null;
  healthDataNoticeVersion?: string | null;
}

export interface SessionDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  tokenType: 'bearer';
}

export interface AuthResult {
  session: SessionDto;
  profile: ProfileDto;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  avatarPath?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  fitnessLevel?: string | null;
  fitnessGoal?: string | null;
  trainingFrequency?: string | null;
  locationAddress?: string | null;
  gymPreference?: string | null;
  hasHealthCondition?: boolean | null;
  healthConditions?: string[];
  dietaryPreference?: string | null;
  onboardingCompleted?: boolean;
  healthDataConsent?: boolean;
}

export interface SendPhoneOtpInput {
  phone: string;
}

export interface VerifyPhoneOtpInput {
  phone: string;
  code: string;
}

