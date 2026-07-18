import { BaseRepository } from '@/shared/repositories';
import { GalleryRow } from '@/modules/gallery/gallery.types';

const GALLERY_COLUMNS =
  'id, gym_id, bucket, path, url, mime_type, size_bytes, entity_type, entity_id, ' +
  'caption, uploaded_by, created_at, updated_at';

export class GalleryRepository extends BaseRepository<GalleryRow> {
  constructor() {
    super('gallery_images', { softDelete: true, defaultSelect: GALLERY_COLUMNS });
  }
}

export const galleryRepository = new GalleryRepository();
