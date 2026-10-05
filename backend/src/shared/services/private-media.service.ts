import { supabase } from '@/config/supabase';
import { env } from '@/config/env';
import { BadRequestError, ForbiddenError, ServiceUnavailableError } from '@/shared/errors';
import { SignedUploadTarget } from '@/shared/services/storage.service';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@/config/constants';

/** Personal media must never share the public gym-marketing bucket. */
export class PrivateMediaService {
  static readonly bucket = env.SUPABASE_PERSONAL_STORAGE_BUCKET;
  static readonly expiresIn = 300;

  static assertOwnedPath(profileId: string, path: string, purpose?: 'avatar' | 'progress-photo'): void {
    if (!path.startsWith(`personal/${profileId}/`)) {
      throw new ForbiddenError('This file does not belong to your account', 'MEDIA_FORBIDDEN');
    }
    const parts = path.split('/');
    if (parts.length !== 4 || !['avatar', 'progress-photo'].includes(parts[2]) ||
        (purpose && parts[2] !== purpose) || !/^[a-zA-Z0-9_-]+-[a-zA-Z0-9._-]+$/.test(parts[3]) ||
        path.length > 500) {
      throw new BadRequestError('Invalid personal file path', 'INVALID_MEDIA_PATH');
    }
  }

  static async assertPrivateBucket(): Promise<void> {
    const { data, error } = await supabase.storage.getBucket(this.bucket);
    const sizeLimit = Number(data?.file_size_limit);
    const allowedTypes = data?.allowed_mime_types;
    if (error || !data || data.public !== false || this.bucket === env.SUPABASE_STORAGE_BUCKET ||
        !Number.isFinite(sizeLimit) || sizeLimit <= 0 || sizeLimit > MAX_UPLOAD_SIZE_BYTES ||
        !allowedTypes?.length || allowedTypes.some(type => !ALLOWED_IMAGE_MIME_TYPES.includes(type as any))) {
      throw new ServiceUnavailableError('Private file storage is unavailable', 'PRIVATE_STORAGE_UNAVAILABLE');
    }
  }

  static async createSignedUploadUrl(profileId: string, path: string): Promise<SignedUploadTarget> {
    this.assertOwnedPath(profileId, path);
    await this.assertPrivateBucket();
    const { data, error } = await supabase.storage.from(this.bucket).createSignedUploadUrl(path);
    if (error || !data) throw new ServiceUnavailableError('Unable to prepare private upload', 'PRIVATE_STORAGE_UNAVAILABLE');
    return { bucket: this.bucket, path, signedUrl: data.signedUrl, token: data.token };
  }

  static async signedReadUrl(profileId: string, path: string, purpose?: 'avatar' | 'progress-photo'): Promise<string> {
    this.assertOwnedPath(profileId, path, purpose);
    await this.assertPrivateBucket();
    const { data, error } = await supabase.storage.from(this.bucket).createSignedUrl(path, this.expiresIn);
    if (error || !data?.signedUrl) throw new ServiceUnavailableError('Unable to load private file', 'PRIVATE_STORAGE_UNAVAILABLE');
    return data.signedUrl;
  }
}
