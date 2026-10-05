import { supabase, createAuthClient } from '@/config/supabase';
import { profileRepository } from '@/modules/auth/auth.repository';
import { toProfileDto, toSessionDto } from '@/modules/auth/auth.dto';
import {
  AuthResult,
  LoginInput,
  ProfileDto,
  ProfileRow,
  RegisterInput,
  UpdateProfileInput,
} from '@/modules/auth/auth.types';
import { AccountStatus } from '@/shared/types';
import { Role } from '@/shared/rbac';
import { normalizeEmail } from '@/shared/utils';
import { PrivateMediaService } from '@/shared/services/private-media.service';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
} from '@/shared/errors';

/**
 * Authentication business logic. Supabase Auth owns credentials and tokens; this
 * service orchestrates auth calls and syncs the business profile. It never
 * stores, hashes or validates passwords itself.
 */
export class AuthService {
  /** Self-service customer registration. Returns a ready-to-use session. */
  static async register(input: RegisterInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });

    if (error || !data.user) {
      if (error?.message?.toLowerCase().includes('already')) {
        throw new ConflictError('Email is already registered', 'EMAIL_EXISTS');
      }
      throw new BadRequestError(error?.message ?? 'Registration failed', 'REGISTRATION_FAILED');
    }

    // The auth trigger creates the profile row; attach the optional phone.
    if (input.phone) {
      await profileRepository.update(data.user.id, { phone: input.phone });
    }

    return this.login({ email, password: input.password });
  }

  /** Email/password login. Returns tokens plus the business profile. */
  static async login(input: LoginInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);
    const existing = await profileRepository.findOneBy('email', email);
    
    if (!existing) {
      throw new UnauthorizedError('Account does not exist. Please contact your administrator.', 'ACCOUNT_NOT_FOUND');
    }

    const { data, error } = await createAuthClient().auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const profile = await profileRepository.findById(data.user.id);
    if (!profile) throw new UnauthorizedError('Profile not found', 'PROFILE_NOT_FOUND');
    if (profile.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active', 'ACCOUNT_INACTIVE');
    }

    return { session: toSessionDto(data.session), profile: await this.presentProfile(profile) };
  }

  static async refresh(refreshToken: string): Promise<AuthResult> {
    let result;
    try {
      result = await createAuthClient().auth.refreshSession({ refresh_token: refreshToken });
    } catch {
      throw new ServiceUnavailableError('Session refresh is temporarily unavailable. Please retry.', 'AUTH_PROVIDER_UNAVAILABLE');
    }
    const { data, error } = result;
    if (error && (isAuthRetryableFetchError(error) || error.status === 429 || (error.status ?? 0) >= 500)) {
      throw new ServiceUnavailableError('Session refresh is temporarily unavailable. Please retry.', 'AUTH_PROVIDER_UNAVAILABLE');
    }
    if (error || !data.user || !data.session?.access_token || !data.session.refresh_token) {
      throw new UnauthorizedError('Your session has expired. Please sign in again.', 'SESSION_EXPIRED');
    }
    const profile = await profileRepository.findById(data.user.id);
    if (!profile) throw new UnauthorizedError('Your session has expired. Please sign in again.', 'SESSION_EXPIRED');
    if (profile.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active', 'ACCOUNT_INACTIVE');
    }
    return { session: toSessionDto(data.session), profile: await this.presentProfile(profile) };
  }

  /** Best-effort session revocation. The client must also discard its tokens. */
  static async logout(accessToken: string): Promise<void> {
    try {
      await supabase.auth.admin.signOut(accessToken, 'global');
    } catch {
      // Revocation is best-effort; never fail logout.
    }
  }

  /** Trigger a password-reset email. Always succeeds to avoid user enumeration. */
  static async forgotPassword(email: string): Promise<void> {
    await createAuthClient().auth.resetPasswordForEmail(normalizeEmail(email));
  }

  /** Complete a password reset using the recovery access token. */
  static async resetPassword(accessToken: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
      password,
    });
    if (updateError) {
      throw new BadRequestError('Failed to reset password', 'RESET_FAILED');
    }
  }

  /**
   * Create a managed (non-self-service) account — an owner, staff or trainer —
   * and assign its role and gym. Used by admin onboarding and staff management.
   */
  static async createManagedUser(input: {
    email: string;
    password: string;
    fullName: string;
    role: Role;
    gymId: string;
  }): Promise<ProfileDto> {
    const email = normalizeEmail(input.email);
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });

    if (error || !data.user) {
      if (error?.message?.toLowerCase().includes('already')) {
        throw new ConflictError('Email is already registered', 'EMAIL_EXISTS');
      }
      throw new BadRequestError(error?.message ?? 'Failed to create user', 'USER_CREATE_FAILED');
    }

    const updated = await profileRepository.update(data.user.id, {
      role: input.role,
      gym_id: input.gymId,
      full_name: input.fullName,
    });
    if (!updated) throw new NotFoundError('Profile not found', 'PROFILE_NOT_FOUND');
    return toProfileDto(updated);
  }

  static async getProfile(userId: string): Promise<ProfileDto> {
    const profile = await profileRepository.findById(userId);
    if (!profile) throw new NotFoundError('Profile not found', 'PROFILE_NOT_FOUND');
    return this.presentProfile(profile);
  }

  private static async presentProfile(profile: ProfileRow): Promise<ProfileDto> {
    const dto = toProfileDto(profile);
    if (!dto.avatarPath) return { ...dto, avatarUrl: null, avatarUnavailable: Boolean(profile.avatar_url) };
    try {
      return { ...dto, avatarUrl: await PrivateMediaService.signedReadUrl(profile.id, dto.avatarPath, 'avatar') };
    } catch {
      // A private-media outage must not expose an object or prevent sign-in.
      return { ...dto, avatarUrl: null, avatarUnavailable: true };
    }
  }

  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileDto> {
    const patch: Partial<ProfileRow> = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
    if (input.avatarPath !== undefined) {
      if (input.avatarPath !== null) {
        await PrivateMediaService.signedReadUrl(userId, input.avatarPath, 'avatar');
      }
      patch.avatar_url = input.avatarPath;
    }
    const fields = {
      dateOfBirth: 'date_of_birth', gender: 'gender', weightKg: 'weight_kg', heightCm: 'height_cm',
      fitnessLevel: 'fitness_level', fitnessGoal: 'fitness_goal', trainingFrequency: 'training_frequency',
      locationAddress: 'location_address', gymPreference: 'gym_preference', hasHealthCondition: 'has_health_condition',
      healthConditions: 'health_conditions', dietaryPreference: 'dietary_preference', onboardingCompleted: 'onboarding_completed',
    } as const;
    for (const [inputKey, column] of Object.entries(fields)) {
      const value = input[inputKey as keyof typeof fields];
      if (value !== undefined) (patch as Record<string, unknown>)[column] = value;
    }
    if (input.healthDataConsent === true) {
      patch.health_data_consent_at = new Date().toISOString();
      patch.health_data_notice_version = 'fitness-profile-2026-10-04';
    } else if (input.healthDataConsent === false) {
      for (const column of ['weight_kg', 'height_cm', 'fitness_level', 'fitness_goal', 'training_frequency', 'has_health_condition', 'dietary_preference']) {
        (patch as Record<string, unknown>)[column] = null;
      }
      patch.health_conditions = [];
      patch.health_data_consent_at = null;
      patch.health_data_notice_version = null;
    }

    const updated = await profileRepository.update(userId, patch);
    if (!updated) throw new NotFoundError('Profile not found', 'PROFILE_NOT_FOUND');
    return this.presentProfile(updated);
  }

  /**
   * Self-service account deletion for authenticated user.
   * Deletes the user from Supabase Auth, which cascades through public.profiles and child records.
   */
  static async deleteAccount(userId: string): Promise<void> {
    const profile = await profileRepository.findById(userId);
    if (!profile) throw new NotFoundError('Profile not found', 'PROFILE_NOT_FOUND');

    if (profile.role === Role.SUPER_ADMIN) {
      throw new ForbiddenError('Super Admin accounts cannot be self-deleted', 'FORBIDDEN');
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    } catch {
      // Preserve the profile and access when Auth deletion fails. Deleting only
      // the profile would leave a surviving Auth account and report false success.
      throw new ServiceUnavailableError(
        'Account deletion could not be completed. Please try again.',
        'ACCOUNT_DELETION_FAILED',
      );
    }
  }

  /** Delete a user account (used for manual rollback on onboarding failures). */
  static async removeUser(userId: string): Promise<void> {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      throw new BadRequestError(error.message, 'USER_DELETE_FAILED');
    }
  }

  /** Trigger SMS OTP code generation via Supabase Auth OTP. */
  static async sendPhoneOtp(phone: string): Promise<{ message: string }> {
    const { error } = await createAuthClient().auth.signInWithOtp({
      phone,
    });

    if (error) {
      throw new BadRequestError(error.message ?? 'Failed to send OTP code', 'OTP_SEND_FAILED');
    }

    return { message: `OTP sent to ${phone}` };
  }

  /** Verify 6-digit OTP code and return session tokens + profile. */
  static async verifyPhoneOtp(phone: string, code: string): Promise<AuthResult> {
    const { data, error } = await createAuthClient().auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedError(error?.message ?? 'Invalid or expired OTP code', 'INVALID_OTP');
    }

    let profile = await profileRepository.findById(data.user.id);
    if (!profile) {
      const email = data.user.email || `${data.user.id}@phone.auraapex.invalid`;
      profile = await profileRepository.create({
        id: data.user.id,
        email,
        phone,
        full_name: (data.user.user_metadata?.full_name as string) || 'Member',
        role: Role.CUSTOMER,
        status: AccountStatus.ACTIVE,
      });
    }

    if (profile.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active', 'ACCOUNT_INACTIVE');
    }

    return { session: toSessionDto(data.session), profile: await this.presentProfile(profile) };
  }
}

