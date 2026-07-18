import { GalleryRow, GalleryImageDto } from '@/modules/gallery/gallery.types';

export const toGalleryImageDto = (row: GalleryRow): GalleryImageDto => ({
  id: row.id,
  gymId: row.gym_id,
  bucket: row.bucket,
  path: row.path,
  url: row.url,
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  entityType: row.entity_type,
  entityId: row.entity_id,
  caption: row.caption,
  createdAt: row.created_at,
});
