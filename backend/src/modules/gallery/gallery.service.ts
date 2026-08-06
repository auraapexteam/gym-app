import { galleryRepository } from '@/modules/gallery/gallery.repository';
import { toGalleryImageDto } from '@/modules/gallery/gallery.dto';
import {
  CreateUploadUrlInput,
  GalleryImageDto,
  RegisterImageInput,
  UploadUrlDto,
} from '@/modules/gallery/gallery.types';
import { StorageService } from '@/shared/services';
import { ListQuery, PaginatedResult } from '@/shared/types';
import { NotFoundError, BadRequestError } from '@/shared/errors';
import { generateOpaqueToken } from '@/shared/utils';

/**
 * Gallery — owns image metadata only; binary content lives in Supabase Storage.
 * Clients request a signed upload URL, upload directly to storage, then register
 * the resulting object here.
 */
export class GalleryService {
  /** Issue a pre-signed URL for a direct-to-storage upload. */
  static async createUploadUrl(gymId: string, input: CreateUploadUrlInput): Promise<UploadUrlDto> {
    StorageService.assertValidImage(input.mimeType, input.size);

    const entity = input.entityType ?? 'general';
    const path = `${gymId}/${entity}/${generateOpaqueToken(8)}-${sanitizeFileName(input.fileName)}`;
    const target = await StorageService.createSignedUploadUrl(path);

    return {
      uploadUrl: target.signedUrl,
      token: target.token,
      bucket: target.bucket,
      path: target.path,
      publicUrl: StorageService.getPublicUrl(target.path),
    };
  }

  /** Register the metadata for an already-uploaded object. */
  static async register(
    gymId: string,
    uploadedBy: string,
    input: RegisterImageInput,
  ): Promise<GalleryImageDto> {
    let cleanPath = input.path;
    if (cleanPath.includes(`/${gymId}/`)) {
      cleanPath = cleanPath.substring(cleanPath.indexOf(`${gymId}/`));
    }

    if (!cleanPath.startsWith(`${gymId}/`) && !cleanPath.startsWith('data:')) {
      cleanPath = `${gymId}/general/${Date.now()}-${cleanPath.split('/').pop() || 'photo.jpg'}`;
    }

    const publicUrl = cleanPath.startsWith('http') || cleanPath.startsWith('data:')
      ? cleanPath
      : StorageService.getPublicUrl(cleanPath);

    const row = await galleryRepository.create({
      gym_id: gymId,
      bucket: StorageService.bucket,
      path: cleanPath,
      url: publicUrl,
      mime_type: input.mimeType ?? null,
      size_bytes: input.size ?? null,
      entity_type: input.entityType ?? 'general',
      entity_id: input.entityId ?? null,
      caption: input.caption ?? null,
      uploaded_by: uploadedBy,
    });
    return toGalleryImageDto(row);
  }

  static async list(
    gymId: string,
    query: ListQuery,
    filters: { entityType?: string; entityId?: string } = {},
  ): Promise<PaginatedResult<GalleryImageDto>> {
    const result = await galleryRepository.findMany({
      gymId,
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      filters: {
        entity_type: filters.entityType,
        entity_id: filters.entityId,
      },
    });
    return { ...result, items: result.items.map(toGalleryImageDto) };
  }

  /** Soft-delete metadata and best-effort remove the underlying object. */
  static async remove(gymId: string, id: string): Promise<void> {
    const row = await galleryRepository.findById(id, gymId);
    if (!row) throw new NotFoundError('Image not found', 'IMAGE_NOT_FOUND');

    await StorageService.remove(row.path).catch(() => undefined);
    await galleryRepository.remove(id, gymId);
  }
}

/** Keep only filesystem-safe characters in the stored object name. */
function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 100);
}
