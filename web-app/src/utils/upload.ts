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
      });
    }

    // 3. Register image metadata record in PostgreSQL
    await galleryApi.registerImage({
      path,
      mimeType: file.type,
      size: file.size,
      entityType,
      entityId,
      caption,
    });

    return publicUrl;
  } catch (err) {
    // Fallback data URL if direct upload fails
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}
