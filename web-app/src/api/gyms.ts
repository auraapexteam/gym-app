import axiosInstance from './axios';
import type { ApiResponse } from '@/types';
import { plansApi } from './plans';
import { galleryApi } from './gallery';
import { trainersApi } from './trainers';

export interface GymTiming {
  open: string;
  close: string;
}

export interface PublicGym {
  id: string;
  name: string;
  slug?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  description?: string;
  logoUrl?: string;
  status?: 'active' | 'suspended' | 'pending';
  timings?: Record<string, GymTiming>;
  weeklyOff?: string[];
  isSaved?: boolean;
  capacity?: number;
  galleryCount?: number;
}

export interface JoinRequest {
  id: string;
  gymId: string;
  gymName?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const gymsApi = {
  listDirectory: (params?: { search?: string; page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<PublicGym[]>>('/gyms/directory', { params }),

  getById: (gymId: string) =>
    axiosInstance.get<ApiResponse<PublicGym>>(`/gyms/${gymId}`),

  getSaved: () =>
    axiosInstance.get<ApiResponse<PublicGym[]>>('/gyms/saved'),

  toggleBookmark: (gymId: string) =>
    axiosInstance.post<ApiResponse<{ isSaved: boolean }>>(`/gyms/${gymId}/bookmark`),

  getMine: () =>
    axiosInstance.get<ApiResponse<any>>('/gyms/me'),

  updateMine: (data: any) =>
    axiosInstance.patch<ApiResponse<any>>('/gyms/me', data),

  createJoinRequest: (data: { gymId: string; notes?: string }) =>
    axiosInstance.post<ApiResponse<JoinRequest>>('/gyms/join-request', data),

  getJoinStatus: () =>
    axiosInstance.get<ApiResponse<JoinRequest | null>>('/gyms/join-request/status'),

  listPendingRequests: () =>
    axiosInstance.get<ApiResponse<JoinRequest[]>>('/gyms/join-requests/pending'),

  approveRequest: (id: string) =>
    axiosInstance.patch<ApiResponse<any>>(`/gyms/join-requests/${id}/approve`),

  rejectRequest: (id: string) =>
    axiosInstance.patch<ApiResponse<any>>(`/gyms/join-requests/${id}/reject`),
};

/** Utility function to fetch full gym catalog (Details + Plans + Gallery + Trainers) in parallel */
export const getFullGymCatalog = async (gymId: string) => {
  const [gymRes, plansRes, galleryRes, trainersRes] = await Promise.all([
    gymsApi.getById(gymId),
    plansApi.getAll({ gymId }),
    galleryApi.getImages({ gymId }),
    trainersApi.getAll({ gymId }),
  ]);

  return {
    gym: gymRes.data.data,
    plans: plansRes.data.data,
    gallery: galleryRes.data.data,
    trainers: trainersRes.data.data,
  };
};

