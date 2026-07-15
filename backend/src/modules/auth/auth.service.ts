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
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: normalizeEmail(input.email),
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
}
