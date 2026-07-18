export type GalleryEntityType = 'gym' | 'trainer' | 'equipment' | 'profile' | 'general';

export interface GalleryRow {
  id: string;
  gym_id: string;
  bucket: string;
  path: string;
  url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  entity_type: GalleryEntityType;
  entity_id: string | null;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImageDto {
  id: string;
  gymId: string;
  bucket: string;
  path: string;
  url: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  entityType: GalleryEntityType;
  entityId: string | null;
  caption: string | null;
  createdAt: string;
}

export interface UploadUrlDto {
  uploadUrl: string;
  token: string;
  bucket: string;
  path: string;
  publicUrl: string;
}

export interface CreateUploadUrlInput {
  fileName: string;
  mimeType: string;
  size: number;
  entityType?: GalleryEntityType;
}

export interface RegisterImageInput {
  path: string;
  mimeType?: string;
  size?: number;
  entityType?: GalleryEntityType;
  entityId?: string;
  caption?: string;
}
