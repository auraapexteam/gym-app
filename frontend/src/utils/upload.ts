import { Platform } from 'react-native';
import { apiClient } from '../api/client';

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
 * its public URL.
 */
export async function uploadPersonalImage(asset: PickedImageAsset, purpose: UploadPurpose): Promise<string> {
  if (!asset?.uri) {
    throw new Error('No image file selected.');
  }

  const fileName = asset.fileName || `${purpose}-${Date.now()}.jpg`;
  const mimeType = asset.type || 'image/jpeg';
  const size = asset.fileSize || 1024 * 100;

  // 1. Get signed URL from API
  const res = await apiClient.post('/uploads/signed-url', { fileName, mimeType, size, purpose });
  if (!res.data?.success) {
    throw new Error(res.data?.message || 'Failed to create upload URL');
  }
  const { uploadUrl, signedUrl, publicUrl } = res.data.data || {};
  const targetUrl = uploadUrl || signedUrl;

  if (!targetUrl) {
    throw new Error('Server did not return a valid signed upload URL');
  }

  // 2. Prepare React Native FormData
  const fileData = {
    uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
    name: fileName,
    type: mimeType,
  };

  const formData = new FormData();
  formData.append('file', fileData as unknown as Blob);

  // 3. Upload directly to Supabase Storage via signed URL
  let response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'x-upsert': 'true',
    },
    body: formData,
  });

  if (!response.ok) {
    // Retry with PUT if POST is rejected by storage proxy
    response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'x-upsert': 'true',
      },
      body: formData,
    });
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Upload failed with status ${response.status}`);
  }

  return (publicUrl || '') as string;
}

