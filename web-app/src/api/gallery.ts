import axiosInstance from './axios';
import type { ApiResponse } from '@/types';

export interface UploadUrlPayload {
  fileName: string;
  mimeType: string;
  size: number;
  entityType?: 'gym' | 'trainer' | 'equipment' | 'profile' | 'general';
}

export interface RegisterGalleryPayload {
  path: string;
  mimeType?: string;
  size?: number;
  entityType?: string;
  entityId?: string;
  caption?: string;
}

export const galleryApi = {
  getUploadUrl: (data: UploadUrlPayload) =>
    axiosInstance.post<ApiResponse<{ uploadUrl: string; path: string; publicUrl: string }>>(
      '/gallery/upload-url',
      data
    ),

  registerImage: (data: RegisterGalleryPayload) =>
    axiosInstance.post<ApiResponse<any>>('/gallery', data),

  getImages: (params?: { entityType?: string; entityId?: string; gymId?: string }) =>
    axiosInstance.get<ApiResponse<any[]>>('/gallery', { params }),

  deleteImage: (id: string) =>
    axiosInstance.delete<ApiResponse<any>>(`/gallery/${id}`),
};
