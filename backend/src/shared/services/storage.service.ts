import { supabase } from '@/config/supabase';
import { env } from '@/config/env';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@/config/constants';
import { BadRequestError, ServiceUnavailableError } from '@/shared/errors';

export interface SignedUploadTarget {
  bucket: string;
  path: string;
  /** Pre-signed URL the client uploads the binary to directly. */
  signedUrl: string;
  token: string;
}

/**
 * Thin wrapper around Supabase Storage.
 *
 * Binary data never flows through Express or PostgreSQL. Clients request a
 * signed upload URL, upload the file directly to object storage, then register
 * the resulting metadata through the gallery module. This keeps the API stateless
 * and fast regardless of file size.
 */
export class StorageService {
  static readonly bucket = env.SUPABASE_STORAGE_BUCKET;

  /** Validate an image's declared MIME type and size before issuing an upload URL. */
  static assertValidImage(mimeType: string, size: number): void {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      throw new BadRequestError('Unsupported image type', 'UNSUPPORTED_MEDIA_TYPE');
    }
    if (size <= 0 || size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestError('File exceeds the maximum allowed size', 'FILE_TOO_LARGE');
    }
  }

  /** Create a pre-signed URL the client uses to upload directly to storage. */
  static async createSignedUploadUrl(path: string): Promise<SignedUploadTarget> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new ServiceUnavailableError('Failed to create upload URL', 'STORAGE_UNAVAILABLE');
    }

    return { bucket: this.bucket, path: data.path, signedUrl: data.signedUrl, token: data.token };
  }

  /** Resolve the public URL for a stored object. */
  static getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /** Permanently remove an object from storage. */
  static async remove(path: string): Promise<void> {
    const { error } = await supabase.storage.from(this.bucket).remove([path]);
    if (error) {
      throw new ServiceUnavailableError('Failed to delete file', 'STORAGE_UNAVAILABLE');
    }
  }
}
