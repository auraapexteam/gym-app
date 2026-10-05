import { galleryApi } from '@/api/gallery';
import axiosInstance from '@/api/axios';
import { useAuthStore } from '@/store/auth.store';

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
  if (entityType === 'profile') throw new Error('Personal photos must use private storage.');
  const generation = useAuthStore.getState().accountGeneration;
    // 1. Request signed upload URL from backend
    const res = await galleryApi.getUploadUrl({
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      size: file.size,
      entityType,
    });

    const { uploadUrl, path, publicUrl } = res.data.data;

    // 2. Stream binary directly to Supabase Storage via signed URL
    if (!uploadUrl || !path || !publicUrl) throw new Error('The gallery upload could not be prepared.');
      const uploaded = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'image/jpeg',
        },
        body: file,
      });
    if (!uploaded.ok) throw new Error('The image was not uploaded. Please retry.');
    if (generation !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please retry.');

    const cleanEntityId = entityId && entityId.trim() !== '' ? entityId : undefined;

    // 3. Register image metadata record in PostgreSQL
    await galleryApi.registerImage({
      path,
      mimeType: file.type || 'image/jpeg',
      size: file.size,
      entityType,
      entityId: cleanEntityId,
      caption,
    });

    return publicUrl;
}

export async function uploadPersonalImage(file: File, purpose: 'avatar' | 'progress-photo'): Promise<string> {
  const account = useAuthStore.getState();
  if (!account.user || !account.token) throw new Error('Please sign in before uploading.');
  const res = await axiosInstance.post('/uploads/signed-url', { fileName: file.name, mimeType: file.type, size: file.size, purpose });
  const { uploadUrl, bucket, path } = res.data.data ?? {};
  if (!res.data.success || bucket !== 'gym-personal' || typeof path !== 'string' ||
    !path.startsWith(`personal/${account.user.id}/${purpose}/`) || path.split('/').includes('..')) throw new Error('A private owned upload path was not returned.');
  const target = new URL(uploadUrl);
  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  if (target.protocol !== 'https:' || !target.hostname.endsWith('.supabase.co') ||
    decodeURIComponent(target.pathname) !== `/storage/v1/object/upload/sign/gym-personal/${path}` ||
    (projectUrl && target.origin !== new URL(projectUrl).origin)) throw new Error('Unexpected private upload destination.');
  if (account.accountGeneration !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please retry.');
  const form = new FormData(); form.append('file', file);
  const uploaded = await fetch(uploadUrl, { method: 'PUT', headers: { 'x-upsert': 'false' }, body: form });
  if (!uploaded.ok) throw new Error('The photo was not uploaded. Please retry.');
  if (account.accountGeneration !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please retry.');
  return path;
}
