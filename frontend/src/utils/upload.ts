import { Platform } from 'react-native';
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
 * directly to Supabase Storage using React Native multipart FormData, and returns
 * its public URL. Throws if the upload fails — callers must not treat a thrown
 * upload as saved.
 */
export async function uploadPersonalImage(asset: PickedImageAsset, purpose: UploadPurpose): Promise<string> {
  const fileName = asset.fileName || `${purpose}-${Date.now()}.jpg`;
  const mimeType = asset.type || 'image/jpeg';
  const size = asset.fileSize || 1024 * 100;

  const res = await apiClient.post('/uploads/signed-url', { fileName, mimeType, size, purpose });
  if (!res.data?.success) {
    throw new Error(res.data?.message || 'Failed to create upload URL');
  }
  const { bucket, path, token, publicUrl } = res.data.data;

  const fileData = {
    uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
    name: fileName,
    type: mimeType,
  };

  const formData = new FormData();
  formData.append('file', fileData as unknown as Blob);

  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, formData, {
    contentType: mimeType,
    upsert: true,
  });
  if (error) {
    throw new Error(error.message || 'Image upload failed. Please try again.');
  }

  return publicUrl as string;
}
