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
}

export interface ProfileDto {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
  gymId: string | null;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
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
  phone?: string;
  avatarUrl?: string;
}

export interface SendPhoneOtpInput {
  phone: string;
}

export interface VerifyPhoneOtpInput {
  phone: string;
  code: string;
}

