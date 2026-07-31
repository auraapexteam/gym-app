import { StorageService } from '@/shared/services';
import { generateOpaqueToken } from '@/shared/utils';
import { CreateSignedUploadUrlInput, SignedUploadUrlDto } from '@/modules/uploads/uploads.types';

/**
 * Personal (non-gym-scoped) uploads for the authenticated user — profile
 * avatars and progress-log photos. Namespaced under `personal/{profileId}/...`
 * so no user can guess or overwrite another user's objects, independent of
 * the gym-scoped gallery module.
 */
export class UploadsService {
  static async createSignedUploadUrl(
    profileId: string,
    input: CreateSignedUploadUrlInput,
  ): Promise<SignedUploadUrlDto> {
    StorageService.assertValidImage(input.mimeType, input.size);

    const path = `personal/${profileId}/${input.purpose}/${generateOpaqueToken(8)}-${sanitizeFileName(input.fileName)}`;
    const target = await StorageService.createSignedUploadUrl(path);

    return {
      uploadUrl: target.signedUrl,
      token: target.token,
      bucket: target.bucket,
      path: target.path,
      publicUrl: StorageService.getPublicUrl(target.path),
    };
  }
}

/** Keep only filesystem-safe characters in the stored object name. */
function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 100);
}
