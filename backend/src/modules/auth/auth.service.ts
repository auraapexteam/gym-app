import { supabase, supabaseAnon } from '@/config/supabase';
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
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
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

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
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

    return { session: toSessionDto(data.session), profile: toProfileDto(profile) };
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
    await supabaseAnon.auth.resetPasswordForEmail(normalizeEmail(email));
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
    return toProfileDto(profile);
  }

  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileDto> {
    const patch: Partial<ProfileRow> = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;

    const updated = await profileRepository.update(userId, patch);
    if (!updated) throw new NotFoundError('Profile not found', 'PROFILE_NOT_FOUND');
    return toProfileDto(updated);
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

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      // Fallback: delete profile row directly if auth user deletion fails
      await profileRepository.delete(userId);
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
    const { error } = await supabaseAnon.auth.signInWithOtp({
      phone,
    });

    if (error) {
      throw new BadRequestError(error.message ?? 'Failed to send OTP code', 'OTP_SEND_FAILED');
    }

    return { message: `OTP sent to ${phone}` };
  }

  /** Verify 6-digit OTP code and return session tokens + profile. */
  static async verifyPhoneOtp(phone: string, code: string): Promise<AuthResult> {
    const { data, error } = await supabaseAnon.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedError(error?.message ?? 'Invalid or expired OTP code', 'INVALID_OTP');
    }

    let profile = await profileRepository.findById(data.user.id);
    if (!profile) {
      const email = data.user.email || `${phone.replace(/[^0-9]/g, '')}@phone.auraapex.internal`;
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

    return { session: toSessionDto(data.session), profile: toProfileDto(profile) };
  }
}

