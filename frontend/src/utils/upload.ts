import { apiClient } from '../api/client';
import { supabase } from '../api/supabase';

export type UploadPurpose = 'avatar' | 'progress-photo';

export interface PickedImageAsset {
  uri: string;
  fileName?: string | null;
  type?: string | null;
  fileSize?: number | null;
}

/**
 * Requests a signed upload URL from the backend, uploads the picked image
 * directly to Supabase Storage, and returns its public URL. Mirrors the
 * gallery module's "signed URL, then direct upload" pattern used elsewhere
 * in this codebase — binary data never passes through the Express backend.
 */
export async function uploadPersonalImage(asset: PickedImageAsset, purpose: UploadPurpose): Promise<string> {
  const fileName = asset.fileName || `${purpose}-${Date.now()}.jpg`;
  const mimeType = asset.type || 'image/jpeg';
  const size = asset.fileSize || 0;

  const res = await apiClient.post('/uploads/signed-url', { fileName, mimeType, size, purpose });
  if (!res.data?.success) {
    throw new Error(res.data?.message || 'Failed to create upload URL');
  }
  const { bucket, path, token, publicUrl } = res.data.data;

  const fileRes = await fetch(asset.uri);
  const blob = await fileRes.blob();

  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, blob, {
    contentType: mimeType,
  });
  if (error) throw error;

  return publicUrl as string;
}
