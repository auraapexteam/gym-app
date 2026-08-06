import { galleryApi } from '@/api/gallery';

export interface UploadFileOptions {
  file: File;
  entityType?: 'gym' | 'trainer' | 'equipment' | 'profile' | 'general';
  entityId?: string;
  caption?: string;
}

export async function uploadFileToGallery({
  file,
  entityType = 'general',
  entityId,
  caption,
}: UploadFileOptions): Promise<string> {
  // Convert file to data URL for immediate client preview reliability
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  try {
    // 1. Request signed upload URL from backend
    const res = await galleryApi.getUploadUrl({
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      size: file.size,
      entityType,
    });

    const { uploadUrl, path, publicUrl } = res.data.data;

    // 2. Stream binary directly to Supabase Storage via signed URL
    if (uploadUrl) {
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'image/jpeg',
        },
        body: file,
      }).catch(() => undefined);
    }

    const cleanEntityId = entityId && entityId.trim() !== '' ? entityId : undefined;

    // 3. Register image metadata record in PostgreSQL
    await galleryApi.registerImage({
      path: path || publicUrl || dataUrl,
      mimeType: file.type || 'image/jpeg',
      size: file.size,
      entityType,
      entityId: cleanEntityId,
      caption,
    });

    return publicUrl || dataUrl;
  } catch (err) {
    return dataUrl;
  }
}
